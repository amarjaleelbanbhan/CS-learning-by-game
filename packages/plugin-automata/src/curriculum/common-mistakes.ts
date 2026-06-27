/**
 * Common-mistake catalogue, keyed by concept id (see `concepts.ts`). This is the data
 * ARIA's hint ladder is meant to consume later — every `socraticHint` asks a leading
 * question, it never states the fix. Some entries are corroborated directly by the
 * source material (e.g. the Sukkur IBA exam literally prints "(Hint: Recall the formal
 * definition)" next to the DFA/NFA subset-direction question — that is a strong signal
 * real students get it backwards).
 */
export interface CommonMistake {
  readonly conceptId: string;
  readonly mistake: string;
  readonly socraticHint: string;
}

export const COMMON_MISTAKES: readonly CommonMistake[] = [
  {
    conceptId: 'dfa-fundamentals',
    mistake:
      'Leaving a state without a transition for every symbol in the alphabet (an incomplete DFA).',
    socraticHint:
      'For the state you just drew — if the next input symbol is one you have not handled yet, where does the machine go?',
  },
  {
    conceptId: 'dfa-fundamentals',
    mistake:
      'Treating "accepting state" as "the machine stops here" rather than "the machine may continue reading input".',
    socraticHint:
      'If you are sitting in an accepting state and one more symbol arrives, does the machine have to halt?',
  },
  {
    conceptId: 'nfa-fundamentals',
    mistake:
      "Believing every NFA is automatically harder to simulate by hand because it 'branches forever'.",
    socraticHint:
      'How many distinct states could the machine possibly be tracking at once, given there are only finitely many states total?',
  },
  {
    conceptId: 'nfa-fundamentals',
    mistake:
      'Getting the subset direction backwards — assuming every NFA is a DFA, or that DFA is a strict superset of NFA.',
    socraticHint:
      'Every DFA already satisfies the NFA rules (one transition per symbol still fits "at most one or more"). Which direction does that containment actually point?',
  },
  {
    conceptId: 'epsilon-transitions',
    mistake:
      'Forgetting that ε-closure must be computed transitively (closure of a closure) before reading the next symbol.',
    socraticHint:
      'After you ε-jump once, are you sure there is no second ε-transition waiting at the state you just landed on?',
  },
  {
    conceptId: 'nfa-to-dfa-subset-construction',
    mistake: 'Building DFA states as single NFA states instead of as SETS of NFA states.',
    socraticHint:
      'In the new machine, after reading one symbol from the start, how many different NFA states could you simultaneously be in?',
  },
  {
    conceptId: 'nfa-to-dfa-subset-construction',
    mistake:
      'Forgetting the empty set ∅ as a valid (non-accepting, absorbing) DFA state when every branch dies.',
    socraticHint:
      'What happens to your subset-state if every NFA state in it has no transition for the symbol you just read?',
  },
  {
    conceptId: 'regular-expressions',
    mistake: 'Using the alternation operator where concatenation was needed, or vice versa.',
    socraticHint:
      'Does this part of the string need to be ONE of two things, or does it need to be one thing FOLLOWED BY another?',
  },
  {
    conceptId: 'regular-expressions',
    mistake:
      'Forgetting that `*` applies to the single token directly to its left, not the whole expression so far, unless grouped with parentheses.',
    socraticHint:
      'If you removed the star right now, exactly which part of your expression disappears?',
  },
  {
    conceptId: 'regex-automata-equivalence',
    mistake:
      'Eliminating a state without first looping the self-transitions it had into the surrounding edges.',
    socraticHint:
      'If that state had a transition back to itself, what happens to a path that needed to pass through it twice?',
  },
  {
    conceptId: 'regular-language-properties',
    mistake:
      'Trying to "pump" a substring that is not actually inside the first p characters required by the pumping lemma.',
    socraticHint:
      'The pumping length guarantees something about a PREFIX of length at most p — does your chosen substring fall inside it?',
  },
  {
    conceptId: 'regular-language-properties',
    mistake:
      'Picking a witness string that happens to still belong to the language after pumping, accidentally proving nothing.',
    socraticHint:
      "After you pump your chosen piece, recount: does the resulting string still satisfy the language's defining condition?",
  },
  {
    conceptId: 'grammars-general',
    mistake:
      'Confusing a sentential form (still has variables in it) with a finished sentence (terminals only).',
    socraticHint:
      'Look at the string you just derived — does every symbol in it appear in the alphabet, or is a variable still hiding in there?',
  },
  {
    conceptId: 'context-free-grammars',
    mistake:
      'Assuming leftmost and rightmost derivations of the same string must produce different parse trees.',
    socraticHint:
      'A derivation order is a strategy for WHEN to expand each variable — does changing the order change WHICH productions get used, or just the sequence?',
  },
  {
    conceptId: 'cfg-ambiguity',
    mistake:
      'Showing two different DERIVATIONS (sequences of steps) instead of two different derivation TREES for the same string.',
    socraticHint:
      'Two leftmost derivations of the same string by the same grammar always produce the same tree — what actually needs to differ between your two derivations?',
  },
  {
    conceptId: 'cfg-simplification',
    mistake:
      'Removing a nullable variable but forgetting to add the new productions that "skip over" it.',
    socraticHint:
      'If that variable could previously vanish to ε, what does every production that used it need to gain a copy of?',
  },
  {
    conceptId: 'chomsky-normal-form',
    mistake:
      'Leaving a production with a mix of one terminal and one variable on the right side (e.g. A → aB), which CNF forbids.',
    socraticHint:
      'Does every production you wrote have EITHER exactly two variables OR exactly one terminal — never a mix?',
  },
  {
    conceptId: 'pushdown-automata',
    mistake:
      'Trying to count an unbounded quantity using a finite number of DFA-style states instead of the stack.',
    socraticHint:
      'If you need to remember "how many a\'s so far" and that number has no upper bound, can a fixed, finite set of states hold it — or does something else on the machine need to grow?',
  },
];

export function mistakesForConcept(conceptId: string): readonly CommonMistake[] {
  return COMMON_MISTAKES.filter((m) => m.conceptId === conceptId);
}
