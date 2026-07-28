'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  advance,
  canAdvance,
  completeStage,
  completionRatio,
  goBack,
  initProgress,
  isLessonComplete,
  isStageCompleted,
  isStageUnlocked,
  isGraded,
  jumpTo,
  type Lesson,
  type Task,
} from '@arc/engine-lesson';
import type { Verdict } from '@arc/engine-assessment';
import { Panel } from '@/components/ui/Panel';
import { HoloButton } from '@/components/ui/HoloButton';
import { ContentBlocks } from './ContentBlocks';
import { TaskRunner } from './TaskRunner';
import { useCareerStore } from '@/components/state/careerStore';
import { useGameStore } from '@/components/state/gameStore';
import { boostedRewards } from '@/lib/world/rewards';
import { playSfx } from '@/lib/fx/sound';

/**
 * Renders any lesson (FR-LESSON-1..3). One component serves every topic — this is what
 * replaces "a bespoke React component per mission".
 *
 * The engine owns all gating decisions; this component only draws them and reports
 * completion upward, so navigation rules stay pure and unit-tested rather than tangled
 * into JSX.
 */
export function LessonRunner({
  lesson,
  onComplete,
}: {
  lesson: Lesson;
  /**
   * Fired once, when the last completion-gated stage is satisfied. Receives the XP the
   * player actually earned from graded tasks — so the mission pays for decisions made,
   * not for reaching the end.
   */
  onComplete?: (earnedXp: number) => void;
}) {
  const [progress, setProgress] = useState(() => initProgress(lesson));
  const [completedWidgets, setCompletedWidgets] = useState<ReadonlySet<string>>(new Set());
  const [solvedTasks, setSolvedTasks] = useState<ReadonlySet<string>>(new Set());
  const [earnedXp, setEarnedXp] = useState(0);
  const [announcedComplete, setAnnouncedComplete] = useState(false);
  const recordAttemptInStore = useCareerStore((s) => s.recordAttempt);
  const completeMission = useGameStore((s) => s.completeMission);
  const alreadyCompleted = useGameStore((s) => Boolean(s.completed[lesson.missionId]));

  const stage = lesson.stages[progress.currentIndex];
  const ratio = completionRatio(lesson, progress);

  const finishIfComplete = useCallback(
    (next: typeof progress, xpSoFar: number) => {
      setProgress(next);
      if (!announcedComplete && isLessonComplete(lesson, next)) {
        setAnnouncedComplete(true);
        // Award here rather than in each route, so every lesson pays out identically and
        // a new mission is content plus a route with no reward boilerplate to forget.
        // The amount is what the player EARNED from graded tasks — a lesson with no
        // graded tasks pays nothing, by construction.
        if (!alreadyCompleted && xpSoFar > 0) {
          completeMission(
            lesson.missionId,
            ...boostedRewards(lesson.missionId, xpSoFar, Math.round(xpSoFar * 0.3)),
          );
          playSfx('reward');
        }
        onComplete?.(xpSoFar);
      }
    },
    [lesson, onComplete, announcedComplete, alreadyCompleted, completeMission],
  );

  const handleWidgetComplete = useCallback(
    (widgetId: string) => {
      setCompletedWidgets((prev) => new Set(prev).add(widgetId));
      // A widget satisfying itself satisfies the stage that hosts it — that is what
      // "requiresCompletion" means for an interactive stage.
      const current = lesson.stages[progress.currentIndex];
      if (current) finishIfComplete(completeStage(progress, current.id), earnedXp);
    },
    [lesson, progress, finishIfComplete, earnedXp],
  );

  /** Graded tasks on the current stage. Passive verbs render as content, not as a task. */
  const gradedTasks = useMemo(() => (stage?.tasks ?? []).filter(isGraded), [stage]);

  /**
   * A stage is satisfied when EVERY graded task on it is solved. Partial credit does not
   * unlock the next stage — the player either did the computational work or did not.
   */
  const handleTaskSolved = useCallback(
    (taskId: string, xp: number) => {
      const nextSolved = new Set(solvedTasks).add(taskId);
      const nextXp = earnedXp + xp;
      setSolvedTasks(nextSolved);
      setEarnedXp(nextXp);

      const current = lesson.stages[progress.currentIndex];
      if (current && gradedTasks.every((t) => nextSolved.has(t.id))) {
        finishIfComplete(completeStage(progress, current.id), nextXp);
      }
    },
    [lesson, progress, gradedTasks, solvedTasks, earnedXp, finishIfComplete],
  );

  /** Feeds the analytics pipeline that was previously fed from exactly one call site. */
  const recordAttempt = useCallback(
    (task: Task, verdict: Verdict) => {
      recordAttemptInStore({
        missionId: lesson.missionId,
        conceptId: lesson.conceptId,
        correct: verdict.outcome === 'correct',
        hintsUsed: 0,
        attempts: 1,
        timeMs: 0,
        // Task-driven missions no longer hand out the worked animation as a shortcut;
        // the player reaches the reveal by solving, so nothing was spoiled.
        usedVisualization: false,
        completedAt: Date.now(),
      });
      void task;
    },
    [lesson, recordAttemptInStore],
  );

  const stageStatus = useMemo(
    () =>
      lesson.stages.map((s, i) => ({
        id: s.id,
        title: s.title,
        unlocked: isStageUnlocked(lesson, progress, i),
        completed: isStageCompleted(progress, s.id),
        current: i === progress.currentIndex,
      })),
    [lesson, progress],
  );

  if (!stage) return null;

  return (
    <div className="space-y-5">
      <Panel className="p-5" glow>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="font-display text-[11px] uppercase tracking-[0.3em] text-arc-cyan/80">
              {stage.kind.replace(/-/g, ' ')}
            </div>
            <h1 className="mt-1 font-display text-2xl font-bold text-glow">{lesson.title}</h1>
          </div>
          <div className="text-right">
            <div className="font-mono text-sm text-arc-cyan">{Math.round(ratio * 100)}%</div>
            <div className="text-[10px] uppercase tracking-wider text-ink-low">complete</div>
          </div>
        </div>

        {/* Stage rail — also the progress indicator. Locked stages are disabled, not hidden,
            so the learner can see the shape of what is ahead. */}
        <nav aria-label="Lesson stages" className="mt-4 flex flex-wrap gap-1.5">
          {stageStatus.map((s, i) => (
            <button
              key={s.id}
              type="button"
              disabled={!s.unlocked}
              aria-current={s.current ? 'step' : undefined}
              onClick={() => setProgress((p) => jumpTo(lesson, p, i))}
              className={`rounded-md border px-2 py-1 text-[11px] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                s.current
                  ? 'border-arc-cyan/60 bg-arc-cyan/10 text-arc-cyan'
                  : s.completed
                    ? 'border-accept/40 text-accept'
                    : 'border-ink-low/20 text-ink-mid hover:border-arc-cyan/30'
              }`}
            >
              {s.completed && <span aria-hidden="true">✓ </span>}
              {!s.unlocked && <span aria-hidden="true">🔒 </span>}
              {s.title}
            </button>
          ))}
        </nav>
      </Panel>

      <Panel className="p-5">
        <h2 className="mb-3 font-display text-sm uppercase tracking-widest text-ink-mid">
          {stage.title}
        </h2>
        <ContentBlocks
          blocks={stage.blocks}
          onWidgetComplete={handleWidgetComplete}
          completedWidgets={completedWidgets}
        />

        {gradedTasks.length > 0 && (
          <div className="mt-5 space-y-4">
            {gradedTasks.map((task) => (
              <TaskRunner
                key={task.id}
                task={task}
                onSolved={(xp) => handleTaskSolved(task.id, xp)}
                onAttempt={(verdict) => recordAttempt(task, verdict)}
              />
            ))}
          </div>
        )}
      </Panel>

      <div className="flex items-center justify-between gap-3">
        <HoloButton
          intent="ghost"
          onClick={() => setProgress((p) => goBack(p))}
          disabled={progress.currentIndex === 0}
        >
          ← Back
        </HoloButton>

        {/* An explicit, honest reason beats a mysteriously dead button. */}
        {stage.requiresCompletion && !isStageCompleted(progress, stage.id) && (
          <p className="text-xs text-ink-low" role="status">
            Finish this stage to continue.
          </p>
        )}

        <HoloButton
          intent="primary"
          onClick={() => finishIfComplete(advance(lesson, progress), earnedXp)}
          disabled={!canAdvance(lesson, progress)}
        >
          Next →
        </HoloButton>
      </div>
    </div>
  );
}
