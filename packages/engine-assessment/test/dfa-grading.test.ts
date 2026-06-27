import { describe, expect, it } from 'vitest';
import { stateId, type StateId } from '@arc/shared';
import { accepts, minimizeDfa, type DFA } from '@arc/engine-automata';
import { gradeDfaConstruction } from '../src/index.js';

/** Reference: strings over {0,1} ending in "01". */
function referenceDfa(): DFA {
  const q0 = stateId('q0');
  const q1 = stateId('q1');
  const q2 = stateId('q2');
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
  return { alphabet: ['0', '1'], states: [q0, q1, q2], start: q0, accepting: new Set([q2]), delta };
}

describe('gradeDfaConstruction', () => {
  const reference = referenceDfa();

  it('accepts a structurally different but language-equivalent machine', () => {
    const minimized = minimizeDfa(reference);
    const result = gradeDfaConstruction(minimized, reference);
    expect(result.correct).toBe(true);
    expect(result.counterexample).toBeNull();
  });

  it('rejects a wrong machine and returns a genuine counterexample', () => {
    // A player who builds a machine accepting strings ending in "0" instead of "01".
    const q0 = stateId('q0');
    const q1 = stateId('q1');
    const wrong: DFA = {
      alphabet: ['0', '1'],
      states: [q0, q1],
      start: q0,
      accepting: new Set([q1]),
      delta: new Map([
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
            ['1', q0],
          ]),
        ],
      ]),
    };
    const result = gradeDfaConstruction(wrong, reference);
    expect(result.correct).toBe(false);
    expect(result.counterexample).not.toBeNull();
    const witness = result.counterexample!;
    expect(accepts(wrong, witness)).not.toBe(accepts(reference, witness));
  });

  it('treats an incomplete (but otherwise correct) machine as valid via implicit dead state', () => {
    // Player never wires a transition for state q2 reading '0' explicitly in
    // a different but still-equivalent shape; equivalence grading must not
    // require an exact transition table, only matching behavior.
    const reference2 = referenceDfa();
    const result = gradeDfaConstruction(reference2, reference);
    expect(result.correct).toBe(true);
  });
});
