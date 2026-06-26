import { stateId, type StateId } from '@arc/shared';
import type { DFA, Sym } from '../models/dfa.js';
import { EPSILON, epsilonClosure, move, type NFA } from '../models/nfa.js';

/** Canonical label for a subset of NFA states (sorted, comma-joined). */
export function subsetLabel(set: ReadonlySet<StateId>): string {
  return [...set].sort().join(',');
}

export interface SubsetStep {
  readonly from: ReadonlySet<StateId>;
  readonly symbol: Sym;
  readonly to: ReadonlySet<StateId>;
}

export interface SubsetConstructionResult {
  readonly dfa: DFA;
  /** Ordered record of subset generation — drives the flagship visualizer. */
  readonly steps: readonly SubsetStep[];
}

/**
 * Subset (powerset) construction: builds the equivalent DFA from an ε-NFA.
 * Produces a *total* DFA including an explicit dead state (empty subset) so that
 * every input has a defined run. Also records the generation steps for animation.
 */
export function subsetConstruction(nfa: NFA): SubsetConstructionResult {
  const alphabet = nfa.alphabet.filter((s) => s !== EPSILON);
  const startSet = epsilonClosure(nfa, [nfa.start]);

  const dfaStates: StateId[] = [];
  const accepting = new Set<StateId>();
  const delta = new Map<StateId, Map<Sym, StateId>>();
  const seen = new Set<string>();
  const queue: Array<{ label: string; set: Set<StateId> }> = [];
  const steps: SubsetStep[] = [];

  const discover = (set: Set<StateId>): string => {
    const label = subsetLabel(set);
    if (!seen.has(label)) {
      seen.add(label);
      dfaStates.push(stateId(label));
      queue.push({ label, set });
      if ([...set].some((s) => nfa.accepting.has(s))) accepting.add(stateId(label));
    }
    return label;
  };

  discover(startSet);

  while (queue.length > 0) {
    const { label, set } = queue.shift()!;
    const row = new Map<Sym, StateId>();
    for (const sym of alphabet) {
      const target = epsilonClosure(nfa, move(nfa, set, sym));
      const targetLabel = discover(target);
      row.set(sym, stateId(targetLabel));
      steps.push({ from: set, symbol: sym, to: target });
    }
    delta.set(stateId(label), row);
  }

  return {
    dfa: {
      alphabet,
      states: dfaStates,
      start: stateId(subsetLabel(startSet)),
      accepting,
      delta,
    },
    steps,
  };
}
