/**
 * Coaching policy — the deterministic decision flow. Given the full MentorContext,
 * choose the single most useful intervention. This is the "smallest useful intervention"
 * rule: ARIA does ONE thing per utterance, picked by a fixed priority so behaviour is
 * predictable and testable. The LLM is never consulted to make this choice.
 */
import type { MentorContext } from './context.js';
import { hasCelebrated } from './memory.js';

export type CoachingIntent =
  | 'returning-after-absence'
  | 'milestone-celebration'
  | 'mission-debrief'
  | 'mission-briefing'
  | 'misconception-intervention'
  | 'adaptive-nudge'
  | 'daily-greeting'
  | 'idle-encouragement';

/** A milestone worth celebrating, with a stable id so it's only celebrated once. */
export interface Milestone {
  readonly id: string;
  readonly kind:
    | 'first-mission'
    | 'first-certification'
    | 'first-boss'
    | 'promotion'
    | 'long-streak';
  readonly label: string;
}

/** Streak length at which a streak becomes celebration-worthy. */
const STREAK_MILESTONE = 5;
/** Days away after which ARIA acknowledges a return. */
const ABSENCE_DAYS = 3;

/**
 * Determine the milestone to celebrate this turn, if any. Returns the highest-value
 * uncelebrated milestone. Celebration is reserved for genuine firsts and big moments,
 * and each fires at most once (tracked in memory).
 */
export function pendingMilestone(ctx: MentorContext): Milestone | null {
  const candidates: Milestone[] = [];

  if (ctx.career.recentPromotionRankTitle) {
    candidates.push({
      id: `promotion:${ctx.career.recentPromotionRankTitle}`,
      kind: 'promotion',
      label: ctx.career.recentPromotionRankTitle,
    });
  }
  if (ctx.career.firstBossVictoryJustEarned) {
    candidates.push({ id: 'first-boss', kind: 'first-boss', label: 'first boss victory' });
  }
  if (ctx.career.firstCertificationJustEarned) {
    candidates.push({
      id: 'first-certification',
      kind: 'first-certification',
      label: 'first certification',
    });
  }
  if (
    ctx.session.lastResult?.correct &&
    ctx.career.totalMissionsCompleted === 1 &&
    ctx.statistics.totalMissions <= 1
  ) {
    candidates.push({ id: 'first-mission', kind: 'first-mission', label: 'first mission' });
  }
  if (ctx.statistics.currentStreak >= STREAK_MILESTONE) {
    candidates.push({
      id: `streak:${ctx.statistics.currentStreak}`,
      kind: 'long-streak',
      label: `${ctx.statistics.currentStreak}-mission streak`,
    });
  }

  // Priority order within milestones: promotion > first boss > first cert > first mission > streak.
  for (const m of candidates) {
    if (!hasCelebrated(ctx.memory, m.id)) return m;
  }
  return null;
}

/**
 * Adaptive nudges driven purely by analytics. Returns the nudge kind, or null when no
 * adaptive intervention is warranted.
 */
export type AdaptiveNudge =
  | 'reduce-visualization'
  | 'increase-challenge'
  | 'smaller-version'
  | 'repeated-misconception';

export function adaptiveNudge(ctx: MentorContext): AdaptiveNudge | null {
  const stats = ctx.statistics;

  // Long struggle on the mission just attempted: offer a smaller version.
  if (ctx.session.struggleLevel === 'stuck') return 'smaller-version';

  // Heavy reliance on visualization across the player's history → suggest going without.
  if (stats.totalMissions >= 3 && stats.visualizationUsageRate >= 0.7) {
    return 'reduce-visualization';
  }

  // Fast learner: consistently few attempts and few hints → bump the challenge.
  if (stats.totalMissions >= 3 && stats.averageAttempts <= 1.2 && stats.averageHintsUsed <= 0.5) {
    return 'increase-challenge';
  }

  return null;
}

/**
 * The core selector. Walks the fixed priority ladder and returns the first intent whose
 * preconditions are met. Always returns something (idle-encouragement is the floor).
 */
export function selectCoachingIntent(ctx: MentorContext): CoachingIntent {
  if (
    ctx.player.daysSinceLastVisit !== null &&
    ctx.player.daysSinceLastVisit >= ABSENCE_DAYS &&
    !ctx.session.lastResult
  ) {
    return 'returning-after-absence';
  }

  if (pendingMilestone(ctx)) return 'milestone-celebration';

  if (ctx.session.lastResult) return 'mission-debrief';

  // Mid-mission struggle with a named misconception takes precedence over a fresh briefing.
  if (ctx.session.detectedMisconception && ctx.session.struggleLevel !== 'none') {
    return 'misconception-intervention';
  }

  if (ctx.session.upcomingMission) return 'mission-briefing';

  if (adaptiveNudge(ctx)) return 'adaptive-nudge';

  // Nothing situational to act on: greet the player for the session.
  return 'daily-greeting';
}
