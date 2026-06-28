/**
 * Mission briefings — set the STORY, never the theory. ARIA frames why this matters in
 * the world ("Security District reported unusual access codes…"), not what a DFA is.
 * The objective copy comes straight from the mission's in-world text; ARIA only adds
 * framing around it.
 */
import type { MentorContext, MissionBriefInput } from './context.js';
import { dress } from './modes.js';
import type { Grounding, MentorUtterance } from './utterance.js';

const FRAMINGS: readonly ((m: MissionBriefInput) => string)[] = [
  (m) => `Engineer, ${m.district} needs you. ${m.objective}`,
  (m) => `New contract from ${m.district}. ${m.objective}`,
  (m) => `${m.district} flagged something for your attention. ${m.objective}`,
  (m) => `They're asking for you specifically in ${m.district}. ${m.objective}`,
];

export function generateBriefing(ctx: MentorContext, mode = ctx.preferences.mode): MentorUtterance {
  const mission = ctx.session.upcomingMission;
  if (!mission) {
    // Defensive: caller should only ask for a briefing when one exists.
    return {
      intent: 'mission-briefing',
      text: dress(mode, 'Pick a mission and I’ll brief you.'),
      mode,
      grounding: { facts: [], numbers: [] },
    };
  }

  const framing = FRAMINGS[ctx.seed % FRAMINGS.length]!;
  const core = framing(mission);

  const grounding: Grounding = {
    facts: [
      `briefing for mission "${mission.title}" in ${mission.district}`,
      'story framing only — no theory revealed',
    ],
    numbers: [],
  };

  return {
    intent: 'mission-briefing',
    text: dress(mode, core),
    mode,
    grounding,
  };
}
