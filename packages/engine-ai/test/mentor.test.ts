import { describe, expect, it } from 'vitest';
import type { PlayerStatistics } from '@arc/engine-analytics';
import {
  EMPTY_MEMORY,
  advanceSocratic,
  beginSession,
  countEvents,
  daysSinceLastVisit,
  enhanceUtterance,
  extractNumbers,
  generateForIntent,
  hasCelebrated,
  markMilestoneCelebrated,
  nextSocraticStep,
  recentEvents,
  recordEvent,
  repeatedMistakes,
  respond,
  respondEnhanced,
  respondTo,
  respectsGrounding,
  selectCoachingIntent,
  suggestMode,
  type LLMClient,
  type MentorContext,
  type MentorMissionResult,
  type MisconceptionInput,
} from '../src/index.js';

const DAY = 24 * 60 * 60 * 1000;

function stats(overrides: Partial<PlayerStatistics> = {}): PlayerStatistics {
  return {
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
    ...overrides,
  };
}

function ctx(overrides: Partial<MentorContext> = {}): MentorContext {
  const base: MentorContext = {
    player: { rankTitle: 'Cadet Engineer', rankOrder: 0, isFirstSession: false, daysSinceLastVisit: 0 },
    statistics: stats(),
    career: {
      totalMissionsCompleted: 0,
      certificationsEarned: 0,
      bossVictories: 0,
      recentPromotionRankTitle: null,
      firstCertificationJustEarned: false,
      firstBossVictoryJustEarned: false,
    },
    mastery: { masteredConceptLabels: [], favoriteTopicLabel: null, weakestTopicLabel: null },
    session: {
      lastResult: null,
      upcomingMission: null,
      detectedMisconception: null,
      struggleLevel: 'none',
    },
    preferences: { mode: 'encouraging', autoMode: false },
    memory: { ...EMPTY_MEMORY, sessionCount: 2 },
    seed: 0,
  };
  return { ...base, ...overrides };
}

function result(overrides: Partial<MentorMissionResult> = {}): MentorMissionResult {
  return {
    missionId: 'toa.dfa-ends-01',
    missionTitle: 'Perimeter Security',
    conceptId: 'dfa-fundamentals',
    correct: true,
    hintsUsed: 0,
    attempts: 1,
    usedVisualization: false,
    timeMs: 30000,
    discoveredOwnMistake: false,
    improvedReasoning: false,
    ...overrides,
  };
}

const MISCONCEPTION: MisconceptionInput = {
  id: 'dfa-incomplete-transitions',
  conceptId: 'dfa-fundamentals',
  misconception: 'A DFA may leave a state without a transition for every symbol.',
  socraticQuestions: [
    'If the next symbol is one you have not handled, where does the machine go?',
    'Is "nowhere to go" valid for a function meant to be total?',
  ],
  hintProgression: [
    'Count the transitions leaving your busiest state — does it match the alphabet size?',
    'Consider one explicit reject state that catches every undefined transition.',
  ],
  visualizationRecommendation: 'Highlight undefined (state, symbol) pairs in red.',
};

