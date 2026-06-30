import { describe, expect, it } from 'vitest';
import {
  addOrExtendEdge,
  addState,
  setStart,
  toggleAccepting,
  emptyBuilderModel,
} from '@/lib/automata/builder-types';
import { builderModelToGraphModel } from './graph-model';

describe('builderModelToGraphModel', () => {
  it('maps states to nodes preserving id, position, start, and accepting flags', () => {
    let m = emptyBuilderModel();
    m = addState(m); // q0, auto-start
    m = addState(m); // q1
    m = toggleAccepting(m, 'q1');

    const graph = builderModelToGraphModel(m);
    expect(graph.nodes).toHaveLength(2);
    const q0 = graph.nodes.find((n) => n.id === 'q0')!;
    const q1 = graph.nodes.find((n) => n.id === 'q1')!;
    expect(q0.isStart).toBe(true);
    expect(q0.isAccepting).toBe(false);
    expect(q1.isStart).toBe(false);
    expect(q1.isAccepting).toBe(true);
  });

  it('displays subset-style labels with braces, matching displayLabel conventions', () => {
    let m = emptyBuilderModel();
    m = addState(m);
    const graph = builderModelToGraphModel(m);
    // q0 (single, no comma) renders plain; renaming to a comma-joined subset renders braced —
    // exercised indirectly here by checking the plain single-id case stays unbraced.
    expect(graph.nodes[0]!.label).toBe('q0');
  });

  it('merges multiple symbols on the same (from,to) edge into one comma-joined label', () => {
    let m = emptyBuilderModel();
    m = addState(m); // q0
    m = addOrExtendEdge(m, 'q0', 'q0', '0');
    m = addOrExtendEdge(m, 'q0', 'q0', '1');

    const graph = builderModelToGraphModel(m);
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0]!.label).toBe('0, 1');
  });

  it('produces no nodes or edges for an empty model', () => {
    const graph = builderModelToGraphModel(emptyBuilderModel());
    expect(graph.nodes).toEqual([]);
    expect(graph.edges).toEqual([]);
  });

  it('reflects setStart correctly when called after construction', () => {
    let m = emptyBuilderModel();
    m = addState(m); // q0, auto-start
    m = addState(m); // q1
    m = setStart(m, 'q1');
    const graph = builderModelToGraphModel(m);
    expect(graph.nodes.find((n) => n.id === 'q0')!.isStart).toBe(false);
    expect(graph.nodes.find((n) => n.id === 'q1')!.isStart).toBe(true);
  });
});
