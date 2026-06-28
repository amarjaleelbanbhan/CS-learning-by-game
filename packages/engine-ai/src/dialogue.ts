/**
 * Deterministic dialogue generation. Given a context + chosen intent, produce a grounded
 * utterance. Every number that appears in `text` is also placed in `grounding.numbers`;
 * every claim is gated on a real context value. This module is the OFFLINE brain — it
 * works with no network and no LLM. The LLM layer (llm.ts) only rephrases what this
 * produces, never adds facts.
 */
import type { CoachingIntent } from './coaching.js';
import { adaptiveNudge, pendingMilestone, type AdaptiveNudge, type Milestone } from './coaching.js';
import type { MentorContext } from './context.js';
import { dress } from './modes.js';
import { nextSocraticStep } from './socratic.js';
import type { Grounding, MentorUtterance } from './utterance.js';
import { generateBriefing } from './briefing.js';
import { generateDebrief } from './debrief.js';

/** Pick a variant deterministically from the context seed. */
function pick<T>(variants: readonly T[], seed: number): T {
  return variants[seed % variants.length]!;
}

function greeting(ctx: MentorContext, mode: MentorContext['preferences']['mode']): MentorUtterance {
  const facts: string[] = [];
  const numbers: number[] = [];
  let core: string;

  if (ctx.player.isFirstSession || ctx.memory.sessionCount <= 1) {
    core = pick(
      [
        'Reactor’s online. I’m ARIA — I’ll be your mentor from your first build to your last.',
        'Welcome, Engineer. Systems are green. Let’s start turning theory into machines.',
      ],
      ctx.seed,
    );
    facts.push('first-session greeting');
  } else if (ctx.mastery.favoriteTopicLabel) {
    core = pick(
      [
        `Welcome back, Engineer. You’ve been strongest on ${ctx.mastery.favoriteTopicLabel} — want to build on that?`,
        `Good to see you. ${ctx.mastery.favoriteTopicLabel} has been your sharpest topic lately.`,
      ],
      ctx.seed,
    );
    facts.push(`favorite topic: ${ctx.mastery.favoriteTopicLabel}`);
  } else if (ctx.career.totalMissionsCompleted > 0) {
    core = pick(
      [
        `Welcome back, Engineer. ${ctx.career.totalMissionsCompleted} ${plural(ctx.career.totalMissionsCompleted, 'mission')} behind you and counting.`,
        `Back at it. That’s ${ctx.career.totalMissionsCompleted} ${plural(ctx.career.totalMissionsCompleted, 'mission')} on your record so far.`,
      ],
      ctx.seed,
    );
    facts.push(`${ctx.career.totalMissionsCompleted} missions completed`);
    numbers.push(ctx.career.totalMissionsCompleted);
  } else {
    core = pick(
      ['Welcome back, Engineer.', 'Good to see you again, Engineer.'],
      ctx.seed,
    );
    facts.push('returning greeting');
  }

  return { intent: 'daily-greeting', text: dress(mode, core), mode, grounding: { facts, numbers } };
}

function returningAfterAbsence(
  ctx: MentorContext,
  mode: MentorContext['preferences']['mode'],
): MentorUtterance {
  const days = ctx.player.daysSinceLastVisit ?? 0;
  const core = pick(
    [
      `It’s been ${days} ${plural(days, 'day')}. Welcome back — let’s warm up before anything hard.`,
      `${days} ${plural(days, 'day')} away. No problem — I’ll start you on something gentle to find your rhythm again.`,
    ],
    ctx.seed,
  );
  return {
    intent: 'returning-after-absence',
    text: dress(mode, core),
    mode,
    grounding: { facts: [`away for ${days} days`], numbers: [days] },
  };
}

function milestone(
  ctx: MentorContext,
  m: Milestone,
  mode: MentorContext['preferences']['mode'],
): MentorUtterance {
  let core: string;
  const facts: string[] = [`milestone: ${m.kind}`];
  const numbers: number[] = [];

  switch (m.kind) {
    case 'promotion':
      core = `That’s a real promotion, Engineer — ${m.label}. Every requirement met, no shortcuts.`;
      facts.push(`promoted to ${m.label}`);
      break;
    case 'first-boss':
      core = 'Your first boss is down. That was a genuine test, and you passed it.';
      facts.push('first boss victory');
      break;
    case 'first-certification':
      core = 'Your first certification is logged. The Academy trusts you with harder problems now.';
      facts.push('first certification earned');
      break;
    case 'first-mission':
      core = 'First mission, solved. Every engineer’s career starts with exactly this moment.';
      facts.push('first mission completed');
      break;
    case 'long-streak': {
      const streak = ctx.statistics.currentStreak;
      core = `That’s ${streak} missions in a row. Consistency like that is the real superpower.`;
      facts.push(`${streak}-mission streak`);
      numbers.push(streak);
      break;
    }
  }

  return {
    intent: 'milestone-celebration',
    text: dress(mode, core),
    mode,
    grounding: { facts, numbers },
    milestoneId: m.id,
  };
}