// ---------------------------------------------------------------------------
// Memory
// ---------------------------------------------------------------------------
describe('mentor memory', () => {
  it('records and retrieves recent events newest-first', () => {
    let m = EMPTY_MEMORY;
    m = recordEvent(m, { type: 'mission-completed', at: 1, refId: 'a' });
    m = recordEvent(m, { type: 'mission-completed', at: 2, refId: 'b' });
    const recent = recentEvents(m, 'mission-completed', 5);
    expect(recent.map((e) => e.refId)).toEqual(['b', 'a']);
    expect(countEvents(m, 'mission-completed')).toBe(2);
  });

  it('detects repeated mistakes by refId frequency', () => {
    let m = EMPTY_MEMORY;
    m = recordEvent(m, { type: 'mistake-made', at: 1, refId: 'x' });
    m = recordEvent(m, { type: 'mistake-made', at: 2, refId: 'x' });
    m = recordEvent(m, { type: 'mistake-made', at: 3, refId: 'y' });
    expect(repeatedMistakes(m)).toEqual(['x']);
  });

  it('computes whole days since last visit and bumps session count', () => {
    const first = beginSession(EMPTY_MEMORY, 1000);
    expect(first.sessionCount).toBe(1);
    expect(daysSinceLastVisit(first, 1000)).toBeNull(); // no prior visit

    const second = beginSession(first, 1000 + 4 * DAY);
    expect(second.sessionCount).toBe(2);
    expect(daysSinceLastVisit(second, 1000 + 4 * DAY)).toBe(4);
  });

  it('celebrates a milestone only once', () => {
    let m = EMPTY_MEMORY;
    expect(hasCelebrated(m, 'first-boss')).toBe(false);
    m = markMilestoneCelebrated(m, 'first-boss');
    expect(hasCelebrated(m, 'first-boss')).toBe(true);
    const again = markMilestoneCelebrated(m, 'first-boss');
    expect(again.celebratedMilestones).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Coaching selection priority
// ---------------------------------------------------------------------------
describe('coaching intent selection', () => {
  it('prioritizes a debrief when a mission just finished', () => {
    expect(selectCoachingIntent(ctx({ session: { ...ctx().session, lastResult: result() } }))).toBe(
      'mission-debrief',
    );
  });

  it('celebrates a promotion above a debrief', () => {
    const c = ctx({
      career: { ...ctx().career, recentPromotionRankTitle: 'Junior Engineer' },
      session: { ...ctx().session, lastResult: result() },
    });
    expect(selectCoachingIntent(c)).toBe('milestone-celebration');
  });

  it('acknowledges a long absence before anything else (when no mission result)', () => {
    const c = ctx({
      player: { ...ctx().player, daysSinceLastVisit: 10 },
    });
    expect(selectCoachingIntent(c)).toBe('returning-after-absence');
  });

  it('intervenes on a detected misconception mid-struggle over a fresh briefing', () => {
    const c = ctx({
      session: {
        lastResult: null,
        upcomingMission: {
          id: 'm',
          title: 'T',
          district: 'Security District',
          conceptId: 'dfa-fundamentals',
          objective: 'Build it.',
          difficulty: 'easy',
          estimatedMinutes: 5,
          hints: [],
        },
        detectedMisconception: MISCONCEPTION,
        struggleLevel: 'mild',
      },
    });
    expect(selectCoachingIntent(c)).toBe('misconception-intervention');
  });

  it('falls back to a daily greeting when nothing situational applies', () => {
    expect(selectCoachingIntent(ctx())).toBe('daily-greeting');
  });

  it('does not re-celebrate an already-celebrated milestone', () => {
    const c = ctx({
      career: { ...ctx().career, firstBossVictoryJustEarned: true },
      memory: { ...EMPTY_MEMORY, sessionCount: 2, celebratedMilestones: ['first-boss'] },
    });
    expect(selectCoachingIntent(c)).not.toBe('milestone-celebration');
  });
});

// ---------------------------------------------------------------------------
// Socratic progression
// ---------------------------------------------------------------------------
describe('Socratic mentoring', () => {
  it('starts with the first Socratic question, not a hint', () => {
    const step = nextSocraticStep(MISCONCEPTION, EMPTY_MEMORY, 'mild');
    expect(step.kind).toBe('socratic-question');
    expect(step.text).toBe(MISCONCEPTION.socraticQuestions[0]);
    expect(step.recommendVisualization).toBe(false);
  });

  it('advances through questions then hints as struggle persists', () => {
    let m = EMPTY_MEMORY;
    const seen: string[] = [];
    for (let i = 0; i < 4; i += 1) {
      const step = nextSocraticStep(MISCONCEPTION, m, 'mild');
      seen.push(step.kind);
      m = advanceSocratic(m, MISCONCEPTION.id);
    }
    expect(seen).toEqual(['socratic-question', 'socratic-question', 'hint', 'hint']);
  });

  it('recommends visualization only once the ladder is exhausted', () => {
    let m = EMPTY_MEMORY;
    for (let i = 0; i < 3; i += 1) m = advanceSocratic(m, MISCONCEPTION.id);
    const step = nextSocraticStep(MISCONCEPTION, m, 'mild');
    expect(step.exhausted).toBe(true);
    expect(step.recommendVisualization).toBe(true);
  });

  it('never reveals the literal fix — output is always a known ladder rung', () => {
    const ladder = [...MISCONCEPTION.socraticQuestions, ...MISCONCEPTION.hintProgression];
    let m = EMPTY_MEMORY;
    for (let i = 0; i < 6; i += 1) {
      const step = nextSocraticStep(MISCONCEPTION, m, 'significant');
      expect(ladder).toContain(step.text);
      m = advanceSocratic(m, MISCONCEPTION.id);
    }
  });
});

// ---------------------------------------------------------------------------
// Debrief honesty + statistics integration
// ---------------------------------------------------------------------------
describe('debrief honesty', () => {
  it('praises a hint-free solve only when no hints were used', () => {
    const clean = generateForIntent(
      ctx({ session: { ...ctx().session, lastResult: result({ hintsUsed: 0 }) } }),
      'mission-debrief',
    );
    expect(clean.grounding.facts).toContain('zero hints used');

    const helped = generateForIntent(
      ctx({ session: { ...ctx().session, lastResult: result({ hintsUsed: 2 }) } }),
      'mission-debrief',
    );
    expect(helped.grounding.facts).not.toContain('zero hints used');
    expect(helped.grounding.facts).toContain('2 hints used');
  });

  it('acknowledges self-correction only when the player found their own mistake', () => {
    const u = generateForIntent(
      ctx({
        session: {
          ...ctx().session,
          lastResult: result({ attempts: 2, discoveredOwnMistake: true }),
        },
      }),
      'mission-debrief',
    );
    expect(u.grounding.facts).toContain('self-corrected after an earlier wrong attempt');
  });
});

// ---------------------------------------------------------------------------
// Adaptive coaching
// ---------------------------------------------------------------------------
describe('adaptive coaching', () => {
  it('suggests dropping visualization for heavy reliance', () => {
    const c = ctx({ statistics: stats({ totalMissions: 5, visualizationUsageRate: 0.8 }) });
    expect(selectCoachingIntent(c)).toBe('adaptive-nudge');
    const u = generateForIntent(c, 'adaptive-nudge');
    expect(u.grounding.facts).toContain('visualization usage 80%');
    expect(u.grounding.numbers).toContain(80);
  });

  it('offers a smaller version when the player is stuck', () => {
    const c = ctx({ session: { ...ctx().session, struggleLevel: 'stuck' } });
    const u = generateForIntent(c, 'adaptive-nudge');
    expect(u.grounding.facts.join(' ')).toContain('smaller version');
  });

  it('suggests patient mode under significant struggle when auto-mode is on', () => {
    const c = ctx({
      preferences: { mode: 'encouraging', autoMode: true },
      session: { ...ctx().session, struggleLevel: 'significant' },
    });
    expect(suggestMode(c)).toBe('patient');
  });

  it('suggests competitive mode for a fast, hint-light player', () => {
    const c = ctx({
      preferences: { mode: 'encouraging', autoMode: true },
      statistics: stats({ totalMissions: 5, averageAttempts: 1.1, averageHintsUsed: 0.2 }),
    });
    expect(suggestMode(c)).toBe('competitive');
  });

  it('holds the chosen mode when auto-mode is off', () => {
    const c = ctx({ preferences: { mode: 'minimal', autoMode: false }, session: { ...ctx().session, struggleLevel: 'stuck' } });
    expect(suggestMode(c)).toBe('minimal');
  });
});

// ---------------------------------------------------------------------------
// Milestone / promotion conversations
// ---------------------------------------------------------------------------
describe('milestone conversations', () => {
  it('names the rank in a promotion celebration', () => {
    const c = ctx({ career: { ...ctx().career, recentPromotionRankTitle: 'Systems Engineer' } });
    const u = generateForIntent(c, 'milestone-celebration');
    expect(u.text).toContain('Systems Engineer');
    expect(u.milestoneId).toBe('promotion:Systems Engineer');
  });

  it('celebrates a long streak with the real streak number', () => {
    const c = ctx({ statistics: stats({ currentStreak: 7 }) });
    const u = generateForIntent(c, 'milestone-celebration');
    expect(u.grounding.numbers).toContain(7);
    expect(u.text).toContain('7');
  });
});

// ---------------------------------------------------------------------------
// No hallucinated progress — the central guarantee
// ---------------------------------------------------------------------------
describe('no hallucinated progress', () => {
  const contexts: MentorContext[] = [
    ctx(),
    ctx({ player: { ...ctx().player, isFirstSession: true }, memory: { ...EMPTY_MEMORY, sessionCount: 0 } }),
    ctx({ player: { ...ctx().player, daysSinceLastVisit: 12 } }),
    ctx({ career: { ...ctx().career, totalMissionsCompleted: 9 }, mastery: { masteredConceptLabels: [], favoriteTopicLabel: null, weakestTopicLabel: null } }),
    ctx({ statistics: stats({ totalMissions: 5, visualizationUsageRate: 0.9, currentStreak: 6 }) }),
    ctx({ session: { ...ctx().session, lastResult: result({ hintsUsed: 3, attempts: 4, improvedReasoning: true, usedVisualization: true }) } }),
    ctx({ career: { ...ctx().career, recentPromotionRankTitle: 'Lead Engineer' } }),
  ];

  it('every number in the output is justified by the grounding, across many contexts and seeds', () => {
    for (const base of contexts) {
      for (let seed = 0; seed < 4; seed += 1) {
        const u = respond({ ...base, seed });
        const allowed = new Set(u.grounding.numbers);
        for (const n of extractNumbers(u.text)) {
          expect(allowed.has(n), `number ${n} in "${u.text}" not in grounding`).toBe(true);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Offline-first + LLM enhancement guard
// ---------------------------------------------------------------------------
describe('offline-first and LLM enhancement', () => {
  it('respond works with no client and produces grounded text', () => {
    const u = respond(ctx());
    expect(u.text.length).toBeGreaterThan(0);
    expect(u.intent).toBe('daily-greeting');
  });

  it('respondEnhanced with no client returns the deterministic text unchanged', async () => {
    const base = ctx();
    const deterministic = respond(base);
    const enhanced = await respondEnhanced(base);
    expect(enhanced.text).toBe(deterministic.text);
  });

  it('accepts an LLM rephrase that respects the grounding', async () => {
    const client: LLMClient = { enhance: async (r) => `${r.text} (rephrased)` };
    const base = ctx({ statistics: stats({ totalMissions: 5, visualizationUsageRate: 0.8 }) });
    const enhanced = await enhanceUtterance(respondTo(base, 'adaptive-nudge'), client);
    expect(enhanced.text).toContain('(rephrased)');
  });

  it('rejects an LLM rephrase that invents a number not in the grounding', async () => {
    const rogue: LLMClient = { enhance: async () => 'You have solved 999 missions!' };
    const base = ctx();
    const deterministic = respond(base);
    const enhanced = await enhanceUtterance(deterministic, rogue);
    expect(enhanced.text).toBe(deterministic.text); // fell back
  });

  it('falls back to deterministic text when the LLM throws', async () => {
    const broken: LLMClient = {
      enhance: async () => {
        throw new Error('network down');
      },
    };
    const deterministic = respond(ctx());
    const enhanced = await enhanceUtterance(deterministic, broken);
    expect(enhanced.text).toBe(deterministic.text);
  });

  it('respectsGrounding flags out-of-band numbers', () => {
    expect(respectsGrounding('used 2 hints', [2])).toBe(true);
    expect(respectsGrounding('used 5 hints', [2])).toBe(false);
    expect(respectsGrounding('no numbers here', [])).toBe(true);
  });
});
