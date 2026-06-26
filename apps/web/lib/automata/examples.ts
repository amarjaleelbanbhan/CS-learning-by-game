import { stateId, type StateId } from '@arc/shared';
import type { DFA, NFA } from '@arc/engine-automata';

export type Layout = Record<string, { x: number; y: number }>;

export interface AutomatonView {
  dfa: DFA;
  layout: Layout;
}

export interface NfaView {
  nfa: NFA;
  layout: Layout;
}

/** DFA over {0,1} accepting exactly the strings that end in "01". */
export function endsIn01View(): AutomatonView {
  const q0 = stateId('q0'); // start / no useful suffix
  const q1 = stateId('q1'); // last symbol was 0
  const q2 = stateId('q2'); // ends in 01 (accepting)
  const delta = new Map<StateId, Map<string, StateId>>([
    [
      q0,
      new Map([
        ['0', q1],
        ['1', q0],
      ]),
    ],
    [
      q1,
      new Map([
        ['0', q1],
        ['1', q2],
      ]),
    ],
    [
      q2,
      new Map([
        ['0', q1],
        ['1', q0],
      ]),
    ],
  ]);
  return {
    dfa: {
      alphabet: ['0', '1'],
      states: [q0, q1, q2],
      start: q0,
      accepting: new Set([q2]),
      delta,
    },
    layout: {
      q0: { x: 60, y: 140 },
      q1: { x: 300, y: 140 },
      q2: { x: 540, y: 140 },
    },
  };
}

/**
 * Nondeterministic NFA over {0,1} accepting strings that END in "01".
 * q0 has two transitions on '0' (stay, or guess the match starts) — the
 * nondeterminism that subset construction resolves into a DFA.
 */
export function nfaEndsIn01View(): NfaView {
  const q0 = stateId('q0');
  const q1 = stateId('q1');
  const q2 = stateId('q2');
  const delta = new Map<StateId, Map<string, Set<StateId>>>([
    [
      q0,
      new Map([
        ['0', new Set([q0, q1])],
        ['1', new Set([q0])],
      ]),
    ],
    [q1, new Map([['1', new Set([q2])]])],
  ]);
  return {
    nfa: {
      alphabet: ['0', '1'],
      states: [q0, q1, q2],
      start: q0,
      accepting: new Set([q2]),
      delta,
    },
    layout: {
      q0: { x: 60, y: 150 },
      q1: { x: 300, y: 150 },
      q2: { x: 540, y: 150 },
    },
  };
}
