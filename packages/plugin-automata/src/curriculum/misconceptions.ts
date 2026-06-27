/**
 * Misconception database (PROMPT 04.6 Phase 4) — the deeper successor to
 * `common-mistakes.ts`. `common-mistakes.ts` stays in place (still tested, still valid,
 * lighter-weight) but ARIA's future hint logic should consume THIS module: every entry
 * here explains not just what students get wrong but WHY they believe it, so a hint can
 * target the underlying mental model instead of the symptom.
 *
 * Several entries below are corroborated by public, non-copyrighted research summaries
 * (GeeksforGeeks-style topic discovery, not copied text) gathered during PROMPT 04.6
 * Phase 2 — see `docs/curriculum-expansion-report.md` for sources. None of the prose
 * below is copied from any source; it is written fresh for this game.
 */
export interface Misconception {
  readonly id: string;
  readonly conceptId: string;
  readonly misconception: string;
  readonly whyStudentsBelieveIt: string;
  readonly correctReasoning: string;
  readonly detectionStrategy: string;
  /** Ordered ladder — ask the first one first; never skip ahead to revealing the fix. */
  readonly socraticQuestions: readonly string[];
  /** Ordered ladder of hints, vaguest first, most specific last — still never the literal answer. */
  readonly hintProgression: readonly string[];
  readonly visualizationRecommendation: string;
}

