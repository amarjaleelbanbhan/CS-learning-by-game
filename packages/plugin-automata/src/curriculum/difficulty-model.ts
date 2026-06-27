/**
 * Automated difficulty calibration (PROMPT 04.6 Phase 5).
 *
 * Difficulty tiers are NEVER hand-picked. Every concept and mission exposes structural
 * `complexityFactors`/estimates as DATA; this module is the one place that turns those
 * factors into a tier, via a single deterministic formula. Re-ordering the knowledge
 * graph (which changes prerequisite depth) automatically re-calibrates every tier below
 * it — there is no stored tier field anywhere in `concepts.ts` or `missions.ts` to fall
 * out of sync.
 */
export type DifficultyTier =
  | 'tutorial'
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'diamond'
  | 'master'
  | 'legend'
  | 'boss';

export interface DifficultyFactors {
  /** How many prerequisite "hops" deep this node sits in the knowledge graph (computed, see curriculum-analytics.ts). */
  readonly prerequisiteDepth: number;
  readonly estimatedMinutes: number;
  /** 0–5 each; omitted factors score 0 and simply don't contribute. */
  readonly structuralSize?: number;
  readonly branchingFactor?: number;
  readonly proofComplexity?: number;
  readonly constructionEffort?: number;
  readonly reasoningSteps?: number;
  /** District-capstone override: always resolves to 'boss' regardless of computed score. */
  readonly isCapstone?: boolean;
}

const TIER_ORDER: readonly DifficultyTier[] = [
  'tutorial',
  'bronze',
  'silver',
  'gold',
  'diamond',
  'master',
  'legend',
  'boss',
];

/** Upper score bound (inclusive) for every tier except the last, which catches everything above. */
const TIER_SCORE_CEILINGS: readonly number[] = [2, 5, 9, 13, 18, 24, 30];

export function computeDifficultyScore(factors: DifficultyFactors): number {
  const minutesScore = Math.min(5, factors.estimatedMinutes / 6);
  return (
    factors.prerequisiteDepth * 1.5 +
    minutesScore +
    (factors.structuralSize ?? 0) +
    (factors.branchingFactor ?? 0) +
    (factors.proofComplexity ?? 0) * 1.5 +
    (factors.constructionEffort ?? 0) +
    (factors.reasoningSteps ?? 0)
  );
}

export function computeDifficultyTier(factors: DifficultyFactors): DifficultyTier {
  if (factors.isCapstone) return 'boss';
  const score = computeDifficultyScore(factors);
  for (let i = 0; i < TIER_SCORE_CEILINGS.length; i += 1) {
    if (score <= TIER_SCORE_CEILINGS[i]!) return TIER_ORDER[i]!;
  }
  return 'boss';
}

export function tierRank(tier: DifficultyTier): number {
  return TIER_ORDER.indexOf(tier);
}
