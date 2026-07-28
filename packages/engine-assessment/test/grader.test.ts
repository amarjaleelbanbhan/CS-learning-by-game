import { describe, expect, it } from 'vitest';
import type { DFA, NFA } from '@arc/engine-automata';
import {
  assess,
  choiceGrader,
  correct,
  countsAsAttempt,
  createDefaultRegistry,
  dfaEquivalenceGrader,
  GraderRegistry,
  incorrect,
  isSolved,
  matchingGrader,
  membershipPredictionGrader,
  nfaEquivalenceGrader,
  numericGrader,
  orderingGrader,
  partial,
  regexEquivalenceGrader,
  type Grader,
} from '../src/index.js';

/** DFA over {0,1} accepting strings that end in "01". */
function endsIn01(): DFA {
  return {
    alphabet: ['0', '1'],
    states: ['q0', 'q1', 'q2'],
    start: 'q0',
    accepting: new Set(['q2']),
    delta: new Map([
      [
        'q0',
        new Map([
          ['0', 'q1'],
          ['1', 'q0'],
        ]),
      ],
      [
        'q1',
        new Map([
          ['0', 'q1'],
          ['1', 'q2'],
        ]),
      ],
      [
        'q2',
        new Map([
          ['0', 'q1'],
          ['1', 'q0'],
        ]),
      ],
    ]),
  };
}

/** Same language, four states, different shape — must still grade as correct. */
function endsIn01Redundant(): DFA {
  return {
    alphabet: ['0', '1'],
    states: ['a', 'b', 'c', 'd'],
    start: 'a',
    accepting: new Set(['c']),
    delta: new Map([
      [
        'a',
        new Map([
          ['0', 'b'],
          ['1', 'd'],
        ]),
      ],
      [
        'b',
        new Map([
          ['0', 'b'],
          ['1', 'c'],
        ]),
      ],
      [
        'c',
        new Map([
          ['0', 'b'],
          ['1', 'd'],
        ]),
      ],
      [
        'd',
        new Map([
          ['0', 'b'],
          ['1', 'd'],
        ]),
      ],
    ]),
  };
}

/** Accepts strings CONTAINING "01" — the classic misconception. */
function contains01(): DFA {
  return {
    alphabet: ['0', '1'],
    states: ['s0', 's1', 's2'],
    start: 's0',
    accepting: new Set(['s2']),
    delta: new Map([
      [
        's0',
        new Map([
          ['0', 's1'],
          ['1', 's0'],
        ]),
      ],
      [
        's1',
        new Map([
          ['0', 's1'],
          ['1', 's2'],
        ]),
      ],
      [
        's2',
        new Map([
          ['0', 's2'],
          ['1', 's2'],
        ]),
      ],
    ]),
  };
}

describe('verdict constructors', () => {
  it('marks only correct as solved', () => {
    expect(isSolved(correct())).toBe(true);
    expect(isSolved(incorrect({}))).toBe(false);
    expect(isSolved(partial(0.5, {}))).toBe(false);
  });

  it('clamps partial scores away from the correct/incorrect endpoints', () => {
    // A partial that scored exactly 1 would be indistinguishable from correct.
    expect(partial(1, {}).score).toBeLessThan(1);
    expect(partial(0, {}).score).toBeGreaterThan(0);
    expect(partial(-5, {}).score).toBeGreaterThan(0);
  });

  it('does not charge the player an attempt for a structurally invalid answer', () => {
    const verdict = assess(
      dfaEquivalenceGrader,
      { ...endsIn01(), accepting: new Set() },
      {
        reference: endsIn01(),
      },
    );
    expect(verdict.outcome).toBe('invalid');
    expect(countsAsAttempt(verdict)).toBe(false);
  });
});

describe('assess pipeline', () => {
  const spec = { reference: endsIn01() };

  it('rejects uninterpretable input without calling grade', () => {
    const verdict = assess(dfaEquivalenceGrader, 'not a machine', spec);
    expect(verdict.outcome).toBe('invalid');
  });

  it('runs normalize -> validate -> grade in order', () => {
    const order: string[] = [];
    const probe: Grader<number, null> = {
      id: 'probe',
      normalize: (raw) => {
        order.push('normalize');
        return typeof raw === 'number' ? raw : null;
      },
      validate: () => {
        order.push('validate');
        return [];
      },
      grade: () => {
        order.push('grade');
        return correct();
      },
    };
    assess(probe, 1, null);
    expect(order).toEqual(['normalize', 'validate', 'grade']);
  });

  it('stops at validate when the answer is incomplete', () => {
    let graded = false;
    const probe: Grader<number, null> = {
      id: 'probe2',
      normalize: (raw) => (typeof raw === 'number' ? raw : null),
      validate: () => ['not finished'],
      grade: () => {
        graded = true;
        return correct();
      },
    };
    const verdict = assess(probe, 1, null);
    expect(graded).toBe(false);
    expect(verdict.feedback).toContain('not finished');
  });
});

