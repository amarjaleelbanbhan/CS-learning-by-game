import type { StateId } from '@arc/shared';

/** A single alphabet symbol (kept as a string so multi-char tokens are possible). */
export type Sym = string;

/**
 * Deterministic Finite Automaton.
 *
 * `delta` may be partial; a missing transition means an implicit dead state
 * (the string is rejected). `subsetConstruction` always produces a *total* delta.
 */
export interface DFA {
  readonly alphabet: readonly Sym[];
  readonly states: readonly StateId[];
  readonly start: StateId;
  readonly accepting: ReadonlySet<StateId>;
  readonly delta: ReadonlyMap<StateId, ReadonlyMap<Sym, StateId>>;
}

/** Returns true iff the DFA accepts `input`. */
export function accepts(dfa: DFA, input: string): boolean {
  let current: StateId | undefined = dfa.start;
  for (const ch of input) {
    if (current === undefined) return false;
    current = dfa.delta.get(current)?.get(ch);
  }
  return current !== undefined && dfa.accepting.has(current);
}
