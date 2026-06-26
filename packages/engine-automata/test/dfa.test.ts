import { describe, expect, it } from 'vitest';
import { stateId, type StateId } from '@arc/shared';
import { accepts, type DFA } from '../src/index.js';

/** DFA over {0,1} accepting exactly the strings that end in "01". */
function endsIn01(): DFA {
  const q0 = stateId('q0'); // start / reset
  const q1 = stateId('q1'); // last symbol was 0
  const q2 = stateId('q2'); // string ends in 01 (accepting)
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

describe('accepts (DFA: strings ending in 01)', () => {
  const dfa = endsIn01();
  it.each([
    ['01', true],
    ['101', true],
    ['00101', true],
    ['', false],
    ['0', false],
    ['10', false],
    ['010', false],
    ['011', false],
  ])('"%s" -> %s', (input, expected) => {
    expect(accepts(dfa, input)).toBe(expected);
  });

  it('rejects strings using symbols outside the alphabet', () => {
    expect(accepts(dfa, '012')).toBe(false);
  });
});
