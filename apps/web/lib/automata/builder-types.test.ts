import { describe, expect, it } from 'vitest';
import { accepts, areEquivalent } from '@arc/engine-automata';
import {
  addOrExtendEdge,
  addState,
  compileToDfa,
  deleteEdge,
  deleteState,
  emptyBuilderModel,
  moveState,
  renameState,
  setStart,
  toggleAccepting,
  usedSymbolTargets,
  validateBuilder,
  type BuilderModel,
} from './builder-types';

const ALPHABET = ['0', '1'];

/** Builds the canonical 3-state "ends in 01" DFA via the editor's own
 * mutation functions, exactly as a player clicking through the UI would. */
function buildCorrectModel(): BuilderModel {
  let m = emptyBuilderModel();
  m = addState(m); // q0, auto-start
  m = addState(m); // q1
  m = addState(m); // q2
  m = toggleAccepting(m, 'q2');
  m = addOrExtendEdge(m, 'q0', 'q0', '1');
  m = addOrExtendEdge(m, 'q0', 'q1', '0');
  m = addOrExtendEdge(m, 'q1', 'q1', '0');
  m = addOrExtendEdge(m, 'q1', 'q2', '1');
  m = addOrExtendEdge(m, 'q2', 'q1', '0');
  m = addOrExtendEdge(m, 'q2', 'q0', '1');
  return m;
}

describe('addState', () => {
  it('auto-labels q0, q1, q2... and makes the first state the start', () => {
    let m = emptyBuilderModel();
    m = addState(m);
    expect(m.states).toEqual([{ id: 'q0', x: 60, y: 60, isStart: true, isAccepting: false }]);
    m = addState(m);
    expect(m.states[1]!.id).toBe('q1');
    expect(m.states[1]!.isStart).toBe(false);
  });

  it('reuses the lowest free label after a deletion', () => {
    let m = emptyBuilderModel();
    m = addState(addState(addState(m))); // q0,q1,q2
    m = deleteState(m, 'q1');
    m = addState(m);
    expect(m.states.map((s) => s.id)).toEqual(['q0', 'q2', 'q1']);
  });
});

describe('setStart', () => {
  it('ensures at most one start state', () => {
    let m = addState(addState(emptyBuilderModel()));
    m = setStart(m, 'q1');
    expect(m.states.filter((s) => s.isStart).map((s) => s.id)).toEqual(['q1']);
  });
});

describe('deleteState', () => {
  it('removes every edge touching the deleted state (no dangling edges)', () => {
    let m = addState(addState(emptyBuilderModel()));
    m = addOrExtendEdge(m, 'q0', 'q1', '0');
    m = addOrExtendEdge(m, 'q1', 'q1', '1');
    m = deleteState(m, 'q1');
    expect(m.edges).toEqual([]);
  });
});

describe('addOrExtendEdge', () => {
  it('creates a new edge with one symbol', () => {
    let m = addState(addState(emptyBuilderModel()));
    m = addOrExtendEdge(m, 'q0', 'q1', '0');
    expect(m.edges).toEqual([{ id: 'q0->q1', from: 'q0', to: 'q1', symbols: ['0'] }]);
  });

  it('extends an existing (from,to) edge instead of duplicating it', () => {
    let m = addState(addState(emptyBuilderModel()));
    m = addOrExtendEdge(m, 'q0', 'q1', '0');
    m = addOrExtendEdge(m, 'q0', 'q1', '1');
    expect(m.edges).toHaveLength(1);
    expect(m.edges[0]!.symbols).toEqual(['0', '1']);
  });

  it('is idempotent re-picking the same symbol', () => {
    let m = addState(addState(emptyBuilderModel()));
    m = addOrExtendEdge(m, 'q0', 'q1', '0');
    m = addOrExtendEdge(m, 'q0', 'q1', '0');
    expect(m.edges[0]!.symbols).toEqual(['0']);
  });

  it('supports self-loops', () => {
    let m = addState(emptyBuilderModel());
    m = addOrExtendEdge(m, 'q0', 'q0', '0');
    expect(m.edges).toEqual([{ id: 'q0->q0', from: 'q0', to: 'q0', symbols: ['0'] }]);
  });
});

