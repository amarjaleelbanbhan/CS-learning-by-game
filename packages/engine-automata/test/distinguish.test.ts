import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { stateId, type StateId } from '@arc/shared';
import {
  accepts,
  areEquivalent,
  findDistinguishingString,
  minimizeDfa,
  type DFA,
} from '../src/index.js';

const ALPHABET = ['a', 'b'];

function randomDfa(): fc.Arbitrary<DFA> {
  return fc.integer({ min: 1, max: 4 }).chain((n) => {
    const idx = fc.integer({ min: 0, max: n - 1 });
    return fc
      .record({
        start: idx,
        accepting: fc.uniqueArray(idx, { maxLength: n }),
        a: fc.array(idx, { minLength: n, maxLength: n }),
        b: fc.array(idx, { minLength: n, maxLength: n }),
      })
      .map((spec) => {
        const states = Array.from({ length: n }, (_, i) => stateId(`q${i}`));
        const delta = new Map<StateId, Map<string, StateId>>();
        for (let i = 0; i < n; i++) {
          delta.set(
            states[i]!,
            new Map([
              ['a', states[spec.a[i]!]!],
              ['b', states[spec.b[i]!]!],
            ]),
          );
        }
        return {
          alphabet: ALPHABET,
          states,
          start: states[spec.start]!,
          accepting: new Set(spec.accepting.map((i) => states[i]!)),
          delta,
        } satisfies DFA;
      });
  });
}

describe('findDistinguishingString', () => {
  it('returns null for equivalent DFAs', () => {
    fc.assert(
      fc.property(randomDfa(), (a) => {
        const b = minimizeDfa(a);
        return findDistinguishingString(a, b) === null;
      }),
      { numRuns: 150 },
    );
  });

  it('PROPERTY: when non-null, the returned string genuinely distinguishes the two machines', () => {
    fc.assert(
      fc.property(randomDfa(), randomDfa(), (a, b) => {
        const witness = findDistinguishingString(a, b, 10);
        if (witness === null) return areEquivalent(a, b);
        return accepts(a, witness) !== accepts(b, witness);
      }),
      { numRuns: 300 },
    );
  });

  it('PROPERTY: agrees with areEquivalent on whether a witness exists', () => {
    fc.assert(
      fc.property(randomDfa(), randomDfa(), (a, b) => {
        const witness = findDistinguishingString(a, b, 10);
        return (witness === null) === areEquivalent(a, b);
      }),
      { numRuns: 300 },
    );
  });

  it('finds the empty string when start-state acceptance differs', () => {
    const q0 = stateId('q0');
    const accDfa: DFA = {
      alphabet: ALPHABET,
      states: [q0],
      start: q0,
      accepting: new Set([q0]),
      delta: new Map([
        [
          q0,
          new Map([
            ['a', q0],
            ['b', q0],
          ]),
        ],
      ]),
    };
    const rejDfa: DFA = { ...accDfa, accepting: new Set() };
    expect(findDistinguishingString(accDfa, rejDfa)).toBe('');
  });
});
