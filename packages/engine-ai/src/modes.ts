/**
 * Mentor modes — coaching personality. The mode shapes TONE only; it never changes
 * which facts ARIA states or which intent is chosen. A "competitive" debrief of a
 * hint-free win and a "patient" debrief of the same win report identical facts in a
 * different voice.
 */
import type { MentorContext, MentorMode } from './context.js';

export interface ModeVoice {
  /** Optional short lead-in fragment (no trailing space). */
  readonly opener: string;
  /** Optional short sign-off fragment. */
  readonly closer: string;
}

const VOICES: Record<MentorMode, ModeVoice> = {
  encouraging: { opener: 'Nice', closer: "You've got this." },
  analytical: { opener: 'Observation', closer: 'The data backs that up.' },
  minimal: { opener: '', closer: '' },
  competitive: { opener: 'Logged', closer: 'Now beat it.' },
  patient: { opener: "Let's take this calmly", closer: 'No rush at all.' },
};

export function voiceFor(mode: MentorMode): ModeVoice {
  return VOICES[mode];
}

/**
 * Suggest a mode from performance when auto-mode is on. Deterministic. This is a
 * recommendation only — the host applies it to preferences; ARIA still reports the same
 * facts either way.
 *
 *  - A struggling/stuck player gets patience.
 *  - A fast, hint-light player gets a competitive edge.
 *  - A player leaning hard on visualization gets analytical framing to build intuition.
 *  - Otherwise hold an encouraging baseline.
 */
export function suggestMode(ctx: MentorContext): MentorMode {
  if (!ctx.preferences.autoMode) return ctx.preferences.mode;

  if (ctx.session.struggleLevel === 'stuck' || ctx.session.struggleLevel === 'significant') {
    return 'patient';
  }

  const stats = ctx.statistics;
  if (stats.totalMissions >= 3) {
    if (stats.averageAttempts <= 1.2 && stats.averageHintsUsed <= 0.5) return 'competitive';
    if (stats.visualizationUsageRate >= 0.7) return 'analytical';
  }

  return 'encouraging';
}

/** Wrap a core sentence with the mode's voice. Minimal mode passes the sentence through. */
export function dress(mode: MentorMode, core: string): string {
  const voice = voiceFor(mode);
  if (mode === 'minimal') return core;
  const parts: string[] = [];
  if (voice.opener) parts.push(`${voice.opener} —`);
  parts.push(core);
  if (voice.closer) parts.push(voice.closer);
  return parts.join(' ');
}
