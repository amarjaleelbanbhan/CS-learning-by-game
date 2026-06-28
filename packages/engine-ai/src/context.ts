/**
 * MentorContext — the single deterministic input ARIA reasons over.
 *
 * The GOLDEN RULE made concrete: before ARIA speaks, all of this is already known
 * (who the player is, what they're doing, what they've mastered, what they're
 * struggling with, what misconception they're showing). The context is assembled by
 * the host app from the authoritative engines (career, analytics, curriculum). ARIA's
 * language layer may ONLY reference values that appear here — it never invents data.
 *
 * To keep the mentor reusable for every future CS subject, this engine does NOT import
 * the automata plugin. Curriculum data is passed in through the minimal structural
 * interfaces below; the host maps its rich types onto them.
 */
import type { PlayerStatistics } from '@arc/engine-analytics';
import type { MentorMemory } from './memory.js';

/** Minimal shape of a mission ARIA briefs/debriefs — host maps CurriculumMission onto this. */
export interface MissionBriefInput {
  readonly id: string;
  readonly title: string;
  /** Narrative location ("Security District") — used for story framing, never theory. */
  readonly district: string;
  readonly conceptId: string;
  /** In-world objective copy (the story), NOT a definition of the theory. */
  readonly objective: string;
  readonly difficulty: string;
  readonly estimatedMinutes: number;
  /** Ordered Socratic hint ladder (vaguest first). Never the literal answer. */
  readonly hints: readonly string[];
}

/** Minimal misconception shape — host maps the Misconception database onto this. */
export interface MisconceptionInput {
  readonly id: string;
  readonly conceptId: string;
  readonly misconception: string;
  /** Ordered Socratic questions, asked one at a time as the player keeps struggling. */
  readonly socraticQuestions: readonly string[];
  /** Ordered hint ladder, vaguest first, never the literal fix. */
  readonly hintProgression: readonly string[];
  readonly visualizationRecommendation: string;
}

/** Human-readable label for a knowledge-graph concept id. */
export interface ConceptLabelInput {
  readonly id: string;
  readonly label: string;
}

export type StruggleLevel = 'none' | 'mild' | 'significant' | 'stuck';

/** The result of a just-finished mission, already analyzed against the player's history. */
export interface MentorMissionResult {
  readonly missionId: string;
  readonly missionTitle: string;
  readonly conceptId: string;
  readonly correct: boolean;
  readonly hintsUsed: number;
  readonly attempts: number;
  readonly usedVisualization: boolean;
  readonly timeMs: number;
  /**
   * True when the player reached a correct answer after a wrong attempt WITHOUT being
   * shown a revealing hint — i.e. they found their own mistake. Computed by the host.
   */
  readonly discoveredOwnMistake: boolean;
  /** True when this run used fewer attempts than the player's running average. */
  readonly improvedReasoning: boolean;
}

export type MentorMode = 'encouraging' | 'analytical' | 'minimal' | 'competitive' | 'patient';

export interface PlayerSnapshot {
  readonly rankTitle: string;
  readonly rankOrder: number;
  readonly isFirstSession: boolean;
  /** Whole days since the player's last recorded visit; null if unknown/first session. */
  readonly daysSinceLastVisit: number | null;
}

export interface CareerSnapshot {
  readonly totalMissionsCompleted: number;
  readonly certificationsEarned: number;
  readonly bossVictories: number;
  /** Title of a rank just reached this session, or null if no promotion happened. */
  readonly recentPromotionRankTitle: string | null;
  /** True only on the session where the player's very first certification was earned. */
  readonly firstCertificationJustEarned: boolean;
  /** True only on the session where the player's very first boss was defeated. */
  readonly firstBossVictoryJustEarned: boolean;
}

export interface MasterySnapshot {
  readonly masteredConceptLabels: readonly string[];
  readonly favoriteTopicLabel: string | null;
  readonly weakestTopicLabel: string | null;
}

export interface SessionSnapshot {
  /** Present when ARIA should debrief a finished mission. */
  readonly lastResult: MentorMissionResult | null;
  /** Present when ARIA should brief an upcoming mission. */
  readonly upcomingMission: MissionBriefInput | null;
  /** Present when the assessment/misconception layer detected a specific misconception. */
  readonly detectedMisconception: MisconceptionInput | null;
  readonly struggleLevel: StruggleLevel;
}

export interface MentorPreferences {
  readonly mode: MentorMode;
  /** When true, the mentor may adapt the mode to performance instead of holding it fixed. */
  readonly autoMode: boolean;
}

/**
 * Everything ARIA knows at the moment it must speak. Assembled deterministically from
 * the engines + persisted mentor memory. `memory` is typed loosely here and imported
 * from ./memory to avoid a cycle; see MentorContext below.
 */
export interface MentorContextBase {
  readonly player: PlayerSnapshot;
  readonly statistics: PlayerStatistics;
  readonly career: CareerSnapshot;
  readonly mastery: MasterySnapshot;
  readonly session: SessionSnapshot;
  readonly preferences: MentorPreferences;
  /** Deterministic variety seed (e.g. visit count) so repeated intents don't repeat verbatim. */
  readonly seed: number;
}

/** The complete context ARIA reasons over: deterministic engine state + persistent memory. */
export interface MentorContext extends MentorContextBase {
  readonly memory: MentorMemory;
}