describe('dfaEquivalenceGrader', () => {
  const spec = { reference: endsIn01() };

  it('accepts a differently-shaped machine for the same language', () => {
    // The crown jewel: grade the language, never the drawing.
    const verdict = assess(dfaEquivalenceGrader, endsIn01Redundant(), spec);
    expect(verdict.outcome).toBe('correct');
    expect(verdict.score).toBe(1);
  });

  it('produces a counterexample naming the exact disagreement', () => {
    const verdict = assess(dfaEquivalenceGrader, contains01(), spec);
    expect(verdict.outcome).toBe('incorrect');
    expect(verdict.counterexample).not.toBeNull();
    // "contains 01" accepts 010; "ends in 01" does not.
    expect(verdict.counterexample!.playerResult).toBe('accepted');
    expect(verdict.counterexample!.expectedResult).toBe('should be rejected');
  });

  it('names the mistake in machine-readable form for analytics', () => {
    const verdict = assess(dfaEquivalenceGrader, contains01(), spec);
    expect(verdict.mistakes.map((m) => m.code)).toContain('language-mismatch');
  });

  it('treats a machine with no accepting state as unfinished, not wrong', () => {
    const verdict = assess(dfaEquivalenceGrader, { ...endsIn01(), accepting: new Set() }, spec);
    expect(verdict.outcome).toBe('invalid');
  });
});

describe('nfaEquivalenceGrader', () => {
  /** NFA accepting strings ending in "01", via nondeterministic guessing. */
  const nfa: NFA = {
    alphabet: ['0', '1'],
    states: ['n0', 'n1', 'n2'],
    start: 'n0',
    accepting: new Set(['n2']),
    delta: new Map([
      [
        'n0',
        new Map([
          ['0', new Set(['n0', 'n1'])],
          ['1', new Set(['n0'])],
        ]),
      ],
      ['n1', new Map([['1', new Set(['n2'])]])],
    ]),
  };

  it('accepts an equivalent nondeterministic machine', () => {
    const verdict = assess(nfaEquivalenceGrader, nfa, { reference: nfa });
    expect(verdict.outcome).toBe('correct');
  });

  it('rejects a machine for a different language', () => {
    const wrong: NFA = { ...nfa, accepting: new Set(['n0']) };
    const verdict = assess(nfaEquivalenceGrader, wrong, { reference: nfa });
    expect(verdict.outcome).toBe('incorrect');
  });
});

describe('regexEquivalenceGrader', () => {
  const spec = { referenceSource: '(0|1)*01' };

  it('accepts a syntactically different but equivalent pattern', () => {
    const verdict = assess(regexEquivalenceGrader, '(0|1)*(01)', spec);
    expect(verdict.outcome).toBe('correct');
  });

  it('rejects a pattern for a different language', () => {
    const verdict = assess(regexEquivalenceGrader, '(0|1)*10', spec);
    expect(verdict.outcome).toBe('incorrect');
    expect(verdict.counterexample).not.toBeNull();
  });

  it('treats a syntax error as unfinished rather than wrong', () => {
    // A typo must not burn an attempt or a hint tier.
    const verdict = assess(regexEquivalenceGrader, '(0|1', spec);
    expect(verdict.outcome).toBe('invalid');
    expect(countsAsAttempt(verdict)).toBe(false);
  });

  it('cannot be read when empty', () => {
    expect(assess(regexEquivalenceGrader, '   ', spec).outcome).toBe('invalid');
  });
});

describe('membershipPredictionGrader', () => {
  const spec = { machine: endsIn01(), input: '101' };

  it('rewards a correct prediction', () => {
    expect(assess(membershipPredictionGrader, true, spec).outcome).toBe('correct');
  });

  it('names which way the prediction went wrong', () => {
    const verdict = assess(membershipPredictionGrader, false, spec);
    expect(verdict.outcome).toBe('incorrect');
    expect(verdict.mistakes[0]!.code).toBe('predicted-reject-actual-accept');
  });

  it('handles the empty string', () => {
    const verdict = assess(membershipPredictionGrader, false, { machine: endsIn01(), input: '' });
    expect(verdict.outcome).toBe('correct');
  });
});

describe('choiceGrader', () => {
  const spec = { correctIds: ['a', 'c'], allowPartial: true };

  it('accepts the exact key regardless of order', () => {
    expect(assess(choiceGrader, ['c', 'a'], spec).outcome).toBe('correct');
  });

  it('gives partial credit for a subset with nothing wrong', () => {
    const verdict = assess(choiceGrader, ['a'], spec);
    expect(verdict.outcome).toBe('partial');
    expect(verdict.score).toBeCloseTo(0.5);
  });

  it('refuses partial credit for a scattershot answer', () => {
    // Selecting everything must not be a winning strategy.
    const verdict = assess(choiceGrader, ['a', 'b', 'c'], spec);
    expect(verdict.outcome).toBe('incorrect');
  });

  it('surfaces per-option rationale when provided', () => {
    const verdict = assess(choiceGrader, ['b'], {
      correctIds: ['a'],
      rationale: { b: 'b is regular, so it cannot be the answer.' },
    });
    expect(verdict.mistakes.map((m) => m.message)).toContain(
      'b is regular, so it cannot be the answer.',
    );
  });

  it('treats an empty selection as unfinished', () => {
    expect(assess(choiceGrader, [], spec).outcome).toBe('invalid');
  });
});

