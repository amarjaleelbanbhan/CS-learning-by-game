/**
 * Mission debriefings — analyze the run, not just the outcome. Every clause is gated on
 * a real fact from the result: ARIA praises a hint-free win only when hintsUsed === 0,
 * notes self-correction only when the player genuinely found their own mistake, etc. No
 * fact, no praise.
 */
import type { MentorContext } from './context.js';
import { dress } from './modes.js';
import type { Grounding, MentorUtterance } from './utterance.js';

export function generateDebrief(ctx: MentorContext, mode = ctx.preferences.mode): MentorUtterance {
  const result = ctx.session.lastResult;
  if (!result) {
    return {
      intent: 'mission-debrief',
      text: dress(mode, 'No mission to review yet.'),
      mode,
      grounding: { facts: [], numbers: [] },
    };
  }

  const clauses: string[] = [];
  const facts: string[] = [];
  const numbers: number[] = [];

  if (result.correct) {
    clauses.push('Solved.');
    facts.push('mission solved correctly');
  } else {
    clauses.push("Not quite — and that's information, not failure.");
    facts.push('mission not yet solved');
  }

  // Honest, fact-gated observations about HOW it went.
  if (result.correct && result.hintsUsed === 0) {
    clauses.push('No hints — that was all you.');
    facts.push('zero hints used');
    numbers.push(0);
  } else if (result.hintsUsed > 0) {
    clauses.push(`You used ${result.hintsUsed} ${plural(result.hintsUsed, 'hint')}.`);
    facts.push(`${result.hintsUsed} hints used`);
    numbers.push(result.hintsUsed);
  }

  if (result.correct && result.discoveredOwnMistake) {
    clauses.push('You caught your own mistake and corrected it — that’s the real skill.');
    facts.push('self-corrected after an earlier wrong attempt');
  }

  if (result.improvedReasoning) {
    clauses.push('Fewer attempts than your usual — your reasoning is getting sharper.');
    facts.push('used fewer attempts than the running average');
  }

  if (result.usedVisualization) {
    clauses.push('You leaned on the visualization this time.');
    facts.push('used visualization');
  }

  const core = clauses.join(' ');
  const grounding: Grounding = { facts, numbers: dedupe(numbers) };

  return {
    intent: 'mission-debrief',
    text: dress(mode, core),
    mode,
    grounding,
  };
}

function plural(n: number, word: string): string {
  return n === 1 ? word : `${word}s`;
}

function dedupe(ns: number[]): number[] {
  return [...new Set(ns)];
}
