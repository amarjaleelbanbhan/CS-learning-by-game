import { describe, expect, it } from 'vitest';
import { stateId, type StateId } from '@arc/shared';
import { EPSILON, type DFA, type NFA, type Sym } from '@arc/engine-automata';
import { analyzeSubsetConstruction, parseSubsetLabel } from '../src/index.js';

/**
 * NFA over {0,1} accepting strings ending in "01". No ε-transitions — used for the
 * straightforward mistake categories. Reachable subsets (hand-verified):
 *   {q0} --0--> {q0,q1} --1--> {q0,q2} (accepting)
 *   {q0} --1--> {q0}
 *   {q0,q1} --0--> {q0,q1}
 *   {q0,q2} --0--> {q0,q1}
 *   {q0,q2} --1--> {q0}
 * Canonical labels: "q0" (start), "q0,q1", "q0,q2" (accepting). No dead state.
 */
function endsIn01Nfa(): NFA {
  const q0 = stateId('q0');
  const q1 = stateId('q1');
  const q2 = stateId('q2');
  const delta = new Map<StateId, Map<Sym, ReadonlySet<StateId>>>([
    [
      q0,
      new Map([
        ['0', new Set([q0, q1])],
        ['1', new Set([q0])],
      ]),
    ],
    [q1, new Map([['1', new Set([q2])]])],
  ]);
  return { alphabet: ['0', '1'], states: [q0, q1, q2], start: q0, accepting: new Set([q2]), delta };
}

/**
 * NFA over {a} with a mid-path ε-transition INTO an accepting state, isolated from the
 * start state, so a player can correctly match the start subset yet still botch a later
 * ε-closure — and have it actually matter for acceptance (unlike a closure omission onto
 * a behaviorally inert state, which is structurally sloppy but still language-equivalent).
 * q0 --a--> q1 --ε--> q2 (accepting, no further transitions)
 * Reachable subsets: "q0" (start, non-accepting) --a--> "q1,q2" (accepting) --a--> "" (dead).
 */
function midPathEpsilonNfa(): NFA {
  const q0 = stateId('q0');
  const q1 = stateId('q1');
  const q2 = stateId('q2');
  const delta = new Map<StateId, Map<Sym, ReadonlySet<StateId>>>([
    [q0, new Map([['a', new Set([q1])]])],
    [q1, new Map([[EPSILON, new Set([q2])]])],
  ]);
  return {
    alphabet: ['a'],
    states: [q0, q1, q2],
    start: q0,
    accepting: new Set([q2]),
    delta,
  };
}

function buildDfa(
  alphabet: readonly string[],
  start: string,
  accepting: readonly string[],
  rows: Record<string, Record<string, string>>,
): DFA {
  const delta = new Map<StateId, Map<Sym, StateId>>();
  for (const [from, row] of Object.entries(rows)) {
    const m = new Map<Sym, StateId>();
    for (const [sym, to] of Object.entries(row)) m.set(sym, stateId(to));
    delta.set(stateId(from), m);
  }
  return {
    alphabet: [...alphabet],
    states: Object.keys(rows).map(stateId),
    start: stateId(start),
    accepting: new Set(accepting.map(stateId)),
    delta,
  };
}

describe('parseSubsetLabel', () => {
  it('parses comma-joined and brace-wrapped forms identically', () => {
    expect(parseSubsetLabel('q0,q1')).toEqual(new Set(['q0', 'q1']));
    expect(parseSubsetLabel('{q0,q1}')).toEqual(new Set(['q0', 'q1']));
    expect(parseSubsetLabel('{ q0, q1 }')).toEqual(new Set(['q0', 'q1']));
  });

  it('treats empty-set spellings as an empty Set, not null', () => {
    expect(parseSubsetLabel('')).toEqual(new Set());
    expect(parseSubsetLabel('{}')).toEqual(new Set());
    expect(parseSubsetLabel('∅')).toEqual(new Set());
  });

  it('returns null for malformed input (trailing comma)', () => {
    expect(parseSubsetLabel('q0,,q1')).toBeNull();
    expect(parseSubsetLabel('q0,')).toBeNull();
  });

  it('parses a single bare state id', () => {
    expect(parseSubsetLabel('q0')).toEqual(new Set(['q0']));
  });
});

