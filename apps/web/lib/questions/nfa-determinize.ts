import type { Question } from '@arc/engine-assessment';
import {
  containsAaView,
  containsSubstring101View,
  nfaEndsIn01View,
  type NfaView,
} from '@/lib/automata/examples';

export type NfaTier = 'easy' | 'hard' | 'boss';

export interface NfaTierContent {
  readonly label: string;
  readonly description: string;
  readonly view: () => NfaView;
  readonly xpReward: number;
  readonly coinsReward: number;
}

/**
 * Each tier supplies its own NFA (and therefore its own alphabet — `easy`/`boss` use
 * {0,1}, `hard` uses {a,b}) so the mission component reads alphabet/automaton from here,
 * not from `nfaDeterminizeQuestion.payload`, which only carries the `easy` tier's
 * defaults for type-completeness (mirroring how every other Question payload works).
 */
export const NFA_TIERS: Readonly<Record<NfaTier, NfaTierContent>> = {
  easy: {
    label: 'Practice',
    description: 'Strings ending in "01" — 3 reachable subsets, no ε-transitions.',
    view: nfaEndsIn01View,
    xpReward: 200,
    coinsReward: 60,
  },
  hard: {
    label: 'Challenge',
    description: 'Strings containing "aa" — a real ε-transition to track.',
    view: containsAaView,
    xpReward: 260,
    coinsReward: 85,
  },
  boss: {
    label: 'Boss',
    description: 'Strings containing "101" — a 7-state powerset. The Reactor at full power.',
    view: containsSubstring101View,
    xpReward: 340,
    coinsReward: 110,
  },
};

export interface NfaConstructPayload {
  alphabet: readonly string[];
}

/**
 * "Collapse the Superposition" — the flagship NFA→DFA mission. The player is given an
 * NFA and a blank DFA canvas; nothing is converted for them. They build the DFA by hand,
 * labeling each new state as the subset of NFA states it represents, and submit. Grading
 * is by language equivalence (never graph shape); the subset-construction analysis layer
 * explains structural slips even when the language happens to still be correct.
 */
export const nfaDeterminizeQuestion: Question<NfaConstructPayload> = {
  id: 'toa.design.nfa-determinize-01',
  type: 'nfa-to-dfa',
  topic: 'nfa',
  concept: 'nfa-to-dfa-subset-construction',
  difficulty: 3,
  prompt:
    'The Quantum Research Lab has gone unstable — too many possibilities, not enough certainty. Collapse this NFA into an equivalent DFA. Name every state as the subset of NFA states it represents.',
  hints: [
    {
      kind: 'tiny-hint',
      text: 'Before reading any input symbol — does ε-closure already merge the start state with anything else?',
    },
    {
      kind: 'question',
      text: 'A subset only needs to be listed once even if you reach it by two different paths — did you create a duplicate?',
    },
    {
      kind: 'highlight-state',
      text: 'This is your start subset. Which NFA states does it actually contain once you apply ε-closure?',
    },
    {
      kind: 'highlight-transition',
      text: 'Trace this transition by hand: move() first, THEN ε-closure. Does your target subset match both steps?',
    },
    {
      kind: 'animate-idea',
      text: 'Watch one subset get discovered, step by step, in the reference conversion.',
    },
    {
      kind: 'visualization',
      text: 'Here is the complete subset construction, fully animated. Compare every discovered subset to your table.',
    },
  ],
  xpReward: 260,
  coinsReward: 85,
  achievementId: 'determinization-apprentice',
  estimatedTimeSec: 480,
  commonMistakes: [
    'Forgetting to apply ε-closure before recording a new subset.',
    'Creating two different-looking states that secretly represent the same subset.',
    "Marking a subset accepting because one of its NFA states LOOKS final, without checking the NFA's actual accepting set.",
  ],
  payload: { alphabet: ['0', '1'] },
};