describe('numericGrader', () => {
  it('parses string input from a form field', () => {
    expect(assess(numericGrader, '4', { expected: 4 }).outcome).toBe('correct');
  });

  it('reports direction so the hint can be specific', () => {
    expect(assess(numericGrader, 7, { expected: 4 }).mistakes[0]!.code).toBe('overestimate');
    expect(assess(numericGrader, 2, { expected: 4 }).mistakes[0]!.code).toBe('underestimate');
  });

  it('honours tolerance', () => {
    expect(assess(numericGrader, 4.05, { expected: 4, tolerance: 0.1 }).outcome).toBe('correct');
  });

  it('rejects non-numeric input as unreadable', () => {
    expect(assess(numericGrader, 'four', { expected: 4 }).outcome).toBe('invalid');
  });
});

describe('orderingGrader', () => {
  const spec = { correctOrder: ['s1', 's2', 's3'] };

  it('accepts the exact sequence', () => {
    expect(assess(orderingGrader, ['s1', 's2', 's3'], spec).outcome).toBe('correct');
  });

  it('scores a nearly-right sequence as partial', () => {
    const verdict = assess(orderingGrader, ['s1', 's3', 's2'], spec);
    expect(verdict.outcome).toBe('partial');
    expect(verdict.score).toBeCloseTo(1 / 3);
  });

  it('rejects a completely reordered sequence', () => {
    expect(assess(orderingGrader, ['s3', 's1', 's2'], spec).outcome).toBe('incorrect');
  });

  it('flags duplicates and wrong length as unfinished', () => {
    expect(assess(orderingGrader, ['s1', 's1', 's2'], spec).outcome).toBe('invalid');
    expect(assess(orderingGrader, ['s1', 's2'], spec).outcome).toBe('invalid');
  });
});

describe('matchingGrader', () => {
  const spec = { pairs: { dfa: 'regular', pda: 'context-free' } };

  it('accepts a fully correct mapping', () => {
    expect(assess(matchingGrader, { dfa: 'regular', pda: 'context-free' }, spec).outcome).toBe(
      'correct',
    );
  });

  it('scores a half-right mapping as partial and names the bad pair', () => {
    const verdict = assess(matchingGrader, { dfa: 'regular', pda: 'regular' }, spec);
    expect(verdict.outcome).toBe('partial');
    expect(verdict.mistakes[0]!.where).toBe('pda');
  });

  it('treats an incomplete mapping as unfinished', () => {
    expect(assess(matchingGrader, { dfa: 'regular' }, spec).outcome).toBe('invalid');
  });
});

describe('GraderRegistry', () => {
  it('ships every built-in grader', () => {
    const registry = createDefaultRegistry();
    expect(registry.ids()).toEqual([
      'choice',
      'dfa-equivalence',
      'matching',
      'membership-prediction',
      'nfa-equivalence',
      'numeric',
      'ordering',
      'regex-equivalence',
    ]);
  });

  it('refuses a duplicate id so two topics cannot silently collide', () => {
    const registry = new GraderRegistry();
    registry.register(choiceGrader as never);
    expect(() => registry.register(choiceGrader as never)).toThrow(/already registered/);
  });

  it('reports unknown ids rather than throwing', () => {
    expect(createDefaultRegistry().get('cfg-derivation')).toBeUndefined();
    expect(createDefaultRegistry().has('dfa-equivalence')).toBe(true);
  });
});

describe('assess is defensive about grader bugs', () => {
  // Found by playtesting, not by unit tests: a spec missing a field the grader reads made
  // `acceptsNFA(nfa, undefined)` throw inside a click handler. The player saw nothing
  // happen at all — no verdict, no error, a dead button.
  it('turns a thrown grader into an invalid verdict instead of propagating', () => {
    const exploding: Grader<number, null> = {
      id: 'exploding',
      normalize: (raw) => (typeof raw === 'number' ? raw : null),
      validate: () => [],
      grade: () => {
        throw new Error('spec.input is undefined');
      },
    };
    const verdict = assess(exploding, 1, null);
    expect(verdict.outcome).toBe('invalid');
    expect(verdict.feedback.join(' ')).toMatch(/spec\.input is undefined/);
  });

  it('does not charge the player an attempt for our authoring bug', () => {
    const exploding: Grader<number, null> = {
      id: 'exploding2',
      normalize: (raw) => (typeof raw === 'number' ? raw : null),
      validate: () => [],
      grade: () => {
        throw new Error('boom');
      },
    };
    expect(countsAsAttempt(assess(exploding, 1, null))).toBe(false);
  });

  it('grades membership only when the spec carries BOTH machine and input', () => {
    // The exact shape the NFA→DFA prediction task needs: specRef supplies `machine`,
    // task params supply `input`. Merging them is TaskRunner's job.
    const machine = endsIn01();
    expect(assess(membershipPredictionGrader, true, { machine, input: '101' }).outcome).toBe(
      'correct',
    );
    expect(assess(membershipPredictionGrader, true, { machine } as never).outcome).toBe('invalid');
  });
});
