/**
 * ARIA host adapter — maps the app's authoritative state (gameStore, careerStore,
 * mentorStore) and the automata curriculum data onto the engine-ai MentorContext, then
 * asks the engine for a grounded utterance.
 *
 * This is the ONLY place the rich plugin types meet the engine's minimal structural
 * interfaces, keeping @arc/engine-ai subject-agnostic. Everything ARIA says downstream is
 * therefore traceable to real data assembled here.
 */
import {
  respond,
  respondTo,
  type CoachingIntent,
  type MentorContext,
  type MentorMemory,
  type MentorMissionResult,
  type MentorPreferences,
  type MissionBriefInput,
  type MisconceptionInput,
  type MentorUtterance,
} from '@arc/engine-ai';
import { computePlayerStatistics, type MissionAttemptRecord } from '@arc/engine-analytics';
import { rankById } from '@arc/engine-progress';
import {
  MISCONCEPTIONS,
  MISSIONS,
  RANK_LADDER,
  conceptById,
  missionById,
} from '@arc/plugin-automata';

/** 'security-district' -> 'Security District'. Matches the academy district titles. */
export function districtLabel(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function conceptLabel(conceptId: string | null | undefined): string | null {
  if (!conceptId) return null;
  return conceptById(conceptId)?.title ?? null;
}

export function missionBriefInput(missionId: string): MissionBriefInput | null {
  const m = missionById(missionId);
  if (!m) return null;
  return {
    id: m.id,
    title: m.title,
    district: districtLabel(m.district),
    conceptId: m.conceptId,
    objective: m.objective,
    difficulty: String(m.difficulty),
    estimatedMinutes: m.estimatedMinutes,
    hints: m.hints,
  };
}

export function misconceptionInput(misconceptionId: string): MisconceptionInput | null {
  const mc = MISCONCEPTIONS.find((m) => m.id === misconceptionId);
  if (!mc) return null;
  return {
    id: mc.id,
    conceptId: mc.conceptId,
    misconception: mc.misconception,
    socraticQuestions: mc.socraticQuestions,
    hintProgression: mc.hintProgression,
    visualizationRecommendation: mc.visualizationRecommendation,
  };
}

/** Inputs the host gathers from its stores before asking ARIA to speak. */
export interface MentorInputs {
  rx: number;
  ec: number;
  completedMissionIds: readonly string[];
  attempts: readonly MissionAttemptRecord[];
  currentRankId: string;
  certificationsEarned: number;
  bossVictories: number;
  /** Title of a rank reached this session, or null. */
  recentPromotionRankTitle: string | null;
  firstCertificationJustEarned: boolean;
  firstBossVictoryJustEarned: boolean;
  memory: MentorMemory;
  preferences: MentorPreferences;
  /** Optional session details. */
  lastResult?: MentorMissionResult | null;
  upcomingMissionId?: string | null;
  detectedMisconceptionId?: string | null;
  struggleLevel?: MentorContext['session']['struggleLevel'];
}

/** Count concepts the player has fully covered (every live mission for the concept done). */
function masteredConceptLabels(completed: ReadonlySet<string>): string[] {
  const byConcept = new Map<string, { total: number; done: number }>();
  for (const m of MISSIONS) {
    if (m.status !== 'live') continue;
    const entry = byConcept.get(m.conceptId) ?? { total: 0, done: 0 };
    entry.total += 1;
    if (completed.has(m.id)) entry.done += 1;
    byConcept.set(m.conceptId, entry);
  }
  const labels: string[] = [];
  for (const [conceptId, { total, done }] of byConcept) {
    if (total > 0 && done === total) {
      const label = conceptLabel(conceptId);
      if (label) labels.push(label);
    }
  }
  return labels;
}

/** Build the full MentorContext from gathered inputs. Pure — easy to test/reason about. */
export function buildMentorContext(inputs: MentorInputs): MentorContext {
  const completedSet = new Set(inputs.completedMissionIds);
  const statistics = computePlayerStatistics(inputs.attempts);
  const rank = rankById(RANK_LADDER, inputs.currentRankId) ?? RANK_LADDER.ranks[0]!;

  // daysSinceLastVisit comes from memory (lastVisitAt set by beginSession on this session).
  const now = Date.now();
  const daysSinceLastVisit =
    inputs.memory.lastVisitAt === null
      ? null
      : Math.max(0, Math.floor((now - inputs.memory.lastVisitAt) / (24 * 60 * 60 * 1000)));

  return {
    player: {
      rankTitle: rank.title,
      rankOrder: rank.order,
      isFirstSession: inputs.memory.sessionCount <= 1 && completedSet.size === 0,
      daysSinceLastVisit,
    },
    statistics,
    career: {
      totalMissionsCompleted: completedSet.size,
      certificationsEarned: inputs.certificationsEarned,
      bossVictories: inputs.bossVictories,
      recentPromotionRankTitle: inputs.recentPromotionRankTitle,
      firstCertificationJustEarned: inputs.firstCertificationJustEarned,
      firstBossVictoryJustEarned: inputs.firstBossVictoryJustEarned,
    },
    mastery: {
      masteredConceptLabels: masteredConceptLabels(completedSet),
      favoriteTopicLabel: conceptLabel(statistics.mostImprovedTopic),
      weakestTopicLabel: conceptLabel(statistics.mostDifficultTopic),
    },
    session: {
      lastResult: inputs.lastResult ?? null,
      upcomingMission: inputs.upcomingMissionId
        ? missionBriefInput(inputs.upcomingMissionId)
        : null,
      detectedMisconception: inputs.detectedMisconceptionId
        ? misconceptionInput(inputs.detectedMisconceptionId)
        : null,
      struggleLevel: inputs.struggleLevel ?? 'none',
    },
    preferences: inputs.preferences,
    memory: inputs.memory,
    seed: inputs.memory.sessionCount + completedSet.size,
  };
}

/** Convenience: build context and get the auto-selected grounded utterance. */
export function ariaRespond(inputs: MentorInputs): MentorUtterance {
  return respond(buildMentorContext(inputs));
}

/** Convenience: build context and get an utterance for an explicitly requested intent. */
export function ariaRespondTo(inputs: MentorInputs, intent: CoachingIntent): MentorUtterance {
  return respondTo(buildMentorContext(inputs), intent);
}
