/**
 * MentorUtterance — what ARIA produces. Crucially it carries its own GROUNDING: the
 * facts and the exact set of numbers the text is allowed to contain. This makes the
 * "never invent progress / statistics" rule enforceable by tests and gives the optional
 * LLM layer a hard constraint to phrase within.
 */
import type { CoachingIntent } from './coaching.js';
import type { MentorMode } from './context.js';
import type { SocraticStep } from './socratic.js';

export interface Grounding {
  /** Human-readable claims this utterance is making, each traceable to context data. */
  readonly facts: readonly string[];
  /** Every numeric value the text legitimately references. Tests assert no others appear. */
  readonly numbers: readonly number[];
}

export interface MentorUtterance {
  readonly intent: CoachingIntent;
  readonly text: string;
  readonly mode: MentorMode;
  readonly grounding: Grounding;
  /** Present for misconception interventions; lets the host advance the Socratic ladder. */
  readonly socratic?: SocraticStep;
  /** Present for celebrations; lets the host mark the milestone so it fires only once. */
  readonly milestoneId?: string;
}

export function emptyGrounding(): Grounding {
  return { facts: [], numbers: [] };
}
