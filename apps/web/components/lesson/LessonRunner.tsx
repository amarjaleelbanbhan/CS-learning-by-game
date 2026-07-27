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
  jumpTo,
  type Lesson,
} from '@arc/engine-lesson';
import { Panel } from '@/components/ui/Panel';
import { HoloButton } from '@/components/ui/HoloButton';
import { ContentBlocks } from './ContentBlocks';

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
  /** Fired once, when the last completion-gated stage is satisfied. */
  onComplete?: () => void;
}) {
  const [progress, setProgress] = useState(() => initProgress(lesson));
  const [completedWidgets, setCompletedWidgets] = useState<ReadonlySet<string>>(new Set());
  const [announcedComplete, setAnnouncedComplete] = useState(false);

  const stage = lesson.stages[progress.currentIndex];
  const ratio = completionRatio(lesson, progress);

  const finishIfComplete = useCallback(
    (next: typeof progress) => {
      setProgress(next);
      if (!announcedComplete && isLessonComplete(lesson, next)) {
        setAnnouncedComplete(true);
        onComplete?.();
      }
    },
    [lesson, onComplete, announcedComplete],
  );

  const handleWidgetComplete = useCallback(
    (widgetId: string) => {
      setCompletedWidgets((prev) => new Set(prev).add(widgetId));
      // A widget satisfying itself satisfies the stage that hosts it — that is what
      // "requiresCompletion" means for an interactive stage.
      const current = lesson.stages[progress.currentIndex];
      if (current) finishIfComplete(completeStage(progress, current.id));
    },
    [lesson, progress, finishIfComplete],
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
          onClick={() => finishIfComplete(advance(lesson, progress))}
          disabled={!canAdvance(lesson, progress)}
        >
          Next →
        </HoloButton>
      </div>
    </div>
  );
}
