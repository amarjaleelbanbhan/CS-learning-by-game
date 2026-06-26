import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { stateId, type StateId } from '@arc/shared';
import {
  accepts,
  areEquivalent,
  enumerateStrings,
  minimizeDfa,
  productDfa,
  type DFA,
} from '../src/index.js';

const ALPHABET = ['a', 'b'];
const corpus = enumerateStrings(ALPHABET, 6);

/** Arbitrary total DFA over {a,b} with 1..4 states. */
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

describe('productDfa', () => {
  it('PROPERTY: intersection accepts iff both accept', () => {
    fc.assert(
      fc.property(randomDfa(), randomDfa(), (a, b) => {
        const p = productDfa(a, b, 'intersection');
        return corpus.every((w) => accepts(p, w) === (accepts(a, w) && accepts(b, w)));
      }),
      { numRuns: 150 },
    );
  });

  it('PROPERTY: union accepts iff either accepts', () => {
    fc.assert(
      fc.property(randomDfa(), randomDfa(), (a, b) => {
        const p = productDfa(a, b, 'union');
        return corpus.every((w) => accepts(p, w) === (accepts(a, w) || accepts(b, w)));
      }),
      { numRuns: 150 },
    );
  });
});

describe('minimizeDfa', () => {
  it('PROPERTY: preserves the language', () => {
    fc.assert(
      fc.property(randomDfa(), (a) => {
        const m = minimizeDfa(a);
        return corpus.every((w) => accepts(m, w) === accepts(a, w));
      }),
      { numRuns: 200 },
    );
  });

  it('PROPERTY: minimization is idempotent in size', () => {
    fc.assert(
      fc.property(randomDfa(), (a) => {
        const once = minimizeDfa(a);
        const twice = minimizeDfa(once);
        return once.states.length === twice.states.length;
      }),
      { numRuns: 150 },
    );
  });
});

describe('areEquivalent', () => {
  it('a DFA is equivalent to itself and to its minimization', () => {
    fc.assert(
      fc.property(randomDfa(), (a) => areEquivalent(a, a) && areEquivalent(a, minimizeDfa(a))),
      { numRuns: 150 },
    );
  });

  it('PROPERTY: agrees with brute-force comparison over the corpus', () => {
    fc.assert(
      fc.property(randomDfa(), randomDfa(), (a, b) => {
        const sameOnCorpus = corpus.every((w) => accepts(a, w) === accepts(b, w));
        // Distinguishing strings for <=4-state DFAs are well within length 6,
        // so corpus agreement is exact here.
        return areEquivalent(a, b) === sameOnCorpus;
      }),
      { numRuns: 200 },
    );
  });
});