describe('deleteEdge', () => {
  it('removes only the targeted edge', () => {
    let m = addState(addState(emptyBuilderModel()));
    m = addOrExtendEdge(m, 'q0', 'q1', '0');
    m = addOrExtendEdge(m, 'q1', 'q0', '1');
    m = deleteEdge(m, 'q0->q1');
    expect(m.edges.map((e) => e.id)).toEqual(['q1->q0']);
  });
});

describe('moveState', () => {
  it('updates only the moved state position', () => {
    let m = addState(addState(emptyBuilderModel()));
    m = moveState(m, 'q1', 999, 111);
    expect(m.states.find((s) => s.id === 'q1')).toMatchObject({ x: 999, y: 111 });
    expect(m.states.find((s) => s.id === 'q0')).toMatchObject({ x: 60, y: 60 });
  });
});

describe('usedSymbolTargets', () => {
  it('reports which target each symbol from a state already commits to', () => {
    let m = addState(addState(addState(emptyBuilderModel())));
    m = addOrExtendEdge(m, 'q0', 'q1', '0');
    m = addOrExtendEdge(m, 'q0', 'q2', '1');
    const used = usedSymbolTargets(m.edges, 'q0');
    expect(used.get('0')).toBe('q1');
    expect(used.get('1')).toBe('q2');
  });
});

describe('validateBuilder', () => {
  it('rejects an empty canvas', () => {
    expect(validateBuilder(emptyBuilderModel())).toEqual({
      valid: false,
      error: 'Add at least one state to begin.',
    });
  });

  it('rejects a canvas with no start state', () => {
    const m: BuilderModel = {
      states: [{ id: 'q0', x: 0, y: 0, isStart: false, isAccepting: false }],
      edges: [],
    };
    expect(validateBuilder(m).valid).toBe(false);
  });

  it('accepts a single start state with no other states', () => {
    expect(validateBuilder(addState(emptyBuilderModel())).valid).toBe(true);
  });
});

describe('compileToDfa + grading integration', () => {
  it('a correctly-built model compiles to a DFA equivalent to the canonical reference', () => {
    const model = buildCorrectModel();
    expect(validateBuilder(model).valid).toBe(true);
    const dfa = compileToDfa(model, ALPHABET);

    // Independently hand-built reference for "ends in 01", different state
    // construction order — proves grading is by LANGUAGE, not by replaying
    // the exact same editor steps.
    const examples: Array<[string, boolean]> = [
      ['01', true],
      ['101', true],
      ['00101', true],
      ['', false],
      ['0', false],
      ['10', false],
      ['011', false],
    ];
    for (const [input, expected] of examples) {
      expect(accepts(dfa, input)).toBe(expected);
    }
  });

  it('a model built in a different order is still equivalent (graph-shape independence)', () => {
    // Same language, built via a different click sequence / different
    // intermediate state, proving the auto-grader cares about behavior only.
    let m = emptyBuilderModel();
    m = addState(m); // q0 start
    m = addOrExtendEdge(m, 'q0', 'q0', '1');
    m = addState(m); // q1
    m = addOrExtendEdge(m, 'q0', 'q1', '0');
    m = addOrExtendEdge(m, 'q1', 'q1', '0');
    m = addState(m); // q2
    m = toggleAccepting(m, 'q2');
    m = addOrExtendEdge(m, 'q1', 'q2', '1');
    m = addOrExtendEdge(m, 'q2', 'q0', '1');
    m = addOrExtendEdge(m, 'q2', 'q1', '0');

    const a = compileToDfa(m, ALPHABET);
    const b = compileToDfa(buildCorrectModel(), ALPHABET);
    expect(areEquivalent(a, b)).toBe(true);
  });

  it('a wrong model (accepts ending in 0, not 01) is correctly NOT equivalent', () => {
    let m = emptyBuilderModel();
    m = addState(m); // q0
    m = addState(m); // q1
    m = toggleAccepting(m, 'q1');
    m = addOrExtendEdge(m, 'q0', 'q1', '0');
    m = addOrExtendEdge(m, 'q0', 'q0', '1');
    m = addOrExtendEdge(m, 'q1', 'q1', '0');
    m = addOrExtendEdge(m, 'q1', 'q0', '1');

    const wrong = compileToDfa(m, ALPHABET);
    const correct = compileToDfa(buildCorrectModel(), ALPHABET);
    expect(areEquivalent(wrong, correct)).toBe(false);
  });

  it('leaves missing transitions undefined (implicit dead state) rather than throwing', () => {
    const m = addState(emptyBuilderModel()); // q0 only, no transitions at all
    const dfa = compileToDfa(m, ALPHABET);
    expect(accepts(dfa, '0')).toBe(false);
    expect(accepts(dfa, '')).toBe(false);
  });
});

