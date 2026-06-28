/**
 * @arc/engine-ai — ARIA, the personal AI mentor.
 *
 * A framework-independent, subject-agnostic mentoring engine. The deterministic engines
 * (career, analytics, curriculum) remain authoritative; this package turns their state
 * into grounded coaching language. An optional injected LLMClient may only rephrase that
 * language within its grounding — it is never the brain. Fully offline-capable.
 *
 * Reusable across CS subjects: curriculum data is passed in via the structural interfaces
 * in ./context, so no subject plugin is imported here.
 */
export const PACKAGE_NAME = '@arc/engine-ai' as const;

export type {
  MentorContext,
  MentorContextBase,
  MissionBriefInput,
  MisconceptionInput,
  ConceptLabelInput,
  MentorMissionResult,
  MentorMode,
  MentorPreferences,
  PlayerSnapshot,
  CareerSnapshot,
  MasterySnapshot,
  SessionSnapshot,
  StruggleLevel,
} from './context.js';

export type { MentorMemory, MentorEvent, MentorEventType } from './memory.js';
export {
  EMPTY_MEMORY,
  recordEvent,
  beginSession,
  markMilestoneCelebrated,
  hasCelebrated,
  advanceSocratic,
  socraticStep,
  recentEvents,
  countEvents,
  repeatedMistakes,
  recentlyCompletedMissions,
  daysSinceLastVisit,
} from './memory.js';

export type { CoachingIntent, Milestone, AdaptiveNudge } from './coaching.js';
export { selectCoachingIntent, pendingMilestone, adaptiveNudge } from './coaching.js';

export type { ModeVoice } from './modes.js';
export { voiceFor, suggestMode, dress } from './modes.js';

export type { SocraticStep, SocraticKind } from './socratic.js';
export { nextSocraticStep } from './socratic.js';

export type { Grounding, MentorUtterance } from './utterance.js';
export { emptyGrounding } from './utterance.js';

export { generateBriefing } from './briefing.js';
export { generateDebrief } from './debrief.js';
export { generateForIntent } from './dialogue.js';

export type { LLMClient, LLMEnhanceRequest } from './llm.js';
export { enhanceUtterance, respectsGrounding, extractNumbers } from './llm.js';

export { respond, respondTo, respondEnhanced } from './mentor.js';
