'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  BLUEPRINTS,
  CAREER_MILESTONES,
  CERTIFICATIONS,
  DEPARTMENTS,
  LAB_TIERS,
  MISSIONS,
  RANK_LADDER,
} from '@arc/plugin-automata';
import {
  eligiblePromotionTarget,
  labTierForRank,
  milestonesForRank,
  rankById,
  rankProgress,
  reputationTier,
  unmetPromotionRequirements,
  type EngineerCareerState,
  type RankDefinition,
} from '@arc/engine-progress';
import { computePlayerStatistics, type MissionAttemptRecord } from '@arc/engine-analytics';

/**
 * Engineer Career store. RX (Research Experience) and EC (Engineering Credits) are
 * deliberately NOT duplicated here — they are presentation names for gameStore's
 * existing `xp`/`coins` fields (see careerStore.useCareerSnapshot below), so no data
 * migration was needed and the single source of truth for those two numbers stays in
 * gameStore exactly as it already was. Everything career-specific that gameStore never
 * tracked (department reputation, certifications, blueprints, boss victories, rank,
 * mission-attempt telemetry) lives here, persisted independently.
 */
export interface CareerState {
  currentRankId: string;
  earnedCertifications: string[];
  earnedBlueprints: string[];
  departmentReputation: Record<string, number>;
  bossVictories: string[];
  attempts: MissionAttemptRecord[];
  /** Set by sync() when a promotion just happened; the ceremony UI clears it once shown. */
  pendingPromotion: RankDefinition | null;
  recordReputation: (departmentId: string, amount: number) => void;
  recordBossVictory: (missionId: string) => void;
  recordAttempt: (record: MissionAttemptRecord) => void;
  /** Re-evaluates certifications/blueprints/promotions against current RX + completed missions. Call after any mission completion or reputation change. */
  sync: (rx: number, ec: number, completedMissionIds: readonly string[]) => void;
  acknowledgePromotion: () => void;
  reset: () => void;
}

function buildCareerState(rx: number, ec: number, s: CareerState): EngineerCareerState {
  return {
    rx,
    ec,
    currentRankId: s.currentRankId,
    earnedCertifications: s.earnedCertifications,
    earnedBlueprints: s.earnedBlueprints,
    departmentReputation: s.departmentReputation,
    bossVictories: s.bossVictories,
  };
}

const FIRST_RANK_ID = RANK_LADDER.ranks[0]!.id;

export const useCareerStore = create<CareerState>()(
  persist(
    (set, get) => ({
      currentRankId: FIRST_RANK_ID,
      earnedCertifications: [],
      earnedBlueprints: [],
      departmentReputation: {},
      bossVictories: [],
      attempts: [],
      pendingPromotion: null,

      recordReputation: (departmentId, amount) =>
        set((s) => ({
          departmentReputation: {
            ...s.departmentReputation,
            [departmentId]: (s.departmentReputation[departmentId] ?? 0) + amount,
          },
        })),

      recordBossVictory: (missionId) =>
        set((s) =>
          s.bossVictories.includes(missionId)
            ? s
            : { bossVictories: [...s.bossVictories, missionId] },
        ),

      recordAttempt: (record) => set((s) => ({ attempts: [...s.attempts, record] })),

      sync: (rx, ec, completedMissionIdsInput) => {
        const completedMissionIds = new Set(completedMissionIdsInput);
        const s = get();

        // Fixed-point iteration: certifications/blueprints/rank can each unlock the next,
        // so re-evaluate all three in a loop until nothing new unlocks. Bounded by the
        // (finite) rank ladder length — every iteration either promotes or terminates.
        let certs = s.earnedCertifications;
        let blueprints = s.earnedBlueprints;
        let rankId = s.currentRankId;
        let promotedTo: RankDefinition | null = null;

        for (let guard = 0; guard <= RANK_LADDER.ranks.length; guard += 1) {
          certs = [...CERTIFICATIONS]
            .filter((def) => def.requiredMissionIds.every((id) => completedMissionIds.has(id)))
            .map((def) => def.id);

          const rank = rankById(RANK_LADDER, rankId)!;
          const newlyUnlocked = BLUEPRINTS.filter((bp) => {
            const cond = bp.unlockCondition;
            if (cond.minRankOrder !== undefined && rank.order < cond.minRankOrder) return false;
            for (const c of cond.requiredCertifications ?? []) if (!certs.includes(c)) return false;
            for (const b of cond.requiredBlueprints ?? [])
              if (!blueprints.includes(b)) return false;
            for (const [d, min] of Object.entries(cond.requiredDepartmentReputation ?? {})) {
              if ((s.departmentReputation[d] ?? 0) < min) return false;
            }
            return true;
          }).map((bp) => bp.id);
          blueprints = Array.from(new Set([...blueprints, ...newlyUnlocked]));

          const candidateState: EngineerCareerState = {
            rx,
            ec,
            currentRankId: rankId,
            earnedCertifications: certs,
            earnedBlueprints: blueprints,
            departmentReputation: s.departmentReputation,
            bossVictories: s.bossVictories,
          };
          const target = eligiblePromotionTarget(RANK_LADDER, candidateState);
          if (!target) break;
          rankId = target.id;
          promotedTo = target;
        }

        set({
          earnedCertifications: certs,
          earnedBlueprints: blueprints,
          currentRankId: rankId,
          pendingPromotion: promotedTo ?? s.pendingPromotion,
        });
      },

      acknowledgePromotion: () => set({ pendingPromotion: null }),

      reset: () =>
        set({
          currentRankId: FIRST_RANK_ID,
          earnedCertifications: [],
          earnedBlueprints: [],
          departmentReputation: {},
          bossVictories: [],
          attempts: [],
          pendingPromotion: null,
        }),
    }),
    { name: 'arc-reactor-career' },
  ),
);

// ---------------------------------------------------------------------------
// Derived read helpers (pure functions over the store's own state shape — kept outside
// the store so they're trivially testable without mounting React).
// ---------------------------------------------------------------------------

export function careerSnapshot(rx: number, ec: number, s: CareerState) {
  const careerState = buildCareerState(rx, ec, s);
  const rank = rankById(RANK_LADDER, s.currentRankId)!;
  const progress = rankProgress(RANK_LADDER, careerState);
  const labTier = labTierForRank(LAB_TIERS, rank.order);
  const milestones = milestonesForRank(CAREER_MILESTONES, s.currentRankId);
  const unmet = unmetPromotionRequirements(RANK_LADDER, careerState);
  const departments = DEPARTMENTS.map((dept) => ({
    department: dept,
    score: s.departmentReputation[dept.id] ?? 0,
    tier: reputationTier(dept, s.departmentReputation[dept.id] ?? 0),
  }));
  const statistics = computePlayerStatistics(s.attempts);

  return {
    rank,
    progress,
    labTier,
    milestones,
    unmetPromotionRequirements: unmet,
    departments,
    statistics,
  };
}

export function districtForMission(missionId: string): string | undefined {
  return MISSIONS.find((m) => m.id === missionId)?.district;
}

export function isMissionBossVictory(missionId: string): boolean {
  return MISSIONS.find((m) => m.id === missionId)?.isCapstone === true;
}
