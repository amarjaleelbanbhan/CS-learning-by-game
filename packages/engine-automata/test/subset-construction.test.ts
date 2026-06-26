import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { stateId, type StateId } from '@arc/shared';
import {
  EPSILON,
  accepts,
  acceptsNFA,
  enumerateStrings,
  subsetConstruction,
  type NFA,
} from '../src/index.js';

const ALPHABET = ['a', 'b'];

interface NfaSpec {
  n: number;
  start: number;
  accepting: number[];
  a: number[][];
  b: number[][];
  eps: number[][];
}

function buildNfa(spec: NfaSpec): NFA {
  const states = Array.from({ length: spec.n }, (_, i) => stateId(`q${i}`));
  const delta = new Map<StateId, Map<string, Set<StateId>>>();
  for (let i = 0; i < spec.n; i++) {
    const row = new Map<string, Set<StateId>>();
    const setFor = (key: string, targets: number[] | undefined): void => {
      if (targets && targets.length > 0) {
        row.set(key, new Set(targets.map((t) => states[t]!)));
      }
    };
    setFor('a', spec.a[i]);
    setFor('b', spec.b[i]);
    setFor(EPSILON, spec.eps[i]);
    delta.set(states[i]!, row);
  }
  return {
    alphabet: ALPHABET,
    states,
    start: states[spec.start]!,
    accepting: new Set(spec.accepting.map((i) => states[i]!)),
    delta,
  };
}

const nfaArb: fc.Arbitrary<NfaSpec> = fc.integer({ min: 1, max: 4 }).chain((n) => {
  const idx = fc.integer({ min: 0, max: n - 1 });
  const targets = fc.uniqueArray(idx, { maxLength: n });
  const perState = fc.array(targets, { minLength: n, maxLength: n });
  return fc.record({
    n: fc.constant(n),
    start: idx,
    accepting: fc.uniqueArray(idx, { maxLength: n }),
    a: perState,
    b: perState,
    eps: perState,
  });
});

describe('subsetConstruction', () => {
  it('PROPERTY: the resulting DFA accepts exactly the NFA language (|w| <= 5)', () => {
    const corpus = enumerateStrings(ALPHABET, 5);
    fc.assert(
      fc.property(nfaArb, (spec) => {
        const nfa = buildNfa(spec);
        const { dfa } = subsetConstruction(nfa);
        return corpus.every((w) => acceptsNFA(nfa, w) === accepts(dfa, w));
      }),
      { numRuns: 300 },
    );
  });

  it('records generation steps and a total transition table', () => {
    const q0 = stateId('q0');
    const q1 = stateId('q1');
    // NFA: q0 --a--> q1 (via ε then a), accepting q1
    const nfa: NFA = {
      alphabet: ALPHABET,
      states: [q0, q1],
      start: q0,
      accepting: new Set([q1]),
      delta: new Map([[q0, new Map([['a', new Set([q1])]])]]),
    };
    const { dfa, steps } = subsetConstruction(nfa);
    expect(steps.length).toBeGreaterThan(0);
    // every reachable DFA state has a transition for every alphabet symbol
    for (const state of dfa.states) {
      for (const sym of dfa.alphabet) {
        expect(dfa.delta.get(state)?.get(sym)).toBeDefined();
      }
    }
    expect(accepts(dfa, 'a')).toBe(true);
    expect(accepts(dfa, 'b')).toBe(false);
  });
});
