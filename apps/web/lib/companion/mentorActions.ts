'use client';

/**
 * Imperative bridge between the app's stores and ARIA. These run on real events
 * (session start, mission briefing, mission completion) — they read the current,
 * authoritative store state, ask the engine for a grounded utterance, route it through
 * the EXISTING companion bubble, and record what happened into mentor memory.
 *
 * Using getState() (not hooks) keeps these callable from anywhere — event handlers,
 * effects — without extra re-renders.
 */
import type { MentorMissionResult } from '@arc/engine-ai';
import { useGameStore } from '@/components/state/gameStore';
import { useCareerStore } from '@/components/state/careerStore';
import { useMentorStore } from '@/components/state/mentorStore';
import { useCompanionStore } from '@/components/companion/companionStore';
import { ariaRespond, ariaRespondTo, type MentorInputs } from './aria';

/** Snapshot the stores into the base inputs ARIA needs (no session-specific fields yet). */
function gatherBase(): MentorInputs {
  const game = useGameStore.getState();
  const career = useCareerStore.getState();
  const mentor = useMentorStore.getState();
  const completedMissionIds = Object.keys(game.completed).filter((id) => game.completed[id]);

  return {
    rx: game.xp,
    ec: game.coins,
    completedMissionIds,
    attempts: career.attempts,
    currentRankId: career.currentRankId,
    certificationsEarned: career.earnedCertifications.length,
    bossVictories: career.bossVictories.length,
    // Promotions are owned by the dedicated PromotionCeremony; ARIA doesn't double-announce.
    recentPromotionRankTitle: null,
    firstCertificationJustEarned: career.earnedCertifications.length >= 1,
    firstBossVictoryJustEarned: career.bossVictories.length >= 1,
    memory: mentor.memory,
    preferences: mentor.preferences,
  };
}

function speak(text: string) {
  useCompanionStore.getState().say('idle', text);
}

/** Open a memory session without speaking (used on mission deep-loads where the briefing speaks instead). */
export function ariaBeginSession(): void {
  useMentorStore.getState().begin();
}

/** Begin the session and greet the player with a context-aware, grounded line. */
export function ariaGreet(): void {
  const mentor = useMentorStore.getState();
  mentor.begin();
  const utterance = ariaRespond(gatherBase());
  speak(utterance.text);
  if (utterance.milestoneId) mentor.celebrate(utterance.milestoneId);
}

/** Brief an upcoming mission (story framing only). */
export function ariaBrief(missionId: string): void {
  const inputs: MentorInputs = { ...gatherBase(), upcomingMissionId: missionId };
  const utterance = ariaRespondTo(inputs, 'mission-briefing');
  speak(utterance.text);
}

/** Idle nudge for the companion orb click — a genuine adaptive nudge when analytics warrant one, else encouragement. */
export function ariaIdle(): void {
  const inputs = gatherBase();
  const nudge = ariaRespondTo(inputs, 'adaptive-nudge');
  const utterance =
    nudge.intent === 'adaptive-nudge' ? nudge : ariaRespondTo(inputs, 'idle-encouragement');
  speak(utterance.text);
}

/**
 * Debrief a just-finished mission using REAL telemetry. Records the attempt (so it feeds
 * statistics) and a mission-completed memory event, then speaks a fact-gated debrief and
 * celebrates any genuine milestone exactly once.
 */
export function ariaDebrief(result: MentorMissionResult): void {
  const career = useCareerStore.getState();
  const mentor = useMentorStore.getState();

  career.recordAttempt({
    missionId: result.missionId,
    conceptId: result.conceptId,
    correct: result.correct,
    hintsUsed: result.hintsUsed,
    attempts: result.attempts,
    timeMs: result.timeMs,
    usedVisualization: result.usedVisualization,
    completedAt: Date.now(),
  });
  mentor.record({
    type: result.correct ? 'mission-completed' : 'mission-failed',
    at: Date.now(),
    refId: result.missionId,
    label: result.conceptId,
  });

  // Build the debrief AFTER recording so statistics/milestones reflect this mission.
  const inputs: MentorInputs = { ...gatherBase(), lastResult: result };
  const utterance = ariaRespond(inputs);
  speak(utterance.text);
  if (utterance.milestoneId) mentor.celebrate(utterance.milestoneId);
}