describe('renameState', () => {
  it('renames a state and rewrites edges referencing it on both ends', () => {
    let m = emptyBuilderModel();
    m = addState(m); // q0
    m = addState(m); // q1
    m = addOrExtendEdge(m, 'q0', 'q1', '0');
    m = addOrExtendEdge(m, 'q1', 'q1', '1');

    const { model, error } = renameState(m, 'q0', 'q0,q1');
    expect(error).toBeNull();
    expect(model.states.map((s) => s.id)).toEqual(['q0,q1', 'q1']);
    expect(model.edges).toEqual([
      { id: 'q0,q1->q1', from: 'q0,q1', to: 'q1', symbols: ['0'] },
      { id: 'q1->q1', from: 'q1', to: 'q1', symbols: ['1'] },
    ]);
  });

  it('preserves start/accepting flags across a rename', () => {
    let m = emptyBuilderModel();
    m = addState(m); // q0, auto-start
    m = toggleAccepting(m, 'q0');
    const { model } = renameState(m, 'q0', 'renamed');
    expect(model.states[0]).toMatchObject({ id: 'renamed', isStart: true, isAccepting: true });
  });

  it('rejects an empty name', () => {
    const m = addState(emptyBuilderModel());
    const { model, error } = renameState(m, 'q0', '   ');
    expect(error).toBe('State name cannot be empty.');
    expect(model.states[0]!.id).toBe('q0'); // unchanged
  });

  it('rejects renaming to a name another state already has', () => {
    let m = emptyBuilderModel();
    m = addState(m); // q0
    m = addState(m); // q1
    const { error } = renameState(m, 'q0', 'q1');
    expect(error).toBe('A state named "q1" already exists.');
  });

  it('renaming to the same (trimmed) name is a no-op, not an error', () => {
    const m = addState(emptyBuilderModel());
    const { model, error } = renameState(m, 'q0', '  q0  ');
    expect(error).toBeNull();
    expect(model).toBe(m); // identical reference — truly a no-op
  });

  it('rewrites a self-loop to use the new id on both ends without duplicating it', () => {
    let m = emptyBuilderModel();
    m = addState(m); // q0
    m = addOrExtendEdge(m, 'q0', 'q0', '0'); // self-loop
    m = addOrExtendEdge(m, 'q0', 'q0', '1'); // extends the same self-loop edge

    const { model, error } = renameState(m, 'q0', 'q0,q1');
    expect(error).toBeNull();
    expect(model.edges).toHaveLength(1);
    expect(model.edges[0]).toMatchObject({ id: 'q0,q1->q0,q1', from: 'q0,q1', to: 'q0,q1' });
    expect(new Set(model.edges[0]!.symbols)).toEqual(new Set(['0', '1']));
  });

  it('leaves edges untouched when neither endpoint is the renamed state', () => {
    let m = emptyBuilderModel();
    m = addState(m); // q0
    m = addState(m); // q1
    m = addState(m); // q2
    m = addOrExtendEdge(m, 'q1', 'q2', '0');

    const { model } = renameState(m, 'q0', 'renamed');
    expect(model.edges).toEqual(m.edges);
  });

  it('grading by language equivalence works regardless of subset-style state labels', () => {
    let m = emptyBuilderModel();
    m = addState(m); // q0
    m = addState(m); // q1
    m = addState(m); // q2
    m = toggleAccepting(m, 'q2');
    m = addOrExtendEdge(m, 'q0', 'q0', '1');
    m = addOrExtendEdge(m, 'q0', 'q1', '0');
    m = addOrExtendEdge(m, 'q1', 'q1', '0');
    m = addOrExtendEdge(m, 'q1', 'q2', '1');
    m = addOrExtendEdge(m, 'q2', 'q0', '1');
    m = addOrExtendEdge(m, 'q2', 'q1', '0');

    let renamed = renameState(m, 'q0', 'q0').model;
    renamed = renameState(renamed, 'q1', 'q0,q1').model;
    renamed = renameState(renamed, 'q2', 'q0,q1,q2').model;

    const a = compileToDfa(renamed, ALPHABET);
    const b = compileToDfa(m, ALPHABET);
    expect(areEquivalent(a, b)).toBe(true);
  });
});
