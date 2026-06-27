import { describe, expect, it } from 'vitest';
import { computeUnlocked, isUnlocked, validateUnlockGraph, type UnlockNode } from '../src/index.js';

describe('isUnlocked / computeUnlocked', () => {
  const nodes: UnlockNode[] = [
    { id: 'a', dependsOn: [] },
    { id: 'b', dependsOn: ['a'] },
    { id: 'c', dependsOn: ['a', 'b'] },
  ];

  it('a node with no dependencies is always unlocked', () => {
    expect(isUnlocked(nodes[0]!, new Set())).toBe(true);
  });

  it('a node is locked until every dependency is completed', () => {
    expect(isUnlocked(nodes[1]!, new Set())).toBe(false);
    expect(isUnlocked(nodes[1]!, new Set(['a']))).toBe(true);
    expect(isUnlocked(nodes[2]!, new Set(['a']))).toBe(false);
    expect(isUnlocked(nodes[2]!, new Set(['a', 'b']))).toBe(true);
  });

  it('fails closed on an unknown dependency id (never satisfiable)', () => {
    const node: UnlockNode = { id: 'x', dependsOn: ['ghost'] };
    expect(isUnlocked(node, new Set(['a', 'b', 'c']))).toBe(false);
  });

  it('computeUnlocked returns exactly the unlocked subset', () => {
    expect(computeUnlocked(nodes, new Set())).toEqual(new Set(['a']));
    expect(computeUnlocked(nodes, new Set(['a']))).toEqual(new Set(['a', 'b']));
    expect(computeUnlocked(nodes, new Set(['a', 'b']))).toEqual(new Set(['a', 'b', 'c']));
  });
});

describe('validateUnlockGraph', () => {
  it('accepts a well-formed acyclic graph', () => {
    const nodes: UnlockNode[] = [
      { id: 'a', dependsOn: [] },
      { id: 'b', dependsOn: ['a'] },
    ];
    expect(validateUnlockGraph(nodes)).toEqual([]);
  });

  it('flags a dependency on an unknown id', () => {
    const nodes: UnlockNode[] = [{ id: 'a', dependsOn: ['ghost'] }];
    const errors = validateUnlockGraph(nodes);
    expect(errors.some((e) => /unknown id "ghost"/.test(e))).toBe(true);
  });

  it('flags duplicate ids', () => {
    const nodes: UnlockNode[] = [
      { id: 'a', dependsOn: [] },
      { id: 'a', dependsOn: [] },
    ];
    expect(validateUnlockGraph(nodes).some((e) => /Duplicate node id "a"/.test(e))).toBe(true);
  });

  it('flags a cycle', () => {
    const nodes: UnlockNode[] = [
      { id: 'a', dependsOn: ['b'] },
      { id: 'b', dependsOn: ['a'] },
    ];
    expect(validateUnlockGraph(nodes).some((e) => /Cycle detected/.test(e))).toBe(true);
  });

  it('does not flag a diamond dependency (shared ancestor, not a cycle)', () => {
    const nodes: UnlockNode[] = [
      { id: 'a', dependsOn: [] },
      { id: 'b', dependsOn: ['a'] },
      { id: 'c', dependsOn: ['a'] },
      { id: 'd', dependsOn: ['b', 'c'] },
    ];
    expect(validateUnlockGraph(nodes)).toEqual([]);
  });
});
