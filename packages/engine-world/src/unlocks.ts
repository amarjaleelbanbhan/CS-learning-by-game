/**
 * Generic unlock conditions for world content (NPCs, decorations, discoveries). Mirrors
 * engine-progress's BlueprintUnlockCondition shape deliberately — same evaluation
 * pattern, same field names — so the two engines stay easy to reason about together
 * without one importing the other.
 */
export interface WorldUnlockCondition {
  readonly minRankOrder?: number;
  readonly requiredCertifications?: readonly string[];
  readonly requiredDepartmentReputation?: Readonly<Record<string, number>>;
  readonly requiredBossVictories?: readonly string[];
}

export interface WorldUnlockContext {
  readonly rankOrder: number;
  readonly earnedCertifications: ReadonlySet<string>;
  readonly departmentReputation: Readonly<Record<string, number>>;
  readonly bossVictories: ReadonlySet<string>;
}

export function worldConditionMet(
  condition: WorldUnlockCondition,
  ctx: WorldUnlockContext,
): boolean {
  if (condition.minRankOrder !== undefined && ctx.rankOrder < condition.minRankOrder) return false;
  for (const certId of condition.requiredCertifications ?? []) {
    if (!ctx.earnedCertifications.has(certId)) return false;
  }
  for (const missionId of condition.requiredBossVictories ?? []) {
    if (!ctx.bossVictories.has(missionId)) return false;
  }
  for (const [deptId, min] of Object.entries(condition.requiredDepartmentReputation ?? {})) {
    if ((ctx.departmentReputation[deptId] ?? 0) < min) return false;
  }
  return true;
}

/** A definition with an id and an unlock condition — NPCs, decorations, anything gated. */
export interface WorldUnlockable {
  readonly id: string;
  readonly unlockCondition: WorldUnlockCondition;
}

/** Returns ids of every unlockable whose condition is currently met. */
export function evaluateWorldUnlocks(
  defs: readonly WorldUnlockable[],
  ctx: WorldUnlockContext,
): readonly string[] {
  return defs.filter((def) => worldConditionMet(def.unlockCondition, ctx)).map((def) => def.id);
}