describe('analyzeSubsetConstruction: correct submission', () => {
  it('reports correct with zero mistakes when labeled exactly per canonical subsets', () => {
    const nfa = endsIn01Nfa();
    const player = buildDfa(['0', '1'], 'q0', ['q0,q2'], {
      q0: { '0': 'q0,q1', '1': 'q0' },
      'q0,q1': { '0': 'q0,q1', '1': 'q0,q2' },
      'q0,q2': { '0': 'q0,q1', '1': 'q0' },
    });
    const result = analyzeSubsetConstruction(player, nfa);
    expect(result.correct).toBe(true);
    expect(result.counterexample).toBeNull();
    expect(result.mistakes).toEqual([]);
  });

  it('is correct even with non-canonical-but-consistent labels (language equivalence, not labels)', () => {
    const nfa = endsIn01Nfa();
    // Same machine, arbitrary q0/q1/q2 labels instead of subset names.
    const player = buildDfa(['0', '1'], 'A', ['C'], {
      A: { '0': 'B', '1': 'A' },
      B: { '0': 'B', '1': 'C' },
      C: { '0': 'B', '1': 'A' },
    });
    const result = analyzeSubsetConstruction(player, nfa);
    expect(result.correct).toBe(true);
    expect(result.counterexample).toBeNull();
  });
});

describe('analyzeSubsetConstruction: missing-subset', () => {
  it('flags a reachable subset the player never created', () => {
    const nfa = endsIn01Nfa();
    // Missing "q0,q2" entirely — player only built two states.
    const player = buildDfa(['0', '1'], 'q0', [], {
      q0: { '0': 'q0,q1', '1': 'q0' },
      'q0,q1': { '0': 'q0,q1', '1': 'q0,q1' }, // wrong on top of missing, but irrelevant here
    });
    const result = analyzeSubsetConstruction(player, nfa);
    expect(result.correct).toBe(false);
    expect(result.mistakes.some((m) => m.kind === 'missing-subset')).toBe(true);
  });
});

describe('analyzeSubsetConstruction: duplicate-subset', () => {
  it('flags two player states that parse to the same subset', () => {
    const nfa = endsIn01Nfa();
    const player = buildDfa(['0', '1'], 'q0', ['q0,q2'], {
      q0: { '0': 'q0,q1', '1': 'q0' },
      'q0,q1': { '0': '{q1,q0}', '1': 'q0,q2' }, // duplicate of q0,q1, different spelling
      '{q1,q0}': { '0': 'q0,q1', '1': 'q0,q2' },
      'q0,q2': { '0': 'q0,q1', '1': 'q0' },
    });
    const result = analyzeSubsetConstruction(player, nfa);
    expect(result.mistakes.some((m) => m.kind === 'duplicate-subset')).toBe(true);
  });
});

describe('analyzeSubsetConstruction: unused-state', () => {
  it('flags a player state unreachable from their own start state', () => {
    const nfa = endsIn01Nfa();
    const player = buildDfa(['0', '1'], 'q0', ['q0,q2'], {
      q0: { '0': 'q0,q1', '1': 'q0' },
      'q0,q1': { '0': 'q0,q1', '1': 'q0,q2' },
      'q0,q2': { '0': 'q0,q1', '1': 'q0' },
      orphan: { '0': 'q0', '1': 'q0' }, // never pointed to by anything
    });
    const result = analyzeSubsetConstruction(player, nfa);
    expect(result.mistakes.some((m) => m.kind === 'unused-state' && m.stateId === 'orphan')).toBe(
      true,
    );
  });
});

describe('analyzeSubsetConstruction: wrong-accepting', () => {
  it('flags a matched state with the wrong accept flag (both directions)', () => {
    const nfa = endsIn01Nfa();
    // q0,q2 should be accepting but isn't; nothing else is accepting either.
    const notAccepting = buildDfa(['0', '1'], 'q0', [], {
      q0: { '0': 'q0,q1', '1': 'q0' },
      'q0,q1': { '0': 'q0,q1', '1': 'q0,q2' },
      'q0,q2': { '0': 'q0,q1', '1': 'q0' },
    });
    const r1 = analyzeSubsetConstruction(notAccepting, nfa);
    expect(r1.mistakes.some((m) => m.kind === 'wrong-accepting' && m.stateId === 'q0,q2')).toBe(
      true,
    );

    // q0 marked accepting when it shouldn't be.
    const wronglyAccepting = buildDfa(['0', '1'], 'q0', ['q0', 'q0,q2'], {
      q0: { '0': 'q0,q1', '1': 'q0' },
      'q0,q1': { '0': 'q0,q1', '1': 'q0,q2' },
      'q0,q2': { '0': 'q0,q1', '1': 'q0' },
    });
    const r2 = analyzeSubsetConstruction(wronglyAccepting, nfa);
    expect(r2.mistakes.some((m) => m.kind === 'wrong-accepting' && m.stateId === 'q0')).toBe(true);
  });
});

