/**
 * LLM enhancement port. The LLM is NOT the brain — it only rephrases an already-decided,
 * already-grounded utterance into warmer language. The deterministic engine remains
 * authoritative: intent, facts, and numbers are fixed before the LLM is ever called, and
 * the result is validated so the model cannot smuggle in invented progress.
 *
 * OFFLINE-FIRST: if no client is injected, or the call fails, or the output violates the
 * grounding, ARIA falls back to the deterministic text. The mentoring experience never
 * depends on the network.
 */
import type { MentorUtterance } from './utterance.js';

export interface LLMEnhanceRequest {
  /** The deterministic text to rephrase. */
  readonly text: string;
  /** Facts the rephrasing must stay within — no new claims allowed. */
  readonly facts: readonly string[];
  /** The only numbers allowed to appear in the output. */
  readonly allowedNumbers: readonly number[];
  /** Coaching tone to honour. */
  readonly mode: string;
}

/** The injected port. A host wires this to Claude (server-proxied) when a key is available. */
export interface LLMClient {
  enhance(request: LLMEnhanceRequest): Promise<string>;
}

/** Extract every standalone integer in a string. */
export function extractNumbers(text: string): number[] {
  const matches = text.match(/\d+/g);
  return matches ? matches.map((m) => Number(m)) : [];
}

/**
 * Returns true when `text` introduces no number outside `allowed` — the structural guard
 * against hallucinated statistics. Empty/!match passes trivially.
 */
export function respectsGrounding(text: string, allowed: readonly number[]): boolean {
  const allowedSet = new Set(allowed);
  return extractNumbers(text).every((n) => allowedSet.has(n));
}

/**
 * Enhance an utterance's phrasing if a client is available and the result stays within
 * grounding; otherwise return the original unchanged. Pure orchestration — safe to call
 * unconditionally.
 */
export async function enhanceUtterance(
  utterance: MentorUtterance,
  client?: LLMClient,
): Promise<MentorUtterance> {
  if (!client) return utterance;

  try {
    const enhanced = await client.enhance({
      text: utterance.text,
      facts: utterance.grounding.facts,
      allowedNumbers: utterance.grounding.numbers,
      mode: utterance.mode,
    });
    const trimmed = enhanced.trim();
    if (!trimmed) return utterance;
    if (!respectsGrounding(trimmed, utterance.grounding.numbers)) return utterance;
    return { ...utterance, text: trimmed };
  } catch {
    // Any failure (network, timeout, malformed) degrades silently to deterministic text.
    return utterance;
  }
}
