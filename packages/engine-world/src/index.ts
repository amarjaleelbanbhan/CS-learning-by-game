/**
 * @arc/engine-world — the Living World engine.
 *
 * Reusable, subject-agnostic infrastructure for NPCs, dynamic dialogue, relationships,
 * world events, department personality, time-of-day, and world reactions. Subject
 * plugins (e.g. plugin-automata) supply the actual content — this engine only knows the
 * shapes and the deterministic selection rules. No framework, no plugin imports.
 */
export const PACKAGE_NAME = '@arc/engine-world' as const;

export type { NpcDefinition, RelationshipTier, NpcMemory } from './npc.js';
export {
  RELATIONSHIP_TIERS,
  relationshipTierFor,
  EMPTY_NPC_MEMORY,
  recordConversation,
} from './npc.js';

export type { WorldUnlockCondition, WorldUnlockContext, WorldUnlockable } from './unlocks.js';
export { worldConditionMet, evaluateWorldUnlocks } from './unlocks.js';

export type { DialogueLine, DialogueSelectionContext } from './dialogue.js';
export { eligibleLines, selectDialogueLine } from './dialogue.js';

export type { WorldEventDefinition } from './events.js';
export {
  DEFAULT_ROTATION_BUCKET_MS,
  activeWorldEvent,
  nextRotationAt,
  eventsForDistrict,
} from './events.js';

export type { AmbientIntensity, DepartmentPersonality, TimeOfDay } from './department.js';
export { personalityFor, timeOfDay } from './department.js';

export type { WorldReactionKind, WorldReactionTrigger, WorldReaction } from './reactions.js';
export { generateWorldReaction } from './reactions.js';