describe('analyzeSubsetConstruction: wrong-transition', () => {
  it('flags a matched state whose transition goes to the wrong (non-closure-related) target', () => {
    const nfa = endsIn01Nfa();
    const player = buildDfa(['0', '1'], 'q0', ['q0,q2'], {
      q0: { '0': 'q0', '1': 'q0' }, // wrong: '0' should go to "q0,q1", not loop on q0
      'q0,q1': { '0': 'q0,q1', '1': 'q0,q2' },
      'q0,q2': { '0': 'q0,q1', '1': 'q0' },
    });
    const result = analyzeSubsetConstruction(player, nfa);
    expect(result.mistakes.some((m) => m.kind === 'wrong-transition' && m.stateId === 'q0')).toBe(
      true,
    );
  });

  it('flags a missing transition on a matched state', () => {
    const nfa = endsIn01Nfa();
    const player = buildDfa(['0', '1'], 'q0', ['q0,q2'], {
      q0: { '1': 'q0' }, // '0' transition missing entirely
      'q0,q1': { '0': 'q0,q1', '1': 'q0,q2' },
      'q0,q2': { '0': 'q0,q1', '1': 'q0' },
    });
    const result = analyzeSubsetConstruction(player, nfa);
    expect(
      result.mistakes.some(
        (m) => m.kind === 'wrong-transition' && m.detail.includes('missing a transition'),
      ),
    ).toBe(true);
  });
});

describe('analyzeSubsetConstruction: wrong-epsilon-closure', () => {
  it('flags a transition target that correctly applied move() but forgot ε-closure, and the language is actually wrong because the omitted state was accepting', () => {
    const nfa = midPathEpsilonNfa();
    // q0 correctly matched. On 'a', should go to "q1,q2" (accepting, since q2 is accepting)
    // but the player only recorded "q1" — the raw move() result, un-closed, and (honestly,
    // by the NFA's own accepting set) not accepting — so this submission rejects "a" when
    // it should accept it.
    const player = buildDfa(['a'], 'q0', [], {
      q0: { a: 'q1' }, // wrong: missing ε-closure into accepting q2
      q1: {},
    });
    const result = analyzeSubsetConstruction(player, nfa);
    expect(result.correct).toBe(false);
    expect(result.counterexample).toBe('a');
    expect(
      result.mistakes.some((m) => m.kind === 'wrong-epsilon-closure' && m.stateId === 'q1'),
    ).toBe(true);
  });

  it('does not mis-flag a correct ε-closed transition as a mistake', () => {
    const nfa = midPathEpsilonNfa();
    const player = buildDfa(['a'], 'q0', ['q1,q2'], {
      q0: { a: 'q1,q2' },
      'q1,q2': {},
    });
    const result = analyzeSubsetConstruction(player, nfa);
    expect(result.correct).toBe(true);
    expect(result.mistakes.filter((m) => m.kind === 'wrong-epsilon-closure')).toEqual([]);
  });

  it('a structurally sloppy but behaviorally inert closure omission still grades correct by language equivalence (never by graph shape)', () => {
    // Reuses the original 2-symbol NFA where q2 (reached only via ε from q1) has no
    // outgoing transitions and is NOT itself accepting — so "q1" alone behaves identically
    // to "q1,q2" for every input. The omission is a structural slip, not a language bug.
    const q0 = stateId('q0');
    const q1 = stateId('q1');
    const q2 = stateId('q2');
    const q3 = stateId('q3');
    const nfa: NFA = {
      alphabet: ['a', 'b'],
      states: [q0, q1, q2, q3],
      start: q0,
      accepting: new Set([q3]),
      delta: new Map<StateId, Map<Sym, ReadonlySet<StateId>>>([
        [q0, new Map([['a', new Set([q1])]])],
        [q1, new Map([[EPSILON, new Set([q2])]])],
        [q2, new Map([['b', new Set([q3])]])],
      ]),
    };
    const player = buildDfa(['a', 'b'], 'q0', ['q3'], {
      q0: { a: 'q1' },
      q1: { b: 'q3' },
      q3: {},
    });
    const result = analyzeSubsetConstruction(player, nfa);
    expect(result.correct).toBe(true); // language-equivalent despite the structural slip
    expect(
      result.mistakes.some((m) => m.kind === 'wrong-epsilon-closure' && m.stateId === 'q1'),
    ).toBe(true); // still surfaced as a diagnostic note, just not a failing grade
  });
});
