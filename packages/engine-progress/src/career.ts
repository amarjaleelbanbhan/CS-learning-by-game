/**
 * Engineer Career engine — pure, data-driven rank/reputation/certification/blueprint logic.
 *
 * Subject plugins (e.g. plugin-automata) supply the actual content (rank ladder,
 * certification requirements, blueprint catalog, department list) as plain data;
 * this module only knows how to evaluate that data against a player's state.
 * Nothing here is specific to Theory of Automata — a future subject plugin can
 * define its own ladder/certifications/blueprints and reuse every function below.
 */

export interface RankDefinition {
  readonly id: string;
  readonly title: string;
  /** 0-based, must be strictly sequential within a ladder. */
  readonly order: number;
  /** Minimum Research Experience required before this rank can even be considered. */
  readonly rxThreshold: number;
  readonly requiredCertifications?: readonly string[];
  readonly requiredBlueprints?: readonly string[];
  /** departmentId -> minimum reputation score required. */
  readonly requiredDepartmentReputation?: Readonly<Record<string, number>>;
  readonly requiresBossVictory?: boolean;
  /** Free-form unlock flags this rank grants (district ids, feature flags, lab tier name, etc). Descriptive only — the engine does not interpret these. */
  readonly unlocks: readonly string[];
}

export interface CareerLadder {
  readonly ranks: readonly RankDefinition[];
}

export interface EngineerCareerState {
  readonly rx: number;
  readonly ec: number;
  readonly currentRankId: string;
  readonly earnedCertifications: readonly string[];
  readonly earnedBlueprints: readonly string[];
  readonly departmentReputation: Readonly<Record<string, number>>;
  readonly bossVictories: readonly string[];
}

export function createInitialCareerState(firstRankId: string): EngineerCareerState {
  return {
    rx: 0,
    ec: 0,
    currentRankId: firstRankId,
    earnedCertifications: [],
    earnedBlueprints: [],
    departmentReputation: {},
    bossVictories: [],
  };
}

/** Structural integrity check for a ladder authored by a subject plugin. Returns a list of issues (empty = valid). */
export function validateCareerLadder(ladder: CareerLadder): string[] {
  const issues: string[] = [];
  const ids = ladder.ranks.map((r) => r.id);
  if (new Set(ids).size !== ids.length) issues.push('duplicate rank ids');

  const sorted = [...ladder.ranks].sort((a, b) => a.order - b.order);
  for (let i = 0; i < sorted.length; i += 1) {
    if (sorted[i]!.order !== i) {
      issues.push(`rank order is not a contiguous 0-based sequence (gap/duplicate at index ${i})`);
      break;
    }
  }
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i]!.rxThreshold < sorted[i - 1]!.rxThreshold) {
      issues.push(`rxThreshold is not monotonically non-decreasing at "${sorted[i]!.id}"`);
    }
  }
  return issues;
}

export function rankById(ladder: CareerLadder, id: string): RankDefinition | undefined {
  return ladder.ranks.find((r) => r.id === id);
}

export function currentRank(ladder: CareerLadder, state: EngineerCareerState): RankDefinition {
  const rank = rankById(ladder, state.currentRankId);
  if (!rank) throw new Error(`Unknown current rank id: ${state.currentRankId}`);
  return rank;
}

export function nextRank(
  ladder: CareerLadder,
  state: EngineerCareerState,
): RankDefinition | undefined {
  const current = currentRank(ladder, state);
  return ladder.ranks.find((r) => r.order === current.order + 1);
}

