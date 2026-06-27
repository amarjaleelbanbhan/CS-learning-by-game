import { describe, expect, it } from 'vitest';
import { validateUnlockGraph } from '@arc/engine-game';
import {
  CONCEPTS,
  COMMON_MISTAKES,
  MISCONCEPTIONS,
  MISSIONS,
  QUESTION_TYPES,
  QUESTION_FORMATS,
  UNIVERSITY_MAPPINGS,
  conceptById,
  conceptChildren,
  conceptTier,
  curriculumHealthScore,
  designedMissions,
  difficultyDistribution,
  futureConcepts,
  liveMissions,
  missionTier,
  mistakesForConcept,
  misconceptionsForConcept,
  prerequisiteDepth,
  toConceptUnlockNodes,
  toMissionUnlockNodes,
  universitiesCoveringConcept,
  v1Concepts,
  v1ConceptCoveragePercentage,
  v1Missions,
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

  it('every v2-future / advanced-optional concept records a scopeReason', () => {
    for (const c of futureConcepts()) {
      expect(c.scopeReason, `${c.id} is out-of-v1 but has no scopeReason`).toBeTruthy();
    }
  });

  it('v1Concepts + futureConcepts partition CONCEPTS exactly', () => {
    expect(v1Concepts().length + futureConcepts().length).toBe(CONCEPTS.length);
  });

  it('conceptChildren is the exact reverse of prerequisites', () => {
    for (const c of CONCEPTS) {
      for (const childId of conceptChildren(c.id)) {
        const child = conceptById(childId)!;
        expect(child.prerequisites).toContain(c.id);
      }
    }
  });

  it('prerequisiteDepth is 0 for every root concept and finite for every other', () => {
    for (const c of CONCEPTS) {
      const d = prerequisiteDepth(c.id);
      if (c.prerequisites.length === 0) expect(d).toBe(0);
      else expect(d).toBeGreaterThan(0);
    }
  });

  it('conceptTier never throws and always returns a known tier', () => {
    const known = ['tutorial', 'bronze', 'silver', 'gold', 'diamond', 'master', 'legend', 'boss'];
    for (const c of CONCEPTS) {
      expect(known).toContain(conceptTier(c));
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

  it('every mission references a question format that exists in the taxonomy', () => {
    const validIds = new Set(QUESTION_FORMATS.map((f) => f.id));
    for (const m of MISSIONS) {
      expect(
        validIds.has(m.format),
        `mission ${m.id} uses unknown question format ${m.format}`,
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

  it('v2-future missions are excluded from v1Missions()', () => {
    const v1Ids = new Set(v1Missions().map((m) => m.id));
    expect(v1Ids.has('toa.design.moore-mealy-01')).toBe(false);
    expect(v1Missions().every((m) => m.versionScope === 'v1')).toBe(true);
  });

  it('every isCapstone mission resolves to the boss tier regardless of its other factors', () => {
    for (const m of MISSIONS.filter((m) => m.isCapstone)) {
      expect(missionTier(m)).toBe('boss');
    }
  });

  it('missionTier never throws and always returns a known tier', () => {
    const known = ['tutorial', 'bronze', 'silver', 'gold', 'diamond', 'master', 'legend', 'boss'];
    for (const m of MISSIONS) {
      expect(known).toContain(missionTier(m));
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

describe('curriculum: common mistakes (legacy, still valid)', () => {
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

describe('curriculum: misconception database', () => {
  it('every entry references a concept that exists', () => {
    for (const m of MISCONCEPTIONS) {
      expect(
        conceptById(m.conceptId),
        `misconception ${m.id} references unknown concept ${m.conceptId}`,
      ).toBeDefined();
    }
  });

  it('every entry has unique id, non-empty socratic ladder, and non-empty hint progression', () => {
    const ids = MISCONCEPTIONS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const m of MISCONCEPTIONS) {
      expect(m.socraticQuestions.length).toBeGreaterThan(0);
      expect(m.hintProgression.length).toBeGreaterThan(0);
    }
  });

  it('every socratic question is phrased as a question (never a statement of the fix)', () => {
    for (const m of MISCONCEPTIONS) {
      for (const q of m.socraticQuestions) {
        expect(q.trim().endsWith('?'), `${m.id}: "${q}" does not end in a question mark`).toBe(
          true,
        );
      }
    }
  });

  it('misconceptionsForConcept filters correctly', () => {
    const some = misconceptionsForConcept('dfa-fundamentals');
    expect(some.every((m) => m.conceptId === 'dfa-fundamentals')).toBe(true);
    expect(some.length).toBeGreaterThan(0);
  });
});

describe('curriculum: university mappings', () => {
  it('every mapping id is unique', () => {
    const ids = UNIVERSITY_MAPPINGS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every mapped concept id exists in the canonical graph', () => {
    for (const mapping of UNIVERSITY_MAPPINGS) {
      for (const conceptId of mapping.conceptIds) {
        expect(
          conceptById(conceptId),
          `${mapping.id} references unknown concept ${conceptId}`,
        ).toBeDefined();
      }
    }
  });

  it('public-syllabus mappings always carry at least one source URL', () => {
    for (const mapping of UNIVERSITY_MAPPINGS.filter((m) => m.confidence === 'public-syllabus')) {
      expect(
        mapping.sourceUrls.length,
        `${mapping.id} claims public-syllabus confidence with no source`,
      ).toBeGreaterThan(0);
    }
  });

  it('the original ingestion source (Sukkur IBA) is marked confirmed, not inferred', () => {
    const sukkur = UNIVERSITY_MAPPINGS.find((m) => m.id === 'sukkur-iba')!;
    expect(sukkur.confidence).toBe('confirmed');
  });

  it('universitiesCoveringConcept finds at least one match for a near-universal concept', () => {
    expect(universitiesCoveringConcept('dfa-fundamentals').length).toBeGreaterThan(0);
  });
});

describe('curriculum: difficulty model & analytics', () => {
  it('difficultyDistribution sums to the total mission count', () => {
    const dist = difficultyDistribution();
    const total = Object.values(dist).reduce((a, b) => a + b, 0);
    expect(total).toBe(MISSIONS.length);
  });

  it('v1ConceptCoveragePercentage is between 0 and 100', () => {
    const pct = v1ConceptCoveragePercentage();
    expect(pct).toBeGreaterThanOrEqual(0);
    expect(pct).toBeLessThanOrEqual(100);
  });

  it('curriculumHealthScore is a finite number between 0 and 100', () => {
    const score = curriculumHealthScore();
    expect(Number.isFinite(score)).toBe(true);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
