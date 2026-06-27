import { describe, expect, it } from 'vitest';
import { validateUnlockGraph } from '@arc/engine-game';
import {
  CONCEPTS,
  COMMON_MISTAKES,
  MISSIONS,
  QUESTION_TYPES,
  conceptById,
  designedMissions,
  liveMissions,
  mistakesForConcept,
  toConceptUnlockNodes,
  toMissionUnlockNodes,
} from '../src/curriculum/index.js';

describe('curriculum: concept graph', () => {
  it('has no dangling prerequisites, duplicate ids, or cycles', () => {
    expect(validateUnlockGraph(toConceptUnlockNodes())).toEqual([]);
  });

  it('every concept id is unique', () => {
    const ids = CONCEPTS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every concept has at least one source doc recorded (real or gap-flagged)', () => {
    for (const c of CONCEPTS) {
      expect(c.sourceDocs.length).toBeGreaterThan(0);
    }
  });
});

describe('curriculum: mission database', () => {
  it('has no dangling prerequisites, duplicate ids, or cycles', () => {
    expect(validateUnlockGraph(toMissionUnlockNodes())).toEqual([]);
  });

  it('every mission references a concept that actually exists in the knowledge graph', () => {
    for (const m of MISSIONS) {
      expect(
        conceptById(m.conceptId),
        `mission ${m.id} references unknown concept ${m.conceptId}`,
      ).toBeDefined();
    }
  });

  it('every mission references a question type that exists in the taxonomy', () => {
    const validIds = new Set(QUESTION_TYPES.map((q) => q.id));
    for (const m of MISSIONS) {
      expect(
        validIds.has(m.questionType),
        `mission ${m.id} uses unknown question type ${m.questionType}`,
      ).toBe(true);
    }
  });

  it('preserves the 4 live mission ids exactly as used in apps/web/lib/campaign/academy.ts', () => {
    const liveIds = liveMissions().map((m) => m.id);
    expect(liveIds.sort()).toEqual(
      ['toa.dfa-ends-01', 'toa.build.dfa-ends-01', 'toa.nfa-branching', 'toa.nfa-to-dfa'].sort(),
    );
  });

  it('every designed (not-yet-built) mission is honestly flagged and none silently overlaps a live id', () => {
    const liveIds = new Set(liveMissions().map((m) => m.id));
    for (const m of designedMissions()) {
      expect(liveIds.has(m.id)).toBe(false);
      expect(m.status).toBe('designed');
    }
  });

  it('every mission has a Socratic hint ladder that never contains the literal answer keyword "answer is"', () => {
    for (const m of MISSIONS) {
      for (const hint of m.hints) {
        expect(hint.toLowerCase()).not.toContain('the answer is');
      }
    }
  });

  it('a full topological playthrough unlocks every mission exactly once', () => {
    const nodes = toMissionUnlockNodes();
    const completed = new Set<string>();
    const remaining = new Set(nodes.map((n) => n.id));
    let guard = 0;
    while (remaining.size > 0) {
      guard += 1;
      if (guard > nodes.length + 1)
        throw new Error('playthrough did not converge — likely a cycle');
      const ready = nodes.filter(
        (n) => remaining.has(n.id) && n.dependsOn.every((d) => completed.has(d)),
      );
      expect(ready.length, 'no mission became unlockable this pass').toBeGreaterThan(0);
      for (const n of ready) {
        completed.add(n.id);
        remaining.delete(n.id);
      }
    }
    expect(completed.size).toBe(nodes.length);
  });
});

describe('curriculum: common mistakes', () => {
  it('every entry references a concept that exists', () => {
    for (const m of COMMON_MISTAKES) {
      expect(
        conceptById(m.conceptId),
        `mistake references unknown concept ${m.conceptId}`,
      ).toBeDefined();
    }
  });

  it('no hint reveals the fix outright (heuristic: every hint is phrased as a question)', () => {
    for (const m of COMMON_MISTAKES) {
      expect(m.socraticHint.trim().endsWith('?')).toBe(true);
    }
  });

  it('mistakesForConcept filters correctly', () => {
    const some = mistakesForConcept('dfa-fundamentals');
    expect(some.every((m) => m.conceptId === 'dfa-fundamentals')).toBe(true);
    expect(some.length).toBeGreaterThan(0);
  });
});
