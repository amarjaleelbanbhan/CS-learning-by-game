/**
 * NPC infrastructure — reusable, subject-agnostic. An NPC is a named presence at a
 * location (district) with an unlock condition and a relationship that deepens as the
 * player interacts with them. This module only knows the SHAPE of an NPC; subject
 * plugins (e.g. plugin-automata) supply the actual roster and dialogue content.
 */
import type { WorldUnlockCondition } from './unlocks.js';

export interface NpcDefinition {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  /** District/location id the NPC is found at. 'lab' means always-present in the player's lab. */
  readonly locationId: string;
  readonly departmentId: string | null;
  readonly unlockCondition: WorldUnlockCondition;
}

/** Relationship deepens through named tiers as the player accumulates interaction score. */
export interface RelationshipTier {
  readonly id: string;
  readonly label: string;
  readonly threshold: number;
}

export const RELATIONSHIP_TIERS: readonly RelationshipTier[] = [
  { id: 'first-meeting', label: 'First Meeting', threshold: 0 },
  { id: 'acquaintance', label: 'Acquaintance', threshold: 10 },
  { id: 'frequent-visitor', label: 'Frequent Visitor', threshold: 30 },
  { id: 'trusted-engineer', label: 'Trusted Engineer', threshold: 75 },
  { id: 'department-hero', label: 'Department Hero', threshold: 150 },
];

/** The highest tier whose threshold the score has reached. Always returns a tier (floor is 'first-meeting'). */
export function relationshipTierFor(
  score: number,
  tiers: readonly RelationshipTier[] = RELATIONSHIP_TIERS,
): RelationshipTier {
  let current = tiers[0]!;
  for (const tier of tiers) {
    if (score >= tier.threshold) current = tier;
  }
  return current;
}

/** Persistent per-NPC memory: what the player and this NPC have been through together. */
export interface NpcMemory {
  readonly firstMetAt: number | null;
  readonly lastInteractionAt: number | null;
  readonly conversationCount: number;
  /** Id of the last dialogue line shown — used to avoid repeating it next time. */
  readonly lastLineId: string | null;
}

export const EMPTY_NPC_MEMORY: NpcMemory = {
  firstMetAt: null,
  lastInteractionAt: null,
  conversationCount: 0,
  lastLineId: null,
};

/** Record a conversation with an NPC at time `now`. Pure — host persists the result. */
export function recordConversation(memory: NpcMemory, now: number, lineId: string): NpcMemory {
  return {
    firstMetAt: memory.firstMetAt ?? now,
    lastInteractionAt: now,
    conversationCount: memory.conversationCount + 1,
    lastLineId: lineId,
  };
}
