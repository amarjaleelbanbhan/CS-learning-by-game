import { describe, expect, it } from 'vitest';
import { dfaToGraphModel } from './graph-model';
import { describeAutomaton, transitionRows } from './AutomatonTextAlternative';
import { endsIn01View } from '@/lib/automata/examples';

const model = (() => {
  const v = endsIn01View();
  return dfaToGraphModel(v.dfa, v.layout);
})();

describe('describeAutomaton', () => {
  it('states the size, start state and accepting states', () => {
    const text = describeAutomaton(model);
    expect(text).toContain('3 states.');
    expect(text).toContain('Start state q0.');
    expect(text).toContain('Accepting state q2.');
  });

  it('reports transition count', () => {
    expect(describeAutomaton(model)).toMatch(/\d+ transitions?\./);
  });

  it('handles an empty automaton without crashing or lying', () => {
    const text = describeAutomaton({ nodes: [], edges: [] });
    expect(text).toContain('0 states.');
    expect(text).toContain('No accepting states.');
  });

  it('uses singular wording for a single state', () => {
    const text = describeAutomaton({
      nodes: [{ id: 'q0', label: 'q0', x: 0, y: 0, isStart: true, isAccepting: true }],
      edges: [],
    });
    expect(text).toContain('1 state.');
    expect(text).toContain('Accepting state q0.');
    expect(text).not.toContain('1 states');
  });
});

describe('transitionRows', () => {
  it('emits one row per edge, preserving from/symbol/to', () => {
    const rows = transitionRows(model);
    expect(rows.length).toBe(model.edges.length);
    for (const r of rows) {
      expect(r.from).toBeTruthy();
      expect(r.to).toBeTruthy();
      expect(typeof r.label).toBe('string');
    }
  });

  it('covers every state that has an outgoing transition', () => {
    const froms = new Set(transitionRows(model).map((r) => r.from));
    // The "ends in 01" DFA is total — every state has outgoing edges.
    expect(froms.size).toBe(model.nodes.length);
  });

  it('returns nothing for an automaton with no transitions', () => {
    expect(transitionRows({ nodes: [], edges: [] })).toEqual([]);
  });
});
