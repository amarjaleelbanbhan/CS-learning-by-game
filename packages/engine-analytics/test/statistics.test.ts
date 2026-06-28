import { describe, expect, it } from 'vitest';
import { computePlayerStatistics, type MissionAttemptRecord } from '../src/index.js';

function record(
  partial: Partial<MissionAttemptRecord> & { completedAt: number },
): MissionAttemptRecord {
  return {
    missionId: 'm',
    correct: true,
    hintsUsed: 0,
    attempts: 1,
    timeMs: 1000,
    usedVisualization: false,
    ...partial,
  };
}

describe('computePlayerStatistics', () => {
  it('returns a well-defined empty-state result for no records', () => {
    const stats = computePlayerStatistics([]);
    expect(stats.totalMissions).toBe(0);
    expect(stats.fastestSolveMs).toBeNull();
    expect(stats.mostDifficultTopic).toBeNull();
    expect(stats.currentStreak).toBe(0);
  });

  it('counts a mission as perfect only on first-try, zero-hint success', () => {
    const stats = computePlayerStatistics([
      record({ completedAt: 1, correct: true, attempts: 1, hintsUsed: 0 }),
      record({ completedAt: 2, correct: true, attempts: 2, hintsUsed: 0 }),
      record({ completedAt: 3, correct: true, attempts: 1, hintsUsed: 1 }),
    ]);
    expect(stats.totalMissions).toBe(3);
    expect(stats.perfectMissions).toBe(1);
  });

  it('computes averages across the full log', () => {
    const stats = computePlayerStatistics([
      record({ completedAt: 1, attempts: 1, hintsUsed: 0 }),
      record({ completedAt: 2, attempts: 3, hintsUsed: 2 }),
    ]);
    expect(stats.averageAttempts).toBe(2);
    expect(stats.averageHintsUsed).toBe(1);
  });

  it('fastestSolveMs only considers correct attempts', () => {
    const stats = computePlayerStatistics([
      record({ completedAt: 1, correct: false, timeMs: 100 }),
      record({ completedAt: 2, correct: true, timeMs: 500 }),
      record({ completedAt: 3, correct: true, timeMs: 250 }),
    ]);
    expect(stats.fastestSolveMs).toBe(250);
  });

  it('visualizationUsageRate is the fraction of attempts that used a visualization', () => {
    const stats = computePlayerStatistics([
      record({ completedAt: 1, usedVisualization: true }),
      record({ completedAt: 2, usedVisualization: false }),
      record({ completedAt: 3, usedVisualization: false }),
      record({ completedAt: 4, usedVisualization: true }),
    ]);
    expect(stats.visualizationUsageRate).toBe(0.5);
  });

  it('current streak counts the trailing run of corrects, longest streak the best run anywhere', () => {
    const stats = computePlayerStatistics([
      record({ completedAt: 1, correct: true }),
      record({ completedAt: 2, correct: true }),
      record({ completedAt: 3, correct: true }),
      record({ completedAt: 4, correct: false }),
      record({ completedAt: 5, correct: true }),
    ]);
    expect(stats.longestStreak).toBe(3);
    expect(stats.currentStreak).toBe(1);
  });

  it('current streak is 0 immediately after a miss, even with a long history before it', () => {
    const stats = computePlayerStatistics([
      record({ completedAt: 1, correct: true }),
      record({ completedAt: 2, correct: true }),
      record({ completedAt: 3, correct: false }),
    ]);
    expect(stats.currentStreak).toBe(0);
    expect(stats.longestStreak).toBe(2);
  });

  it('mostDifficultTopic is the concept with the highest combined attempts+hints average', () => {
    const stats = computePlayerStatistics([
      record({ completedAt: 1, conceptId: 'dfa-fundamentals', attempts: 1, hintsUsed: 0 }),
      record({ completedAt: 2, conceptId: 'pumping-lemma', attempts: 5, hintsUsed: 4 }),
      record({ completedAt: 3, conceptId: 'pumping-lemma', attempts: 4, hintsUsed: 3 }),
    ]);
    expect(stats.mostDifficultTopic).toBe('pumping-lemma');
  });

  it('mostImprovedTopic requires at least 2 attempts on that topic and a real improvement', () => {
    const stats = computePlayerStatistics([
      record({ completedAt: 1, conceptId: 'nfa-fundamentals', attempts: 5 }),
      record({ completedAt: 2, conceptId: 'nfa-fundamentals', attempts: 4 }),
      record({ completedAt: 3, conceptId: 'nfa-fundamentals', attempts: 1 }),
      record({ completedAt: 4, conceptId: 'regular-expressions', attempts: 1 }),
    ]);
    expect(stats.mostImprovedTopic).toBe('nfa-fundamentals');
  });

  it('records without a conceptId are excluded from topic-level stats but still count toward totals', () => {
    const stats = computePlayerStatistics([
      record({ completedAt: 1 }),
      record({ completedAt: 2, conceptId: 'dfa-fundamentals' }),
    ]);
    expect(stats.totalMissions).toBe(2);
    expect(stats.mostDifficultTopic).toBe('dfa-fundamentals');
  });

  it('is order-independent on input but order-sensitive on completedAt for streaks/trends', () => {
    const a = [
      record({ completedAt: 3, correct: false }),
      record({ completedAt: 1, correct: true }),
      record({ completedAt: 2, correct: true }),
    ];
    const stats = computePlayerStatistics(a);
    expect(stats.longestStreak).toBe(2);
    expect(stats.currentStreak).toBe(0);
  });
});
