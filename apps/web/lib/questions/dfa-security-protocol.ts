import type { Question } from '@arc/engine-assessment';
import { endsIn01View } from '@/lib/automata/examples';

export interface DfaConstructPayload {
  alphabet: readonly string[];
}

/**
 * The first construction mission. The player is never told what a DFA is —
 * they're given an objective and a blank canvas. The reference automaton
 * (same language as the earlier "test a string" tutorial) is never shown
 * directly; `gradeDfaConstruction` checks language equivalence against it,
 * and the hint ladder is the only path back to seeing it rendered.
 */
export const dfaSecurityProtocol: Question<DfaConstructPayload> = {
  id: 'toa.build.dfa-ends-01',
  type: 'dfa-construct',
  topic: 'dfa',
  concept: 'states-as-memory',
  difficulty: 2,
  prompt:
    "Engineer — the reactor's perimeter only unlocks for binary access codes ending in 01. Build the recognition circuit. Test it. Submit when you trust it.",
  hints: [
    {
      kind: 'tiny-hint',
      text: 'Think about what the machine needs to remember after each character it reads — not the whole code, just enough.',
    },
    {
      kind: 'question',
      text: "If you just read a '0', and the next character is '1', the code ends in 01. So what does reading a '0' need to mean to your machine?",
    },
    {
      kind: 'highlight-state',
      text: 'This is your start state. What does being here mean — "seen nothing useful yet," or something else?',
    },
    {
      kind: 'highlight-transition',
      text: 'Trace this transition with the test string above. Where does it actually lead, and is that where it should?',
    },
    {
      kind: 'animate-idea',
      text: 'Watch a different machine recognize the same rule. Notice which state lights up right before acceptance.',
    },
    {
      kind: 'visualization',
      text: "Here's a working circuit for this exact rule. Compare it to yours — same idea, maybe different shape.",
    },
  ],
  xpReward: 220,
  coinsReward: 80,
  achievementId: 'dfa-engineer',
  estimatedTimeSec: 240,
  commonMistakes: [
    "Forgetting that reading a '1' right after a '0' resets to 'no progress' only if the next char isn't another match.",
    'Marking the wrong state as accepting — acceptance only matters at the END of the string.',
    'Adding two transitions for the same symbol from one state (not allowed in a DFA).',
  ],
  payload: { alphabet: ['0', '1'] },
};

/** The hidden reference visualization shown only at the final hint tiers. */
export const referenceView = endsIn01View;