export const MISCONCEPTIONS: readonly Misconception[] = [
  {
    id: 'dfa-incomplete-transitions',
    conceptId: 'dfa-fundamentals',
    misconception:
      'A DFA is allowed to leave a state without a transition for every symbol in the alphabet.',
    whyStudentsBelieveIt:
      'NFA diagrams (seen later, or skimmed ahead) and "intuitive" diagrams in textbooks often omit dead-end transitions for clarity, so students copy that visual habit into formal DFA definitions.',
    correctReasoning:
      'The DFA transition function δ is total: δ(q, a) must be defined for every state q and every symbol a in Σ. A "missing" transition is shorthand for an implicit trap/reject state, not an undefined one.',
    detectionStrategy:
      'Check whether the submitted machine has exactly |Q| × |Σ| transitions. Fewer than that means at least one (state, symbol) pair was left undefined.',
    socraticQuestions: [
      'For the state you just drew, if the next input symbol is one you have not handled yet, where does the machine go?',
      'Is "the machine has nowhere to go" actually a valid outcome for a function that is supposed to be total?',
    ],
    hintProgression: [
      'Count the transitions leaving your busiest state — does that count match the size of your alphabet?',
      'Consider adding one explicit "reject and stay" state that catches every otherwise-undefined transition.',
    ],
    visualizationRecommendation:
      'Highlight every (state, symbol) pair with no outgoing edge in red before grading.',
  },
  {
    id: 'dfa-accept-means-halt',
    conceptId: 'dfa-fundamentals',
    misconception:
      'Reaching an accepting state means the machine stops and the string is accepted.',
    whyStudentsBelieveIt:
      'The word "accepting" sounds terminal, and many textbook diagrams draw the accepting state as visually distinct (double circle), which reads as "finish line" rather than "currently in good standing."',
    correctReasoning:
      'Acceptance is evaluated only once the ENTIRE input string has been consumed. A machine can pass through an accepting state and then leave it if more input remains.',
    detectionStrategy:
      'Test with a string whose proper prefix lands on an accepting state but the full string does not.',
    socraticQuestions: [
      'If you are sitting in an accepting state and one more symbol arrives, does the machine have to halt?',
    ],
    hintProgression: [
      'Try tracing a string that visits an accepting state in the middle, not at the end, and see what the formal definition actually says about that case.',
    ],
    visualizationRecommendation:
      'Animate the tape pointer continuing past an accepting state mid-string.',
  },
  {
    id: 'nfa-every-branch-must-accept',
    conceptId: 'nfa-fundamentals',
    misconception: 'An NFA accepts a string only if EVERY branch reaches an accepting state.',
    whyStudentsBelieveIt:
      'Universal quantification ("for all") feels like the "safe", more rigorous-sounding choice, and it mirrors how DFA acceptance is unambiguous and singular.',
    correctReasoning:
      'NFA acceptance is existential: the string is accepted if AT LEAST ONE branch/path through the machine ends in an accepting state after consuming all input. Other branches are allowed to die or end in non-accepting states.',
    detectionStrategy:
      "Present a string where some branches die early but one branch survives to acceptance — confirm whether the student's answer is accept or reject.",
    socraticQuestions: [
      'Acceptance only needs ONE survivor. How many branches does the machine actually need to keep alive to accept?',
    ],
    hintProgression: [
      'Think of the branches as independent guesses running in parallel — does a single correct guess matter if nine others were wrong?',
    ],
    visualizationRecommendation:
      'Branch-tree animation where dead branches visibly fade while the surviving accepting branch stays lit.',
  },
  {
    id: 'nfa-dfa-subset-direction-reversed',
    conceptId: 'nfa-fundamentals',
    misconception:
      'Every NFA is also a DFA (or: NFA is a strict subset of DFA), rather than the other way around.',
    whyStudentsBelieveIt:
      '"NFA" sounds like a special/restricted case of "FA" purely from the way the acronyms are introduced in sequence, and the subset-direction question is genuinely confirmed (via real exam material) to trip students up.',
    correctReasoning:
      'Every DFA already satisfies the NFA definition (exactly one transition per symbol still satisfies "at most one"), so DFA ⊆ NFA as classes of machines — while the LANGUAGES they can express turn out to be equal.',
    detectionStrategy:
      'Ask directly which containment direction holds for the machine classes (not the language classes) and check the answer against the formal definitions.',
    socraticQuestions: [
      'Every DFA already satisfies the NFA rules. Which direction does that containment actually point?',
    ],
    hintProgression: [
      'Recall the formal definition of each transition function — which one is a strict special case of the other?',
    ],
    visualizationRecommendation:
      'Side-by-side Venn diagram toggle, matching the real exam format this misconception was confirmed from.',
  },
  {
    id: 'subset-construction-random-combinations',
    conceptId: 'nfa-to-dfa-subset-construction',
    misconception:
      'The new DFA states in subset construction are arbitrary/random combinations of NFA states chosen by the algorithm designer.',
    whyStudentsBelieveIt:
      'The powerset of states looks combinatorially huge, so without tracing reachability explicitly, "just pick some subsets" feels like the only tractable strategy.',
    correctReasoning:
      'Only REACHABLE subsets become DFA states: starting from ε-closure(start), every subsequent subset is fully determined by following each symbol from the previous subset and taking the ε-closure of the union of results. Nothing is chosen freely.',
    detectionStrategy:
      'Check whether every DFA state in the submission can be reached from the start state by some sequence of symbols, and whether each one was computed (not guessed) from its predecessor.',
    socraticQuestions: [
      'Before reading any input symbol — does ε-closure already merge the start state with anything else?',
      'A subset only needs to be listed once even if you reach it by two different paths — did you create a duplicate?',
    ],
    hintProgression: [
      'Pick your start subset first, then mechanically compute exactly one successor per symbol — do not skip ahead to subsets you have not derived yet.',
    ],
    visualizationRecommendation:
      'Live reachability-frontier animation showing each new subset appearing only after being derived from an existing one.',
  },
  {
    id: 'regex-precedence-confusion',
    conceptId: 'regular-expressions',
    misconception:
      'Star (*) applies to the whole expression written so far, not just the single token immediately to its left.',
    whyStudentsBelieveIt:
      "Natural-language reading habits (left-to-right, treating a written clause as one unit) clash with regex's strict per-token operator precedence, especially before parentheses are introduced.",
    correctReasoning:
      'Star binds tightest, then concatenation, then union (+), unless parentheses override this. `ab*` means "a followed by zero-or-more b", not "zero or more repetitions of ab".',
    detectionStrategy:
      "Compare the student's regex against a deliberately ambiguous-looking case (e.g. ab* vs (ab)*) and check which language it actually denotes via NFA construction.",
    socraticQuestions: [
      'If you removed the star right now, exactly which part of your expression disappears?',
    ],
    hintProgression: [
      'Try grouping the part you actually want repeated in parentheses, then re-attach the star to the group instead of the bare symbol.',
    ],
    visualizationRecommendation:
      'Highlight exactly the sub-expression a given star/plus operator scopes over as the regex is typed.',
  },
  {
    id: 'cfg-leftmost-equals-rightmost',
    conceptId: 'context-free-grammars',
    misconception:
      'A leftmost derivation and a rightmost derivation of the same string must be different derivation TREES.',
    whyStudentsBelieveIt:
      'The two derivations look like entirely different sequences of sentential forms, so it is intuitive (but wrong) to assume the underlying structure must also differ.',
    correctReasoning:
      'Derivation order is a strategy for WHEN to expand which variable, not WHICH productions get applied. For an unambiguous grammar, the leftmost and rightmost derivations of one string always produce the exact same parse tree, just discovered in a different order.',
    detectionStrategy:
      'Have the student derive the same string both ways and compare the resulting trees node-for-node, not just the step sequences.',
    socraticQuestions: [
      'A derivation order is a strategy for WHEN to expand each variable — does changing the order change WHICH productions get used, or just the sequence?',
    ],
    hintProgression: [
      'Draw both derivations as trees instead of step lists, then overlay them — what do you notice?',
    ],
    visualizationRecommendation:
      'Side-by-side leftmost vs. rightmost derivation animation collapsing into one shared tree.',
  },
  {
    id: 'cfg-ambiguity-is-about-derivations-not-trees',
    conceptId: 'cfg-ambiguity',
    misconception:
      'Showing two different DERIVATIONS (two different step sequences) of a string is enough to prove a grammar ambiguous.',
    whyStudentsBelieveIt:
      'Two derivations with visibly different intermediate sentential forms look like "two different things happened", which feels like sufficient evidence of ambiguity.',
    correctReasoning:
      'A grammar is ambiguous only if a string has two derivation TREES that differ in shape (different productions applied somewhere, not just a different expansion order). Leftmost vs. rightmost derivations of an UNAMBIGUOUS grammar already look different step-by-step but yield the identical tree.',
    detectionStrategy:
      'Require the submission to draw both trees explicitly and check whether the trees themselves (not the step order) actually branch differently.',
    socraticQuestions: [
      'Two different derivation ORDERS of the same tree are not what you are looking for — the trees themselves must branch differently. Do yours?',
    ],
    hintProgression: [
      'Try a short string first — genuine ambiguity often already shows up at length 2 or 3.',
    ],
    visualizationRecommendation:
      'Render both submitted trees side by side and visually diff their shapes.',
  },
  {
    id: 'pda-stack-as-extra-memory-only',
    conceptId: 'pushdown-automata',
    misconception:
      'The stack in a PDA can be read from any position, like an array, rather than only from the top.',
    whyStudentsBelieveIt:
      'Students arriving from general programming experience are used to arrays/lists with random access, and "stack" sounds like just another data structure rather than a strict access-discipline constraint.',
    correctReasoning:
      'A PDA may only push, pop, or peek the TOP symbol on each move — there is no operation that inspects or modifies anything deeper in the stack directly. Any "memory" of earlier symbols must be encoded by what gets pushed/popped in order.',
    detectionStrategy:
      'Check whether a submitted PDA transition references anything other than the top stack symbol.',
    socraticQuestions: [
      'If you need to remember "how many a\'s so far" and that number has no upper bound, can a fixed, finite set of states hold it — or does something else on the machine need to grow?',
    ],
    hintProgression: [
      'Does the part of the string you are counting up happen before or after the part you are counting down — and which one should be growing the stack?',
    ],
    visualizationRecommendation:
      'Live stack-content animation alongside the state diagram, showing only top-of-stack access.',
  },
  {
    id: 'pumping-lemma-wrong-partition-target',
    conceptId: 'regular-language-properties',
    misconception:
      'You can choose to pump any substring of the witness string, including one that falls entirely outside the first p characters.',
    whyStudentsBelieveIt:
      'The pumping lemma\'s xyz-partition is rarely drawn to scale in textbook diagrams, so the constraint "|xy| ≤ p" reads as a minor technicality rather than the load-bearing part of the proof.',
    correctReasoning:
      "The pumping lemma only GUARANTEES the existence of a valid (x, y, z) partition with |xy| ≤ p and |y| ≥ 1 — for a string at least p symbols long. A proof that pumps a piece outside that guaranteed window has not actually used the lemma's hypothesis.",
    detectionStrategy:
      "Check whether the student's chosen y falls within the first p characters of their chosen witness string.",
    socraticQuestions: [
      'The pumping length guarantees something about a PREFIX of length at most p — does your chosen substring fall inside it?',
    ],
    hintProgression: [
      'Pick a witness string whose length depends on p directly (e.g. involving p itself), so the guaranteed window is forced into the part you actually want to pump.',
    ],
    visualizationRecommendation:
      'Highlight the guaranteed |xy| ≤ p window on the witness string before the student chooses y.',
  },
  {
    id: 'pumping-lemma-fixed-small-p',
    conceptId: 'regular-language-properties',
    misconception:
      'Proving a string fails to pump for ONE specific small value of p (e.g. p = 5) proves the language is not regular.',
    whyStudentsBelieveIt:
      'Working a concrete numeric example feels more rigorous and "checkable" than reasoning about an arbitrary, unknown p — and most worked examples in class use small numbers for readability.',
    correctReasoning:
      "A non-regularity proof must work for an ARBITRARY p, because p is whatever pumping length a hypothetical regular language's DFA would have — which is unknown and could be any size. Disproving only p = 5 merely shows no 5-state-class machine works, not that no machine of any size exists.",
    detectionStrategy:
      "Check whether the student's argument treats p as a free variable throughout, never substituting a specific number.",
    socraticQuestions: [
      'If p turned out to be 1000 instead of the number you used, would your argument still go through unchanged?',
    ],
    hintProgression: [
      'Rewrite your witness string and your chosen y using p itself (e.g. a^p, or a^(p+1)) instead of any specific number.',
    ],
    visualizationRecommendation:
      'None — deliberately withheld; this is a reasoning discipline issue, not a structural one a diagram fixes.',
  },
  {
    id: 'regular-grammar-direction-confusion',
    conceptId: 'regular-grammars',
    misconception:
      'Right-linear and left-linear grammars generate different classes of languages (one is "more powerful" than the other).',
    whyStudentsBelieveIt:
      'The two grammar forms look structurally mirror-imaged, so it is intuitive (but wrong) to assume that mirrored structure implies different generative power.',
    correctReasoning:
      'Both right-linear and left-linear grammars generate EXACTLY the regular languages — left-linear grammars can be converted to right-linear ones (and vice versa) via string reversal, which is exactly why both equal "regular".',
    detectionStrategy:
      'Ask for the language class generated by a left-linear grammar and check whether the answer differs from what the equivalent right-linear grammar would generate.',
    socraticQuestions: [
      'If you reversed every string this left-linear grammar generates, what kind of grammar would generate that reversed language?',
    ],
    hintProgression: [
      'Try converting the grammar to its reversed form and see what shape its productions take.',
    ],
    visualizationRecommendation:
      'Side-by-side NFA construction from both grammar forms, showing they reach equivalent machines.',
  },
];

export function misconceptionsForConcept(conceptId: string): readonly Misconception[] {
  return MISCONCEPTIONS.filter((m) => m.conceptId === conceptId);
}
