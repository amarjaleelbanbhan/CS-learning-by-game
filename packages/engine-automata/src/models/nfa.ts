import type { StateId } from '@arc/shared';
import type { Sym } from './dfa.js';

/** Sentinel key for ε (empty-string) transitions. Never appears in `alphabet`. */
export const EPSILON = 'ε';

/** Nondeterministic Finite Automaton with ε-transitions. */
export interface NFA {
  readonly alphabet: readonly Sym[];
  readonly states: readonly StateId[];
  readonly start: StateId;
  readonly accepting: ReadonlySet<StateId>;
  /** state -> (symbol | EPSILON) -> set of target states */
  readonly delta: ReadonlyMap<StateId, ReadonlyMap<Sym, ReadonlySet<StateId>>>;
}

/** All states reachable from `states` using only ε-transitions (incl. the inputs). */
export function epsilonClosure(nfa: NFA, states: Iterable<StateId>): Set<StateId> {
  const closure = new Set<StateId>(states);
  const stack = [...closure];
  while (stack.length > 0) {
    const s = stack.pop()!;
    const eps = nfa.delta.get(s)?.get(EPSILON);
    if (!eps) continue;
    for (const t of eps) {
      if (!closure.has(t)) {
        closure.add(t);
        stack.push(t);
      }
    }
  }
  return closure;
}

/** States reachable from `states` by consuming exactly one `sym` (no ε applied). */
export function move(nfa: NFA, states: Iterable<StateId>, sym: Sym): Set<StateId> {
  const result = new Set<StateId>();
  for (const s of states) {
    const targets = nfa.delta.get(s)?.get(sym);
    if (targets) for (const t of targets) result.add(t);
  }
  return result;
}

/** Returns true iff the NFA accepts `input` (ε-closure on each step). */
export function acceptsNFA(nfa: NFA, input: string): boolean {
  let current = epsilonClosure(nfa, [nfa.start]);
  for (const ch of input) {
    current = epsilonClosure(nfa, move(nfa, current, ch));
    if (current.size === 0) return false;
  }
  for (const s of current) {
    if (nfa.accepting.has(s)) return true;
  }
  return false;
}
