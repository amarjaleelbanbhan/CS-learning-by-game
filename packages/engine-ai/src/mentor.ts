/**
 * The mentor orchestrator — the public entry point that ties the decision flow together:
 *
 *   context  ->  selectCoachingIntent  ->  suggestMode  ->  generateForIntent  ->  (enhance)
 *
 * `respond` is fully deterministic and offline. `respondEnhanced` optionally rephrases via
 * an injected LLM client but always falls back to the deterministic result. Neither ever
 * invents facts: the chosen intent and grounded utterance are decided before any LLM call.
 */
import { selectCoachingIntent } from './coaching.js';
import type { MentorContext } from './context.js';
import { generateForIntent } from './dialogue.js';
import { enhanceUtterance, type LLMClient } from './llm.js';
import { suggestMode } from './modes.js';
import type { MentorUtterance } from './utterance.js';

/** Deterministic, offline mentor response. This is the authoritative output. */
export function respond(ctx: MentorContext): MentorUtterance {
  const intent = selectCoachingIntent(ctx);
  const mode = suggestMode(ctx);
  return generateForIntent(ctx, intent, mode);
}

/** As `respond`, but for an explicitly requested intent (e.g. idle orb-click). */
export function respondTo(
  ctx: MentorContext,
  intent: Parameters<typeof generateForIntent>[1],
): MentorUtterance {
  const mode = suggestMode(ctx);
  return generateForIntent(ctx, intent, mode);
}

/**
 * Offline-first enhanced response. Computes the deterministic utterance, then optionally
 * lets the LLM rephrase it within its grounding. Returns the deterministic text if no
 * client is provided or enhancement fails/violates grounding.
 */
export async function respondEnhanced(
  ctx: MentorContext,
  client?: LLMClient,
): Promise<MentorUtterance> {
  return enhanceUtterance(respond(ctx), client);
}