/** Human-readable list of what's blocking the next promotion. Empty array means eligible right now. */
export function unmetPromotionRequirements(
  ladder: CareerLadder,
  state: EngineerCareerState,
): readonly string[] {
  const target = nextRank(ladder, state);
  if (!target) return [];

  const unmet: string[] = [];
  if (state.rx < target.rxThreshold) {
    unmet.push(`Research Experience: ${state.rx} / ${target.rxThreshold} RX`);
  }
  for (const certId of target.requiredCertifications ?? []) {
    if (!state.earnedCertifications.includes(certId)) {
      unmet.push(`Certification required: ${certId}`);
    }
  }
  for (const bpId of target.requiredBlueprints ?? []) {
    if (!state.earnedBlueprints.includes(bpId)) {
      unmet.push(`Blueprint required: ${bpId}`);
    }
  }
  for (const [deptId, min] of Object.entries(target.requiredDepartmentReputation ?? {})) {
    const have = state.departmentReputation[deptId] ?? 0;
    if (have < min) unmet.push(`Department reputation (${deptId}): ${have} / ${min}`);
  }
  if (target.requiresBossVictory && state.bossVictories.length === 0) {
    unmet.push('Boss mission victory required');
  }
  return unmet;
}

export function isEligibleForPromotion(ladder: CareerLadder, state: EngineerCareerState): boolean {
  return (
    nextRank(ladder, state) !== undefined && unmetPromotionRequirements(ladder, state).length === 0
  );
}

export function eligiblePromotionTarget(
  ladder: CareerLadder,
  state: EngineerCareerState,
): RankDefinition | undefined {
  return isEligibleForPromotion(ladder, state) ? nextRank(ladder, state) : undefined;
}

/**
 * Pure promotion application. If the player is eligible, returns a NEW state at the next
 * rank; otherwise returns the same state object unchanged. Promotion is never automatic —
 * callers decide when to invoke this (e.g. after a mission completes), and the caller is
 * responsible for noticing `result !== state` to trigger a ceremony.
 */
export function promote(ladder: CareerLadder, state: EngineerCareerState): EngineerCareerState {
  const target = eligiblePromotionTarget(ladder, state);
  if (!target) return state;
  return { ...state, currentRankId: target.id };
}

/** Repeatedly promotes until no further promotion is possible (handles multi-rank jumps from a single RX grant). */
export function promoteAll(ladder: CareerLadder, state: EngineerCareerState): EngineerCareerState {
  let next = state;
  let guard = 0;
  while (guard <= ladder.ranks.length) {
    const promoted = promote(ladder, next);
    if (promoted === next) return next;
    next = promoted;
    guard += 1;
  }
  return next;
}

export interface RankProgress {
  readonly rank: RankDefinition;
  readonly next: RankDefinition | undefined;
  readonly rxIntoRank: number;
  readonly rxSpanToNext: number | null;
  readonly rxProgressPct: number;
}

/** RX-only progress toward the next rank (other gating requirements are surfaced via unmetPromotionRequirements). */
export function rankProgress(ladder: CareerLadder, state: EngineerCareerState): RankProgress {
  const rank = currentRank(ladder, state);
  const next = nextRank(ladder, state);
  if (!next) {
    return {
      rank,
      next: undefined,
      rxIntoRank: state.rx - rank.rxThreshold,
      rxSpanToNext: null,
      rxProgressPct: 100,
    };
  }
  const span = next.rxThreshold - rank.rxThreshold;
  const into = state.rx - rank.rxThreshold;
  const pct = span > 0 ? Math.max(0, Math.min(100, Math.round((into / span) * 100))) : 100;
  return { rank, next, rxIntoRank: into, rxSpanToNext: span, rxProgressPct: pct };
}

// ---------------------------------------------------------------------------
// Department reputation
// ---------------------------------------------------------------------------

export interface ReputationTier {
  readonly id: string;
  readonly label: string;
  readonly threshold: number;
}

export interface DepartmentDefinition {
  readonly id: string;
  readonly label: string;
  readonly tiers: readonly ReputationTier[];
}

/** Highest tier whose threshold the score meets, or undefined if score is below every tier. */
export function reputationTier(
  department: DepartmentDefinition,
  score: number,
): ReputationTier | undefined {
  const eligible = department.tiers.filter((t) => score >= t.threshold);
  if (eligible.length === 0) return undefined;
  return eligible.reduce((best, t) => (t.threshold > best.threshold ? t : best));
}

