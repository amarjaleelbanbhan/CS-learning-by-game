/**
 * World host adapter — maps live career state + the clock onto @arc/engine-world's
 * structural context, the same pattern as lib/companion/aria.ts maps state onto ARIA.
 * Derived facts (which NPCs are unlocked, the active world event, an NPC's relationship
 * tier) are computed here on demand, never persisted — only genuinely meaningful state
 * (relationship scores, conversation memory, unlocked decorations) lives in worldStore.
 */
import {
  activeWorldEvent,
  evaluateWorldUnlocks,
  personalityFor,
  relationshipTierFor,
  selectDialogueLine,
  timeOfDay,
  type DepartmentPersonality,
  type DialogueSelectionContext,
  type NpcDefinition,
  type RelationshipTier,
  type TimeOfDay,
  type WorldEventDefinition,
} from '@arc/engine-world';
import { rankById } from '@arc/engine-progress';
import {
  DEPARTMENT_PERSONALITIES,
  LAB_DECORATIONS,
  NPCS,
  RANK_LADDER,
  WORLD_EVENTS,
  dialogueFor,
} from '@arc/plugin-automata';
import { useCareerStore } from '@/components/state/careerStore';
import type { WorldState } from '@/components/state/worldStore';

function currentRank() {
  return rankById(RANK_LADDER, useCareerStore.getState().currentRankId) ?? RANK_LADDER.ranks[0]!;
}

function careerUnlockContext(career: ReturnType<typeof useCareerStore.getState>) {
  const rank = rankById(RANK_LADDER, career.currentRankId) ?? RANK_LADDER.ranks[0]!;
  return {
    rankOrder: rank.order,
    earnedCertifications: new Set(career.earnedCertifications),
    departmentReputation: career.departmentReputation,
    bossVictories: new Set(career.bossVictories),
  };
}

/** NPC ids currently unlocked given the player's real career progress. */
export function unlockedNpcIds(): readonly string[] {
  const ctx = careerUnlockContext(useCareerStore.getState());
  return evaluateWorldUnlocks(NPCS, ctx);
}

export function unlockedNpcsForDistrict(districtId: string): readonly NpcDefinition[] {
  const unlocked = new Set(unlockedNpcIds());
  return NPCS.filter((n) => n.locationId === districtId && unlocked.has(n.id));
}

/** Decoration ids currently unlocked given the player's real career progress. */
export function unlockedDecorationIds(): readonly string[] {
  const ctx = careerUnlockContext(useCareerStore.getState());
  return evaluateWorldUnlocks(LAB_DECORATIONS, ctx);
}

/** The world event active right now (deterministic rotation — same for every player). */
export function currentWorldEvent(now: number = Date.now()): WorldEventDefinition | null {
  return activeWorldEvent(WORLD_EVENTS, now);
}

export function departmentPersonality(districtId: string): DepartmentPersonality | undefined {
  return personalityFor(DEPARTMENT_PERSONALITIES, districtId);
}

export function academyTimeOfDay(now: number = Date.now()): TimeOfDay {
  return timeOfDay(now);
}

export function relationshipScoreFor(npcId: string, world: WorldState): number {
  return world.npcRelationshipScore[npcId] ?? 0;
}

export function relationshipTierForNpc(npcId: string, world: WorldState): RelationshipTier {
  return relationshipTierFor(relationshipScoreFor(npcId, world));
}

/** The dialogue line an NPC would say right now, or null if the NPC has nothing eligible. */
export function npcDialogue(
  npc: NpcDefinition,
  world: WorldState,
  now: number = Date.now(),
): { text: string; lineId: string } | null {
  const rank = currentRank();
  const memory = world.npcMemory[npc.id] ?? {
    firstMetAt: null,
    lastInteractionAt: null,
    conversationCount: 0,
    lastLineId: null,
  };
  const ctx: DialogueSelectionContext = {
    rankOrder: rank.order,
    relationshipScore: relationshipScoreFor(npc.id, world),
    activeWorldEventId: currentWorldEvent(now)?.id ?? null,
    memory,
    seed: memory.conversationCount,
  };
  const line = selectDialogueLine(dialogueFor(npc.id), ctx);
  return line ? { text: line.text, lineId: line.id } : null;
}
