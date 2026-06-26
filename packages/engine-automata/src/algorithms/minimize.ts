import { stateId, type StateId } from '@arc/shared';
import type { DFA, Sym } from '../models/dfa.js';
import { completeDfa, reachableStates } from './util.js';

/**
 * Minimizes a DFA via Moore's partition-refinement algorithm:
 * 1. Complete the DFA and drop unreachable states.
 * 2. Start with the {accepting} / {non-accepting} partition.
 * 3. Repeatedly split any block whose members transition into different blocks,
 *    until stable. Each final block becomes one state of the minimal DFA.
 */
export function minimizeDfa(dfa: DFA): DFA {
  const c = completeDfa(dfa);
  const reachable = reachableStates(c);
  const states = c.states.filter((s) => reachable.has(s));

  let partition: StateId[][] = [];
  const accepting = states.filter((s) => c.accepting.has(s));
  const rejecting = states.filter((s) => !c.accepting.has(s));
  if (accepting.length > 0) partition.push(accepting);
  if (rejecting.length > 0) partition.push(rejecting);

  let changed = true;
  while (changed) {
    changed = false;
    const blockOf = new Map<StateId, number>();
    partition.forEach((block, i) => block.forEach((s) => blockOf.set(s, i)));

    const next: StateId[][] = [];
    for (const block of partition) {
      const groups = new Map<string, StateId[]>();
      for (const s of block) {
        const sig = c.alphabet.map((sym) => blockOf.get(c.delta.get(s)!.get(sym)!)).join(',');
        const g = groups.get(sig) ?? [];
        g.push(s);
        groups.set(sig, g);
      }
      if (groups.size > 1) changed = true;
      for (const g of groups.values()) next.push(g);
    }
    partition = next;
  }

  const blockOf = new Map<StateId, number>();
  partition.forEach((block, i) => block.forEach((s) => blockOf.set(s, i)));
  const label = (i: number): StateId => stateId(`m${i}`);

  const newStates: StateId[] = [];
  const newAccepting = new Set<StateId>();
  const delta = new Map<StateId, Map<Sym, StateId>>();

  partition.forEach((block, i) => {
    const rep = block[0]!;
    newStates.push(label(i));
    if (c.accepting.has(rep)) newAccepting.add(label(i));
    const row = new Map<Sym, StateId>();
    for (const sym of c.alphabet) {
      row.set(sym, label(blockOf.get(c.delta.get(rep)!.get(sym)!)!));
    }
    delta.set(label(i), row);
  });

  return {
    alphabet: [...c.alphabet],
    states: newStates,
    start: label(blockOf.get(c.start)!),
    accepting: newAccepting,
    delta,
  };
}
