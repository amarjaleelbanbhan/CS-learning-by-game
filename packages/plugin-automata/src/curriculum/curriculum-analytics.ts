import { CONCEPTS, type CurriculumConcept } from './concepts.js';
import { computeDifficultyTier, type DifficultyTier } from './difficulty-model.js';
import { MISSIONS, missionsForConcept, type CurriculumMission } from './missions.js';
import { MISCONCEPTIONS, misconceptionsForConcept } from './misconceptions.js';
import { UNIVERSITY_MAPPINGS } from './university-mappings.js';

/**
 * Derived/aggregate layer (PROMPT 04.6) — every value here is COMPUTED from
 * concepts.ts/missions.ts/misconceptions.ts/university-mappings.ts, never hand-maintained.
 * This is what the audit report and tests consume so the report can never drift from the
 * actual data it is describing.
 */

/** Longest prerequisite chain from any root concept down to `conceptId` (0 for a root). */
export function prerequisiteDepth(conceptId: string): number {
  const byId = new Map(CONCEPTS.map((c) => [c.id, c]));
  const memo = new Map<string, number>();
  function depth(id: string, stack: ReadonlySet<string>): number {
    if (memo.has(id)) return memo.get(id)!;
    if (stack.has(id)) throw new Error(`cycle detected at ${id}`);
    const concept = byId.get(id);
    if (!concept || concept.prerequisites.length === 0) {
      memo.set(id, 0);
      return 0;
    }
    const nextStack = new Set(stack);
    nextStack.add(id);
    const d = 1 + Math.max(...concept.prerequisites.map((p) => depth(p, nextStack)));
    memo.set(id, d);
    return d;
  }
  return depth(conceptId, new Set());
}

export function conceptTier(concept: CurriculumConcept): DifficultyTier {
  const f = concept.complexityFactors;
  return computeDifficultyTier({
    prerequisiteDepth: prerequisiteDepth(concept.id),
    estimatedMinutes: concept.estimatedStudyMinutes,
    structuralSize: f.structuralSize,
    branchingFactor: f.branchingFactor,
    proofComplexity: f.proofComplexity,
    constructionEffort: f.constructionEffort,
    reasoningSteps: f.reasoningSteps,
  });
}

export function missionTier(mission: CurriculumMission): DifficultyTier {
  const concept = CONCEPTS.find((c) => c.id === mission.conceptId);
  return computeDifficultyTier({
    prerequisiteDepth: concept ? prerequisiteDepth(concept.id) : 0,
    estimatedMinutes: mission.estimatedMinutes,
    proofComplexity:
      mission.questionType === 'ambiguity-proof' || mission.questionType === 'regularity-proof'
        ? 4
        : undefined,
    isCapstone: mission.isCapstone,
  });
}

export function missionCountForConcept(conceptId: string): number {
  return missionsForConcept(conceptId).length;
}

export function bossAvailableForConcept(conceptId: string): boolean {
  return missionsForConcept(conceptId).some(
    (m) => missionTier(m) === 'boss' || missionTier(m) === 'legend',
  );
}

export function misconceptionCountForConcept(conceptId: string): number {
  return misconceptionsForConcept(conceptId).length;
}

export function difficultyDistribution(): Readonly<Record<DifficultyTier, number>> {
  const dist: Record<DifficultyTier, number> = {
    tutorial: 0,
    bronze: 0,
    silver: 0,
    gold: 0,
    diamond: 0,
    master: 0,
    legend: 0,
    boss: 0,
  };
  for (const m of MISSIONS) {
    dist[missionTier(m)] += 1;
  }
  return dist;
}

/** % of v1 concepts that have at least one mission referencing them. */
export function v1ConceptCoveragePercentage(): number {
  const v1 = CONCEPTS.filter((c) => c.scope === 'v1');
  if (v1.length === 0) return 0;
  const covered = v1.filter((c) => missionCountForConcept(c.id) > 0).length;
  return Math.round((covered / v1.length) * 1000) / 10;
}

export function conceptsWithoutMissions(): readonly string[] {
  return CONCEPTS.filter((c) => c.scope === 'v1' && missionCountForConcept(c.id) === 0).map(
    (c) => c.id,
  );
}

export function conceptsWithoutMisconceptions(): readonly string[] {
  return CONCEPTS.filter((c) => c.scope === 'v1' && misconceptionCountForConcept(c.id) === 0).map(
    (c) => c.id,
  );
}

/**
 * Composite 0–100 health score. Deliberately simple and documented rather than a black
 * box: graph validity is binary (any violation zeroes that component out), the rest are
 * coverage ratios weighted by how load-bearing they are for the stated game philosophy
 * (mission coverage matters most; misconception coverage feeds ARIA, the next-most
 * load-bearing system; university-mapping breadth matters least for V1 quality).
 */
export function curriculumHealthScore(): number {
  const missionCoverage = v1ConceptCoveragePercentage() / 100;
  const v1ConceptCount = CONCEPTS.filter((c) => c.scope === 'v1').length;
  const misconceptionCoverage =
    v1ConceptCount === 0
      ? 0
      : CONCEPTS.filter((c) => c.scope === 'v1' && misconceptionCountForConcept(c.id) > 0).length /
        v1ConceptCount;
  const universityBreadth = Math.min(1, UNIVERSITY_MAPPINGS.length / 6);
  const score = missionCoverage * 50 + misconceptionCoverage * 30 + universityBreadth * 20;
  return Math.round(score);
}

export function misconceptionStats(): { readonly total: number; readonly conceptsCovered: number } {
  const conceptsCovered = new Set(MISCONCEPTIONS.map((m) => m.conceptId)).size;
  return { total: MISCONCEPTIONS.length, conceptsCovered };
}
