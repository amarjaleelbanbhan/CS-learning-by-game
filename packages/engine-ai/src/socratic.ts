/**
 * Socratic mentoring — never answer immediately, guide. Given a detected misconception
 * and how much the player is struggling, pick the NEXT rung to show. ARIA walks the
 * ladder one step at a time and only advances when the player keeps struggling. The
 * literal answer is never in this ladder, so ARIA structurally cannot give it away.
 */
import type { MisconceptionInput, StruggleLevel } from './context.js';
import type { MentorMemory } from './memory.js';
import { socraticStep } from './memory.js';

export type SocraticKind = 'socratic-question' | 'hint';

export interface SocraticStep {
  readonly kind: SocraticKind;
  readonly text: string;
  /** The misconception this addresses (for grounding + memory advancement). */
  readonly misconceptionId: string;
  /** Zero-based rung shown, across the combined question→hint ladder. */
  readonly rung: number;
  /** True when the ladder is exhausted — the host should escalate to visualization. */
  readonly exhausted: boolean;
  /** Surface the visualization recommendation only once questions+hints are spent. */
  readonly recommendVisualization: boolean;
}

/**
 * The combined ladder is: all Socratic questions first (vaguest guidance), THEN the hint
 * progression (more concrete), THEN a visualization recommendation. We never skip ahead;
 * a higher struggle level means we're willing to be on a later rung, but the rung shown
 * is always `min(alreadyShown, ladderLength-1)` so the player sees each step in order.
 */
export function nextSocraticStep(
  misconception: MisconceptionInput,
  memory: MentorMemory,
  struggle: StruggleLevel,
): SocraticStep {
  const questions = misconception.socraticQuestions;
  const hints = misconception.hintProgression;
  const ladderLength = questions.length + hints.length;

  const alreadyShown = socraticStep(memory, misconception.id);
  // 'stuck' is allowed to jump straight to the most concrete hint already; otherwise we
  // reveal strictly in order, one rung per struggle.
  const targetRung = struggle === 'stuck' ? Math.max(alreadyShown, questions.length) : alreadyShown;
  const rung = Math.min(targetRung, Math.max(ladderLength - 1, 0));

  const exhausted = rung >= ladderLength - 1;

  if (rung < questions.length) {
    return {
      kind: 'socratic-question',
      text: questions[rung]!,
      misconceptionId: misconception.id,
      rung,
      exhausted: ladderLength === questions.length ? exhausted : false,
      recommendVisualization: false,
    };
  }

  const hintIndex = rung - questions.length;
  return {
    kind: 'hint',
    text: hints[hintIndex] ?? hints[hints.length - 1]!,
    misconceptionId: misconception.id,
    rung,
    exhausted,
    recommendVisualization: exhausted,
  };
}
