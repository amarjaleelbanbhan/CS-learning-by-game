'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  assess,
  countsAsAttempt,
  createDefaultRegistry,
  type Verdict,
} from '@arc/engine-assessment';
import { taskXp, type Task } from '@arc/engine-lesson';
import { unlockedHintTier } from '@arc/engine-assessment';
import { Panel } from '@/components/ui/Panel';
import { HoloButton } from '@/components/ui/HoloButton';
import { playSfx } from '@/lib/fx/sound';
import { resolveSpec } from './taskSpecs';
import { resolveInteraction } from './interactionRegistry';

/**
 * The universal bridge between curriculum data and gameplay:
 *
 *     Task → Interaction → Grader → Verdict → Feedback → Progress
 *
 * One component runs every graded task in the game. It knows nothing about automata,
 * grammars or Turing machines — it resolves a widget by id, a grader by id and a spec by
 * ref, then renders whatever verdict comes back. Adding a topic means adding content plus
 * a grader, never editing this file.
 */

const REGISTRY = createDefaultRegistry();

export interface TaskRunnerProps {
  readonly task: Task;
  /** Fired once, the first time the task is solved. Carries the XP actually earned. */
  readonly onSolved?: (xp: number) => void;
  /** Fired on every graded attempt, for analytics. Not fired for invalid answers. */
  readonly onAttempt?: (verdict: Verdict) => void;
}

export function TaskRunner({ task, onSolved, onAttempt }: TaskRunnerProps) {
  const [answer, setAnswer] = useState<unknown>(undefined);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [solved, setSolved] = useState(false);

  /**
   * The grader's spec is the resolved reference data with the task's authored params
   * layered on top. Both halves are needed: `specRef` supplies the machine (not
   * JSON-serialisable), `params` supplies the per-task detail (which string to predict).
   * Passing only the former makes a grader read `undefined` and throw mid-click.
   */
  const spec = useMemo(() => {
    const resolved = task.specRef ? resolveSpec(task.specRef) : {};
    return resolved === undefined ? undefined : { ...resolved, ...(task.params ?? {}) };
  }, [task.specRef, task.params]);
  const grader = task.graderId ? REGISTRY.get(task.graderId) : undefined;
  const Interaction = task.widgetId ? resolveInteraction(task.widgetId) : undefined;

  const hints = task.hints ?? [];
  // Hints are earned, never offered: the tier the player has unlocked is a function of
  // how many real attempts they have made (design bible corollary 3).
  // `unlockedHintTier` returns a zero-based tier INDEX (-1 = nothing earned yet), so the
  // count of available hints is one more than that.
  const availableHints = Math.min(hints.length, unlockedHintTier(failedAttempts) + 1);

  const submit = useCallback(() => {
    if (grader === undefined || spec === undefined || solved) return;

    const result = assess(grader as never, answer, spec as never);
    setVerdict(result);

    if (!countsAsAttempt(result)) {
      // Structurally unfinished — not a wrong answer, so it costs nothing.
      return;
    }

    onAttempt?.(result);

    if (result.outcome === 'correct') {
      setSolved(true);
      playSfx('success');
      onSolved?.(taskXp(task, hintsRevealed));
    } else {
      setFailedAttempts((n) => n + 1);
      playSfx('error');
    }
  }, [grader, spec, answer, solved, task, hintsRevealed, onSolved, onAttempt]);

  if (grader === undefined) {
    return (
      <Panel className="border-reject/30 bg-reject/5 p-4">
        <p className="text-sm text-reject">
          Task &quot;{task.id}&quot; names an unknown grader ({task.graderId}).
        </p>
      </Panel>
    );
  }
  if (Interaction === undefined) {
    return (
      <Panel className="border-reject/30 bg-reject/5 p-4">
        <p className="text-sm text-reject">
          Task &quot;{task.id}&quot; names an unknown interaction ({task.widgetId}).
        </p>
      </Panel>
    );
  }
  if (spec === undefined) {
    return (
      <Panel className="border-reject/30 bg-reject/5 p-4">
        <p className="text-sm text-reject">
          Task &quot;{task.id}&quot; references an unknown spec ({task.specRef}).
        </p>
      </Panel>
    );
  }

  return (
    <Panel className="space-y-4 p-4" glow={solved}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-display text-[10px] uppercase tracking-[0.25em] text-arc-cyan/70">
            {task.verb}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-ink-hi">{task.prompt}</p>
        </div>
        {solved && (
          <span className="shrink-0 rounded-lg border border-accept/40 bg-accept/10 px-2 py-1 font-display text-[10px] uppercase tracking-wider text-accept">
            ✓ Solved
          </span>
        )}
      </div>

      <Interaction
        params={task.params ?? {}}
        value={answer}
        onChange={setAnswer}
        onSubmit={submit}
        disabled={solved}
      />

      {verdict && <VerdictPanel verdict={verdict} />}

      {hints.length > 0 && !solved && (
        <HintSection
          hints={hints}
          available={availableHints}
          revealed={hintsRevealed}
          failedAttempts={failedAttempts}
          onReveal={() => setHintsRevealed((n) => n + 1)}
        />
      )}
    </Panel>
  );
}

