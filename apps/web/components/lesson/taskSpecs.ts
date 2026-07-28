import { subsetConstruction } from '@arc/engine-automata';
import { containsAaView, endsIn01View, nfaEndsIn01View } from '@/lib/automata/examples';

/**
 * Resolves a task's `specRef` to the real problem definition handed to a grader.
 *
 * This indirection exists because specs contain Maps and Sets (a reference DFA/NFA),
 * which are not JSON-serialisable — and lesson content must stay serialisable so it can
 * eventually live in `missions.content jsonb`. Content names a spec; the app resolves it,
 * exactly as it resolves widget ids to components.
 *
 * The lesson content test fails CI if content references an id that isn't here, so a typo
 * is caught at build time rather than rendering a broken task.
 */
export type TaskSpec = Readonly<Record<string, unknown>>;

/** The DFA that subset construction produces from the ε-NFA for "ends in 01". */
function endsIn01Determinized() {
  return subsetConstruction(nfaEndsIn01View().nfa).dfa;
}

const SPECS: Readonly<Record<string, () => TaskSpec>> = {
  // Calibration — the fixed DFA for strings ending in "01".
  'ends-in-01-machine': () => ({ machine: endsIn01View().dfa }),
  'ends-in-01-reference': () => ({ reference: endsIn01View().dfa }),

  // Quantum Lab — the NFA for strings containing "aa".
  'contains-aa-machine': () => ({ machine: containsAaView().nfa }),

  // Research Archive — the NFA→DFA mission.
  'nfa-ends-in-01-machine': () => ({ machine: nfaEndsIn01View().nfa }),
  /**
   * How many states subset construction yields. Computed rather than hard-coded so the
   * expected answer can never drift out of sync with the machine the player is shown.
   */
  'nfa-ends-in-01-state-count': () => ({
    expected: endsIn01Determinized().states.length,
    nearMissHint:
      'Count the reachable subsets, not every possible one — most subsets are never reached.',
  }),
  'nfa-ends-in-01-determinized': () => ({ reference: endsIn01Determinized() }),
};

export function resolveSpec(specRef: string): TaskSpec | undefined {
  return SPECS[specRef]?.();
}

export function specIds(): readonly string[] {
  return Object.keys(SPECS).sort();
}
