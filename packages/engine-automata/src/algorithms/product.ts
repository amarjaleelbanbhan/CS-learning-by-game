import { stateId, type StateId } from '@arc/shared';
import type { DFA, Sym } from '../models/dfa.js';
import { completeDfa } from './util.js';

export type ProductMode = 'intersection' | 'union' | 'difference' | 'symmetric';

function combine(mode: ProductMode, a: boolean, b: boolean): boolean {
  switch (mode) {
    case 'intersection':
      return a && b;
    case 'union':
      return a || b;
    case 'difference':
      return a && !b;
    case 'symmetric':
      return a !== b;
  }
}

const pair = (a: StateId, b: StateId): string => `${a}|${b}`;

/**
 * Cartesian product of two DFAs. The acceptance condition over the combined
 * states is chosen by `mode` (∩, ∪, set difference, or symmetric difference).
 * Only states reachable from the combined start are materialized, and the
 * generation order is recorded for the side-by-side product visualizer.
 */
export function productDfa(a: DFA, b: DFA, mode: ProductMode): DFA {
  const alphabet = [...new Set([...a.alphabet, ...b.alphabet])];
  const ca = completeDfa({ ...a, alphabet });
  const cb = completeDfa({ ...b, alphabet });

  const accepts = (sa: StateId, sb: StateId): boolean =>
    combine(mode, ca.accepting.has(sa), cb.accepting.has(sb));

  const startLabel = pair(ca.start, cb.start);
  const states: StateId[] = [stateId(startLabel)];
  const accepting = new Set<StateId>();
  const delta = new Map<StateId, Map<Sym, StateId>>();
  const seen = new Set<string>([startLabel]);
  const queue: Array<[StateId, StateId]> = [[ca.start, cb.start]];
  if (accepts(ca.start, cb.start)) accepting.add(stateId(startLabel));

  while (queue.length > 0) {
    const [sa, sb] = queue.shift()!;
    const row = new Map<Sym, StateId>();
    for (const sym of alphabet) {
      const na = ca.delta.get(sa)!.get(sym)!;
      const nb = cb.delta.get(sb)!.get(sym)!;
      const nl = pair(na, nb);
      if (!seen.has(nl)) {
        seen.add(nl);
        states.push(stateId(nl));
        queue.push([na, nb]);
        if (accepts(na, nb)) accepting.add(stateId(nl));
      }
      row.set(sym, stateId(nl));
    }
    delta.set(pairId(sa, sb), row);
  }

  return { alphabet, states, start: stateId(startLabel), accepting, delta };
}

const pairId = (a: StateId, b: StateId): StateId => stateId(pair(a, b));
