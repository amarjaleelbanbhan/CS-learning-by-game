import { stateId, type StateId } from '@arc/shared';
import type { DFA, Sym } from '../models/dfa.js';

/** Canonical label for the dead/trap state introduced by completion. */
export const DEAD_STATE = stateId('∅');

/**
 * Returns a total DFA: every (state, symbol) has a defined transition. Missing
 * transitions are routed to an explicit non-accepting dead state. Required by
 * product/minimize/equivalence which assume totality.
 */
export function completeDfa(dfa: DFA): DFA {
  let needsDead = false;
  const delta = new Map<StateId, Map<Sym, StateId>>();

  for (const s of dfa.states) {
    const row = new Map<Sym, StateId>();
    const existing = dfa.delta.get(s);
    for (const sym of dfa.alphabet) {
      const t = existing?.get(sym);
      if (t === undefined) {
        needsDead = true;
        row.set(sym, DEAD_STATE);
      } else {
        row.set(sym, t);
      }
    }
    delta.set(s, row);
  }

  if (needsDead) {
    const deadRow = new Map<Sym, StateId>();
    for (const sym of dfa.alphabet) deadRow.set(sym, DEAD_STATE);
    delta.set(DEAD_STATE, deadRow);
  }

  return {
    alphabet: [...dfa.alphabet],
    states: needsDead ? [...dfa.states, DEAD_STATE] : [...dfa.states],
    start: dfa.start,
    accepting: new Set(dfa.accepting),
    delta,
  };
}

/** States reachable from the start state by following transitions. */
export function reachableStates(dfa: DFA): Set<StateId> {
  const seen = new Set<StateId>([dfa.start]);
  const stack: StateId[] = [dfa.start];
  while (stack.length > 0) {
    const s = stack.pop()!;
    const row = dfa.delta.get(s);
    if (!row) continue;
    for (const t of row.values()) {
      if (!seen.has(t)) {
        seen.add(t);
        stack.push(t);
      }
    }
  }
  return seen;
}
