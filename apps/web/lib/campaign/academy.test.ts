import { describe, expect, it } from 'vitest';
import { computeUnlocked } from '@arc/engine-game';
import { allMissions, DISTRICTS, toUnlockNodes } from './academy';
import { validateUnlockGraph } from '@arc/engine-game';

describe('Academy campaign content', () => {
  it('has no dangling dependencies, duplicates, or cycles', () => {
    expect(validateUnlockGraph(toUnlockNodes())).toEqual([]);
  });

  it('every district with missions has a reachable entry point (no dependsOn on empty districts)', () => {
    for (const d of DISTRICTS) {
      for (const m of d.missions) {
        // Every dependency must resolve to a real mission somewhere in the campaign.
        const allIds = new Set(allMissions().map((mm) => mm.id));
        for (const dep of m.dependsOn) {
          expect(allIds.has(dep)).toBe(true);
        }
      }
    }
  });

  it('the campaign starts open: at least one mission has no prerequisites', () => {
    expect(allMissions().some((m) => m.dependsOn.length === 0)).toBe(true);
  });

  it('completing missions in dependency order unlocks the whole built campaign', () => {
    const nodes = toUnlockNodes();
    const completed = new Set<string>();
    // Simulate a player clearing missions in a valid topological order.
    const order = [
      'toa.dfa-ends-01',
      'toa.build.dfa-ends-01',
      'toa.nfa-branching',
      'toa.design.nfa-determinize-01',
      'toa.nfa-to-dfa',
    ];
    for (const id of order) {
      expect(computeUnlocked(nodes, completed).has(id)).toBe(true);
      completed.add(id);
    }
    expect(completed.size).toBe(allMissions().length);
  });
});
