import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { stateId, type StateId } from '@arc/shared';
import {
  EPSILON,
  accepts,
  acceptsNFA,
  enumerateStrings,
  subsetConstruction,
  type DFA,
  type NFA,
} from '@arc/engine-automata';
import { simulateDfa, simulateNfa } from '../src/index.js';

function endsIn01(): DFA {
  const q0 = stateId('q0');
  const q1 = stateId('q1');
  const q2 = stateId('q2');
  const delta = new Map<StateId, Map<string, StateId>>([
    [q0, new Map([['0', q1], ['1', q0]])],
    [q1, new Map([['0', q1], ['1', q2]])],
    [q2, new Map([['0', q1], ['1', q0]])],
  ]);
  return { alphabet: ['0', '1'], states: [q0, q1, q2], start: q0, accepting: new Set([q2]), delta };
}

describe('simulateDfa', () => {
  const dfa = endsIn01();

  it('produces input.length + 1 frames', () => {
    expect(simulateDfa(dfa, '101').frames).toHaveLength(4);
    expect(simulateDfa(dfa, '').frames).toHaveLength(1);
  });

  it('final frame outcome agrees with accepts()', () => {
    for (const w of enumerateStrings(['0', '1'], 6)) {
      const trace = simulateDfa(dfa, w);
      expect(trace.outcome === 'accept').toBe(accepts(dfa, w));
    }
  });

  it('marks the run stuck when no transition exists', () => {
    const trace = simulateDfa(dfa, '2');
    expect(trace.outcome).toBe('reject');
    expect(trace.frames.at(-1)?.data.currentState).toBeNull();
  });
});

describe('simulateNfa', () => {
  const corpus = enumerateStrings(['a', 'b'], 5);

  it('PROPERTY: trace outcome agrees with acceptsNFA and with the subset DFA', () => {
    fc.assert(
      fc.property(randomNfa(), (nfa) => {
        const dfa = subsetConstruction(nfa).dfa;
        return corpus.every((w) => {
          const sim = simulateNfa(nfa, w);
          return (
            (sim.outcome === 'accept') === acceptsNFA(nfa, w) &&
            (sim.outcome === 'accept') === accepts(dfa, w)
          );
        });
      }),
      { numRuns: 200 },
    );
  });
});

function randomNfa(): fc.Arbitrary<NFA> {
  return fc.integer({ min: 1, max: 4 }).chain((n) => {
    const idx = fc.integer({ min: 0, max: n - 1 });
    const targets = fc.uniqueArray(idx, { maxLength: n });
    const perState = fc.array(targets, { minLength: n, maxLength: n });
    return fc
      .record({
        start: idx,
        accepting: fc.uniqueArray(idx, { maxLength: n }),
        a: perState,
        b: perState,
        eps: perState,
      })
      .map((spec) => {
        const states = Array.from({ length: n }, (_, i) => stateId(`q${i}`));
        const delta = new Map<StateId, Map<string, Set<StateId>>>();
        for (let i = 0; i < n; i++) {
          const row = new Map<string, Set<StateId>>();
          const setFor = (key: string, ts: number[] | undefined): void => {
            if (ts && ts.length > 0) row.set(key, new Set(ts.map((t) => states[t]!)));
          };
          setFor('a', spec.a[i]);
          setFor('b', spec.b[i]);
          setFor(EPSILON, spec.eps[i]);
          delta.set(states[i]!, row);
        }
        return {
          alphabet: ['a', 'b'],
          states,
          start: states[spec.start]!,
          accepting: new Set(spec.accepting.map((i) => states[i]!)),
          delta,
        } satisfies NFA;
      });
  });
}
