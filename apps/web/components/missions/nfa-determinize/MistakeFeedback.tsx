'use client';

import type { SubsetMistake, SubsetMistakeKind } from '@arc/engine-assessment';
import { Panel } from '@/components/ui/Panel';

const MISTAKE_LABEL: Record<SubsetMistakeKind, string> = {
  'missing-subset': 'Missing Subset',
  'wrong-transition': 'Wrong Transition',
  'wrong-accepting': 'Wrong Accepting Flag',
  'wrong-epsilon-closure': 'Missed ε-Closure',
  'duplicate-subset': 'Duplicate Subset',
  'unused-state': 'Unused State',
};

/**
 * Prioritizes the most pedagogically useful mistake kinds first — an ε-closure slip is
 * the misconception this mission specifically targets, so it leads; structural noise
 * like an unused state is the least urgent. Caps the visible list so a sloppy first
 * attempt doesn't dump a wall of text on the player.
 */
const PRIORITY: readonly SubsetMistakeKind[] = [
  'wrong-epsilon-closure',
  'missing-subset',
  'duplicate-subset',
  'wrong-transition',
  'wrong-accepting',
  'unused-state',
];

const MAX_SHOWN = 3;

export function MistakeFeedback({
  mistakes,
  counterexample,
}: {
  mistakes: readonly SubsetMistake[];
  counterexample: string | null;
}) {
  if (mistakes.length === 0 && !counterexample) return null;

  const sorted = [...mistakes].sort((a, b) => PRIORITY.indexOf(a.kind) - PRIORITY.indexOf(b.kind));
  const shown = sorted.slice(0, MAX_SHOWN);
  const hiddenCount = sorted.length - shown.length;

  return (
    <Panel className="border-reject/25 bg-reject/5 p-4">
      {counterexample !== null && (
        <p className="font-mono text-sm text-reject">
          Diverges on input:{' '}
          <span className="text-ink-hi">&quot;{counterexample || 'ε'}&quot;</span>
        </p>
      )}
      {shown.length > 0 && (
        <ul className="mt-3 space-y-2">
          {shown.map((m, i) => (
            <li key={i} className="rounded-lg border border-reject/20 bg-void/40 p-2.5 text-xs">
              <span className="font-display uppercase tracking-wider text-reject">
                {MISTAKE_LABEL[m.kind]}
              </span>
              <p className="mt-1 text-ink-mid">{m.detail}</p>
            </li>
          ))}
        </ul>
      )}
      {hiddenCount > 0 && (
        <p className="mt-2 text-[11px] text-ink-low">+{hiddenCount} more issue(s) to find.</p>
      )}
    </Panel>
  );
}