export function addReputation(
  state: EngineerCareerState,
  departmentId: string,
  amount: number,
): EngineerCareerState {
  const current = state.departmentReputation[departmentId] ?? 0;
  return {
    ...state,
    departmentReputation: { ...state.departmentReputation, [departmentId]: current + amount },
  };
}

// ---------------------------------------------------------------------------
// Certifications
// ---------------------------------------------------------------------------

export interface CertificationRequirement {
  readonly id: string;
  readonly label: string;
  readonly requiredMissionIds: readonly string[];
}

/** Returns the ids of every certification whose required missions are a subset of completedMissionIds. Pure — recomputes the full set each call, never cumulative state. */
export function evaluateCertifications(
  defs: readonly CertificationRequirement[],
  completedMissionIds: ReadonlySet<string>,
): readonly string[] {
  return defs
    .filter((def) => def.requiredMissionIds.every((id) => completedMissionIds.has(id)))
    .map((def) => def.id);
}

// ---------------------------------------------------------------------------
// Blueprints
// ---------------------------------------------------------------------------

export interface BlueprintUnlockCondition {
  readonly requiredCertifications?: readonly string[];
  readonly minRankOrder?: number;
  readonly requiredDepartmentReputation?: Readonly<Record<string, number>>;
  readonly requiredBlueprints?: readonly string[];
}

export interface BlueprintDefinition {
  readonly id: string;
  readonly title: string;
  readonly category: 'tool' | 'cosmetic' | 'lore';
  readonly unlockCondition: BlueprintUnlockCondition;
}

export interface BlueprintEvaluationContext {
  readonly rankOrder: number;
  readonly earnedCertifications: ReadonlySet<string>;
  readonly departmentReputation: Readonly<Record<string, number>>;
  readonly earnedBlueprints: ReadonlySet<string>;
}

function blueprintConditionMet(
  condition: BlueprintUnlockCondition,
  ctx: BlueprintEvaluationContext,
): boolean {
  if (condition.minRankOrder !== undefined && ctx.rankOrder < condition.minRankOrder) return false;
  for (const certId of condition.requiredCertifications ?? []) {
    if (!ctx.earnedCertifications.has(certId)) return false;
  }
  for (const bpId of condition.requiredBlueprints ?? []) {
    if (!ctx.earnedBlueprints.has(bpId)) return false;
  }
  for (const [deptId, min] of Object.entries(condition.requiredDepartmentReputation ?? {})) {
    if ((ctx.departmentReputation[deptId] ?? 0) < min) return false;
  }
  return true;
}

/** Returns ids of every blueprint definition whose unlock condition is currently met. */
export function evaluateBlueprintUnlocks(
  defs: readonly BlueprintDefinition[],
  ctx: BlueprintEvaluationContext,
): readonly string[] {
  return defs.filter((def) => blueprintConditionMet(def.unlockCondition, ctx)).map((def) => def.id);
}

// ---------------------------------------------------------------------------
// Laboratory evolution
// ---------------------------------------------------------------------------

export interface LabTierDefinition {
  readonly tier: number;
  readonly title: string;
  readonly description: string;
  readonly minRankOrder: number;
}

/** Highest lab tier whose minRankOrder the player's rank order meets. */
export function labTierForRank(
  tiers: readonly LabTierDefinition[],
  rankOrder: number,
): LabTierDefinition {
  const eligible = tiers.filter((t) => rankOrder >= t.minRankOrder);
  if (eligible.length === 0)
    throw new Error(
      'No lab tier defined for rank order 0 — every ladder must define a tier 1 with minRankOrder 0',
    );
  return eligible.reduce((best, t) => (t.minRankOrder > best.minRankOrder ? t : best));
}

// ---------------------------------------------------------------------------
// Career milestones
// ---------------------------------------------------------------------------

export interface CareerMilestone {
  readonly id: string;
  readonly title: string;
  readonly triggerRankId: string;
  readonly unlocks: readonly string[];
}

export function milestonesForRank(
  milestones: readonly CareerMilestone[],
  rankId: string,
): readonly CareerMilestone[] {
  return milestones.filter((m) => m.triggerRankId === rankId);
}