function nudge(
  ctx: MentorContext,
  kind: AdaptiveNudge,
  mode: MentorContext['preferences']['mode'],
): MentorUtterance {
  const facts: string[] = [`adaptive nudge: ${kind}`];
  const numbers: number[] = [];
  let core: string;

  switch (kind) {
    case 'reduce-visualization': {
      const pct = Math.round(ctx.statistics.visualizationUsageRate * 100);
      core = `You’ve used the visualization on ${pct}% of missions. I think you’re ready to try the next one without it.`;
      facts.push(`visualization usage ${pct}%`);
      numbers.push(pct);
      break;
    }
    case 'increase-challenge':
      core = 'You’re solving these quickly and cleanly. I’m increasing today’s challenge slightly.';
      facts.push('fast, low-hint performance');
      break;
    case 'smaller-version':
      core = 'That one’s fighting back. Let’s solve a smaller version first, then return to it.';
      facts.push('player is stuck — offer a smaller version');
      break;
    case 'repeated-misconception':
      core = 'I’ve noticed the same slip more than once. Let’s name it directly so it stops costing you.';
      facts.push('repeated misconception detected');
      break;
  }

  return { intent: 'adaptive-nudge', text: dress(mode, core), mode, grounding: { facts, numbers } };
}

function misconceptionIntervention(
  ctx: MentorContext,
  mode: MentorContext['preferences']['mode'],
): MentorUtterance {
  const mc = ctx.session.detectedMisconception!;
  const step = nextSocraticStep(mc, ctx.memory, ctx.session.struggleLevel);
  const facts = [
    `misconception: ${mc.id}`,
    step.kind === 'socratic-question' ? 'guiding with a question' : 'offering a concrete hint',
  ];
  if (step.recommendVisualization) facts.push('ladder exhausted — recommend visualization');

  return {
    intent: 'misconception-intervention',
    // Socratic questions and hints land verbatim regardless of mode — dressing a question
    // would blunt it, and the ladder text is already carefully phrased.
    text: step.text,
    mode,
    grounding: { facts, numbers: [] },
    socratic: step,
  };
}

function idle(ctx: MentorContext, mode: MentorContext['preferences']['mode']): MentorUtterance {
  const core = pick(
    [
      'Take your time. Every great engineer starts by staring at a blank canvas.',
      'Curious is good. Curious is how you’ll actually understand this.',
      'Need a hint? I’m listening — but I’ll make you think first.',
    ],
    ctx.seed,
  );
  return { intent: 'idle-encouragement', text: dress(mode, core), mode, grounding: emptyG() };
}

function emptyG(): Grounding {
  return { facts: [], numbers: [] };
}

function plural(n: number, word: string): string {
  return n === 1 ? word : `${word}s`;
}

/**
 * Generate the utterance for an explicitly chosen intent. The orchestrator (mentor.ts)
 * normally picks the intent via selectCoachingIntent, but exposing this lets the host
 * request a specific one (e.g. an idle orb-click).
 */
export function generateForIntent(
  ctx: MentorContext,
  intent: CoachingIntent,
  mode = ctx.preferences.mode,
): MentorUtterance {
  switch (intent) {
    case 'returning-after-absence':
      return returningAfterAbsence(ctx, mode);
    case 'milestone-celebration': {
      const m = pendingMilestone(ctx);
      return m ? milestone(ctx, m, mode) : greeting(ctx, mode);
    }
    case 'mission-debrief':
      return generateDebrief(ctx, mode);
    case 'mission-briefing':
      return generateBriefing(ctx, mode);
    case 'misconception-intervention':
      return misconceptionIntervention(ctx, mode);
    case 'adaptive-nudge': {
      const k = adaptiveNudge(ctx);
      return k ? nudge(ctx, k, mode) : greeting(ctx, mode);
    }
    case 'idle-encouragement':
      return idle(ctx, mode);
    case 'daily-greeting':
    default:
      return greeting(ctx, mode);
  }
}