/**
 * Renders any verdict. Tone carries an icon and a word, never colour alone (NFR-A11Y-2),
 * and `invalid` is visually distinct from `incorrect` because they mean different things
 * to the player: one is "finish this", the other is "you were wrong".
 */
function VerdictPanel({ verdict }: { verdict: Verdict }) {
  const tone = {
    correct: {
      className: 'border-accept/40 bg-accept/10 text-accept',
      icon: '✓',
      label: 'Correct',
    },
    partial: {
      className: 'border-arc-gold/40 bg-arc-gold/10 text-arc-gold',
      icon: '◐',
      label: 'Partly right',
    },
    incorrect: {
      className: 'border-reject/40 bg-reject/10 text-reject',
      icon: '✕',
      label: 'Not yet',
    },
    invalid: {
      className: 'border-ink-low/40 bg-ink-low/10 text-ink-mid',
      icon: 'ℹ',
      label: 'Unfinished',
    },
  }[verdict.outcome];

  return (
    <div role="status" aria-live="polite" className={`rounded-xl border p-3.5 ${tone.className}`}>
      <div className="mb-1 flex items-center gap-1.5 font-display text-[10px] uppercase tracking-wider opacity-80">
        <span aria-hidden="true">{tone.icon}</span>
        <span>{tone.label}</span>
        {verdict.outcome === 'partial' && (
          <span className="ml-1 font-mono normal-case opacity-70">
            {Math.round(verdict.score * 100)}%
          </span>
        )}
      </div>

      {verdict.feedback.map((line, i) => (
        <p key={i} className="text-sm leading-relaxed">
          {line}
        </p>
      ))}

      {verdict.counterexample && (
        <div className="mt-2 rounded-lg border border-current/20 bg-void/40 p-2.5 font-mono text-xs">
          <div className="mb-1 font-display text-[10px] uppercase tracking-wider opacity-70">
            Counterexample
          </div>
          <div>
            &quot;{verdict.counterexample.input || 'ε'}&quot; — yours{' '}
            {verdict.counterexample.playerResult}, {verdict.counterexample.expectedResult}
          </div>
        </div>
      )}

      {verdict.mistakes.length > 0 && verdict.outcome !== 'invalid' && (
        <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs opacity-90">
          {verdict.mistakes.map((m, i) => (
            <li key={i}>{m.message}</li>
          ))}
        </ul>
      )}

      {verdict.nextStep && (
        <p className="mt-2 border-t border-current/15 pt-2 text-xs italic opacity-85">
          {verdict.nextStep}
        </p>
      )}
    </div>
  );
}

function HintSection({
  hints,
  available,
  revealed,
  failedAttempts,
  onReveal,
}: {
  hints: readonly string[];
  available: number;
  revealed: number;
  failedAttempts: number;
  onReveal: () => void;
}) {
  return (
    <div className="rounded-xl border border-ink-low/20 p-3">
      <div className="mb-2 font-display text-[10px] uppercase tracking-wider text-ink-low">
        Hints ({revealed}/{hints.length})
      </div>
      {hints.slice(0, revealed).map((hint, i) => (
        <p key={i} className="mb-1 text-xs leading-relaxed text-ink-mid">
          {i + 1}. {hint}
        </p>
      ))}
      {revealed < available ? (
        <HoloButton onClick={onReveal} className="mt-1 text-xs">
          Reveal a hint (−20% XP)
        </HoloButton>
      ) : (
        revealed < hints.length && (
          <p className="text-xs italic text-ink-low">
            {/* Honest about the gate rather than showing a dead button. */}
            Next hint unlocks after{' '}
            {failedAttempts === 0 ? 'your first attempt' : 'another attempt'}.
          </p>
        )
      )}
    </div>
  );
}
