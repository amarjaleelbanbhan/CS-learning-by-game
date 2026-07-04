import type { Question } from '@arc/engine-assessment';

export type RegexTier = 'easy' | 'medium' | 'hard' | 'boss' | 'legend';

export interface RegexTierContent {
  readonly label: string;
  readonly description: string;
  readonly prompt: string;
  readonly referenceRegex: string;
  readonly xpReward: number;
  readonly coinsReward: number;
}

export const REGEX_TIERS: Readonly<Record<RegexTier, RegexTierContent>> = {
  easy: {
    label: 'Practice (Easy)',
    description: 'Strings starting with "1" over {0,1}',
    prompt: 'Construct a regular expression for strings that start with "1".',
    referenceRegex: '1(0|1)*',
    xpReward: 60,
    coinsReward: 20,
  },
  medium: {
    label: 'Practice (Medium)',
    description: 'Strings with no two consecutive 0s over {0,1}',
    prompt: 'Construct a regular expression for strings with no two consecutive 0s.',
    referenceRegex: '(1|01)*(0|ε)',
    xpReward: 200,
    coinsReward: 70,
  },
  hard: {
    label: 'Challenge (Hard)',
    description: 'Strings where every block of 1s has even length over {0,1}',
    prompt: 'Construct a regular expression for strings where every block of 1s has even length.',
    referenceRegex: '(0|11)*',
    xpReward: 320,
    coinsReward: 100,
  },
  boss: {
    label: 'Boss',
    description: 'Strings that contain "101" as a substring exactly once over {0,1}',
    prompt:
      'Construct a regular expression for strings that contain "101" as a substring exactly once.',
    referenceRegex: '0*(1+00+)*1+01+(00+1+)*0*',
    xpReward: 500,
    coinsReward: 150,
  },
  legend: {
    label: 'Legend',
    description: 'Length mod 3 equals count of 1s mod 3 over {0,1}',
    prompt:
      'Construct a regular expression for strings whose length mod 3 equals the count of "1"s mod 3.',
    referenceRegex: '1*(01*01*01*)*',
    xpReward: 800,
    coinsReward: 250,
  },
};

export interface RegexConstructPayload {
  alphabet: readonly string[];
}

export const regexConstructionQuestion: Question<RegexConstructPayload> = {
  id: 'toa.design.regex-construction-01',
  type: 'regex-construct',
  topic: 'regex',
  concept: 'regular-expressions',
  difficulty: 2,
  prompt:
    'Step into the Pattern Forge. Describe the target binary sequence rules using regular expressions. The fabric of the code will translate it to finite control.',
  hints: [
    {
      kind: 'tiny-hint',
      text: 'Does this property describe something that must happen ONCE, or something that must NEVER happen across the whole string?',
    },
    {
      kind: 'question',
      text: 'Could you describe the "safe" prefix and the "safe" suffix separately, then glue them together?',
    },
    {
      kind: 'highlight-state',
      text: 'Star (*) applies to whatever is immediately to its left — did you group the part you meant to repeat with parentheses?',
    },
    {
      kind: 'highlight-transition',
      text: 'Plus (+) means "one or more" and is equivalent to aa*. Optional (?) means "zero or one" and is equivalent to (a|ε).',
    },
    {
      kind: 'animate-idea',
      text: 'If you fail multiple times, the visualizer will reveal the Thompson NFA constructed from your regex to show you how the compiler sees it.',
    },
    {
      kind: 'visualization',
      text: 'Visualizing the compiled NFA can reveal where your loop or branch goes out of bounds.',
    },
  ],
  xpReward: 200,
  coinsReward: 70,
  achievementId: 'pattern-whisperer',
  estimatedTimeSec: 720,
  commonMistakes: [
    'Confusing precedence: ab* is different from (ab)*.',
    'Forgetting empty transitions or omitting grouping parentheses.',
    'Forming a loop that allows unwanted substrings to slip through.',
  ],
  payload: { alphabet: ['0', '1'] },
};
