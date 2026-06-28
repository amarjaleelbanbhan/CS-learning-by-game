/**
 * Player Statistics engine — pure aggregation over a mission-attempt log.
 *
 * Feeds the Engineer Profile screen and ARIA's adaptive coaching (e.g. surfacing the
 * player's weakest topic). Generic: it only knows about attempt records, never about
 * Theory of Automata specifically — `conceptId` is an opaque string supplied by the caller.
 */
export interface MissionAttemptRecord {
  readonly missionId: string;
  readonly conceptId?: string;
  readonly correct: boolean;
  readonly hintsUsed: number;
  /** How many tries it took to land the correct answer for this mission instance. */
  readonly attempts: number;
  readonly timeMs: number;
  readonly usedVisualization: boolean;
  /** Epoch ms — used to order the log for streaks and "most improved" trend detection. */
  readonly completedAt: number;
}

export interface PlayerStatistics {
  readonly totalMissions: number;
  readonly perfectMissions: number;
  readonly averageAttempts: number;
  readonly averageHintsUsed: number;
  readonly visualizationUsageRate: number;
  readonly fastestSolveMs: number | null;
  readonly mostDifficultTopic: string | null;
  readonly mostImprovedTopic: string | null;
  readonly currentStreak: number;
  readonly longestStreak: number;
}

const EMPTY_STATISTICS: PlayerStatistics = {
  totalMissions: 0,
  perfectMissions: 0,
  averageAttempts: 0,
  averageHintsUsed: 0,
  visualizationUsageRate: 0,
  fastestSolveMs: null,
  mostDifficultTopic: null,
  mostImprovedTopic: null,
  currentStreak: 0,
  longestStreak: 0,
};

function average(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function computeStreaks(sorted: readonly MissionAttemptRecord[]): {
  current: number;
  longest: number;
} {
  let longest = 0;
  let running = 0;
  for (const r of sorted) {
    if (r.correct) {
      running += 1;
      longest = Math.max(longest, running);
    } else {
      running = 0;
    }
  }
  // current streak = trailing run of corrects at the end of the log
  let current = 0;
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    if (sorted[i]!.correct) current += 1;
    else break;
  }
  return { current, longest };
}

/** "Difficulty" per topic = average(attempts) + average(hintsUsed), the topic with the highest combined score is the weakest. */
function findMostDifficultTopic(records: readonly MissionAttemptRecord[]): string | null {
  const byTopic = new Map<string, { attempts: number[]; hints: number[] }>();
  for (const r of records) {
    if (!r.conceptId) continue;
    const bucket = byTopic.get(r.conceptId) ?? { attempts: [], hints: [] };
    bucket.attempts.push(r.attempts);
    bucket.hints.push(r.hintsUsed);
    byTopic.set(r.conceptId, bucket);
  }
  let worst: string | null = null;
  let worstScore = -Infinity;
  for (const [conceptId, bucket] of byTopic) {
    const score = average(bucket.attempts) + average(bucket.hints);
    if (score > worstScore) {
      worstScore = score;
      worst = conceptId;
    }
  }
  return worst;
}

/** Compares each topic's average(attempts) in the first half of its history vs. the second half; the biggest decrease (improvement) wins. Requires at least 2 attempts on a topic to be eligible. */
function findMostImprovedTopic(sorted: readonly MissionAttemptRecord[]): string | null {
  const byTopic = new Map<string, number[]>();
  for (const r of sorted) {
    if (!r.conceptId) continue;
    const list = byTopic.get(r.conceptId) ?? [];
    list.push(r.attempts);
    byTopic.set(r.conceptId, list);
  }
  let best: string | null = null;
  let bestImprovement = 0;
  for (const [conceptId, attemptsList] of byTopic) {
    if (attemptsList.length < 2) continue;
    const mid = Math.ceil(attemptsList.length / 2);
    const firstHalf = average(attemptsList.slice(0, mid));
    const secondHalf = average(attemptsList.slice(mid));
    const improvement = firstHalf - secondHalf;
    if (improvement > bestImprovement) {
      bestImprovement = improvement;
      best = conceptId;
    }
  }
  return best;
}

export function computePlayerStatistics(
  records: readonly MissionAttemptRecord[],
): PlayerStatistics {
  if (records.length === 0) return EMPTY_STATISTICS;

  const sorted = [...records].sort((a, b) => a.completedAt - b.completedAt);
  const perfectMissions = sorted.filter(
    (r) => r.correct && r.attempts <= 1 && r.hintsUsed === 0,
  ).length;
  const fastestSolveMs = sorted
    .filter((r) => r.correct)
    .reduce<number | null>((min, r) => {
      if (min === null) return r.timeMs;
      return Math.min(min, r.timeMs);
    }, null);
  const visualizationUsageRate = sorted.filter((r) => r.usedVisualization).length / sorted.length;
  const { current, longest } = computeStreaks(sorted);

  return {
    totalMissions: sorted.length,
    perfectMissions,
    averageAttempts: average(sorted.map((r) => r.attempts)),
    averageHintsUsed: average(sorted.map((r) => r.hintsUsed)),
    visualizationUsageRate,
    fastestSolveMs,
    mostDifficultTopic: findMostDifficultTopic(sorted),
    mostImprovedTopic: findMostImprovedTopic(sorted),
    currentStreak: current,
    longestStreak: longest,
  };
}
