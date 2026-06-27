import type { Difficulty } from '@arc/plugin-sdk';
import type { UnlockNode } from '@arc/engine-game';
import type { QuestionTypeId } from './question-types.js';
import type { QuestionFormatId } from './question-formats.js';

export type MissionVariationTier =
  | 'easy'
  | 'medium'
  | 'hard'
  | 'boss'
  | 'legend'
  | 'daily'
  | 'infinite';

export interface MissionVariation {
  readonly tier: MissionVariationTier;
  readonly prompt: string;
  readonly xpReward: number;
}

/**
 * Structured mission database — NOT lessons. Every entry below is either:
 *  - `status: 'live'`     — already shipped; `id` is the literal MISSION_ID string used in
 *                           `apps/web/lib/campaign/academy.ts`. These entries exist so the
 *                           database is a complete map of the campaign, not just a backlog.
 *  - `status: 'designed'` — fully specified, content-complete, but NOT YET implemented as a
 *                           route/component.
 *
 * `versionScope` marks campaign-readiness independently of `status`: a 'v2-future' mission
 * may already be fully designed (it isn't deleted — the design work is real and reusable)
 * but is explicitly excluded from V1 campaign counts per PROMPT 04.6 Phase 9.
 *
 * All objectives/hints/prompts below are ORIGINAL — written for this game, never copied
 * verbatim from the Busch RPI slide decks or the Sukkur IBA assignment/exam in
 * `docs/Knowladge/`. Where a mission is "inspired by" a real source pattern, that is
 * recorded in `originality` for traceability, not as a copy.
 */
export interface CurriculumMission {
  readonly id: string;
  readonly status: 'live' | 'designed';
  readonly versionScope: 'v1' | 'v2-future';
  readonly world: string;
  readonly district: string;
  readonly difficulty: Difficulty;
  readonly conceptId: string;
  readonly prerequisites: readonly string[];
  readonly title: string;
  readonly objective: string;
  readonly victoryCondition: string;
  readonly failureCondition: string;
  readonly hints: readonly string[];
  readonly visualizationTrigger: string;
  readonly xpReward: number;
  readonly creditsReward: number;
  readonly achievements: readonly string[];
  readonly estimatedMinutes: number;
  readonly questionType: QuestionTypeId;
  readonly format: QuestionFormatId;
  readonly originality: string;
  /** District-capstone signal consumed by the difficulty model — see difficulty-model.ts. */
  readonly isCapstone?: boolean;
  readonly variations?: readonly MissionVariation[];
}

export const MISSIONS: readonly CurriculumMission[] = [
  // ---------------------------------------------------------------- LIVE -----
  {
    id: 'toa.dfa-ends-01',
    status: 'live',
    versionScope: 'v1',
    world: 'Automata Academy',
    district: 'security-district',
    difficulty: 1,
    conceptId: 'dfa-fundamentals',
    prerequisites: [],
    title: 'Calibration',
    objective:
      'Trace a fixed DFA against a stream of binary strings and predict accept/reject before the tape finishes.',
    victoryCondition:
      'Engineer correctly predicts the accept/reject outcome for the required number of traced strings.',
    failureCondition: 'N/A — tutorial; no fail-state, only retries.',
    hints: [
      'Where does the machine start, and what does the first symbol do to it?',
      'Is the current state one of the accepting ones?',
      'What is the LAST symbol the string ends with — does that matter for this machine?',
    ],
    visualizationTrigger:
      'Always on — this tutorial IS the visualization, by design (onboarding exception to the 90/10 rule).',
    xpReward: 150,
    creditsReward: 0,
    achievements: ['First Contact'],
    estimatedMinutes: 4,
    questionType: 'string-membership',
    format: 'prediction',
    originality: 'Existing live mission; documented here for completeness, not redesigned.',
  },
  {
    id: 'toa.build.dfa-ends-01',
    status: 'live',
    versionScope: 'v1',
    world: 'Automata Academy',
    district: 'security-district',
    difficulty: 2,
    conceptId: 'dfa-language-design',
    prerequisites: ['toa.dfa-ends-01'],
    title: 'Perimeter Security',
    objective:
      'On a blank canvas, build a DFA that accepts exactly the binary strings ending in "01" — no automaton is given.',
    victoryCondition:
      'The constructed automaton is language-equivalent (via findDistinguishingString) to the reference solution.',
    failureCondition:
      'Submission is non-deterministic (build is blocked at edit-time) or language-inequivalent (counterexample shown, never the fix).',
    hints: [
      'How many different "states of suspicion" does the perimeter need to remember about the last couple of symbols it saw?',
      'If you are in your most-suspicious state and a "0" arrives, are you any closer to "01"?',
      'Try the string "010" by hand on your own machine before submitting.',
    ],
    visualizationTrigger:
      'Visualization hint tier only unlocks after two failed equivalence checks.',
    xpReward: 220,
    creditsReward: 60,
    achievements: ['Perimeter Engineer'],
    estimatedMinutes: 10,
    questionType: 'dfa-nfa-construction',
    format: 'interactive-builder',
    originality: 'Existing live mission; documented here for completeness, not redesigned.',
  },
  {
    id: 'toa.nfa-branching',
    status: 'live',
    versionScope: 'v1',
    world: 'Automata Academy',
    district: 'quantum-research-lab',
    difficulty: 2,
    conceptId: 'nfa-fundamentals',
    prerequisites: ['toa.build.dfa-ends-01'],
    title: 'Many Paths at Once',
    objective:
      'Watch a single NFA explore multiple branches in parallel on one input string and identify which branch (if any) survives to acceptance.',
    victoryCondition:
      'Engineer correctly identifies the surviving accepting branch for each presented string.',
    failureCondition: 'Misidentifies a dead branch as the accepting one, or vice versa.',
    hints: [
      'A branch with no transition for the current symbol does not error — what happens to it instead?',
      'Acceptance only needs ONE survivor. How many branches does the machine actually need to keep alive?',
    ],
    visualizationTrigger:
      'Branch visualization is the core mechanic here — an explicit, deliberate exception to "visualization last".',
    xpReward: 180,
    creditsReward: 60,
    achievements: ['Quantum Observer'],
    estimatedMinutes: 8,
    questionType: 'string-membership',
    format: 'simulation',
    originality: 'Existing live mission; documented here for completeness, not redesigned.',
  },
  {
    id: 'toa.nfa-to-dfa',
    status: 'live',
    versionScope: 'v1',
    world: 'Automata Academy',
    district: 'research-archive',
    difficulty: 3,
    conceptId: 'nfa-to-dfa-subset-construction',
    prerequisites: ['toa.nfa-branching'],
    title: 'NFA → DFA',
    objective:
      'Watch subset construction run step-by-step: every reachable SET of NFA states becomes one new DFA state, live.',
    victoryCondition:
      "Completing the guided playback through to the constructed DFA's final state.",
    failureCondition: 'N/A — spectacle/earned-reward mission, not a graded construction task.',
    hints: [],
    visualizationTrigger:
      'Always on — this IS the reward for completing the Quantum Research Lab district (an "earned spectacle", not a teaching tool).',
    xpReward: 250,
    creditsReward: 100,
    achievements: ['Determinism Forged'],
    estimatedMinutes: 6,
    questionType: 'nfa-determinization',
    format: 'conversion',
    originality: 'Existing live mission; documented here for completeness, not redesigned.',
  },

  // ------------------------------------------------------------ DESIGNED -----
  {
    id: 'toa.design.regex-construction-01',
    status: 'designed',
    versionScope: 'v1',
    world: 'Automata Academy',
    district: 'regex-workshop',
    difficulty: 2,
    conceptId: 'regular-expressions',
    prerequisites: ['toa.nfa-branching'],
    title: 'Pattern Forge',
    objective:
      'Given six original property descriptions over a binary signal (e.g. "contains no two consecutive 1s", "length is a multiple of 3"), write a regular expression for each.',
    victoryCondition:
      'Each submitted regex is language-equivalent to the reference regex (compared via NFA construction + equivalence, never by string-matching the regex text itself).',
    failureCondition:
      'Submitted regex accepts/rejects at least one counterexample string differently than the reference.',
    hints: [
      'Does this property describe something that must happen ONCE, or something that must NEVER happen across the whole string?',
      'Could you describe the "safe" prefix and the "safe" suffix separately, then glue them together?',
      'Star applies to whatever is immediately to its left — did you group the part you meant to repeat?',
    ],
    visualizationTrigger:
      'Unlocks an NFA-construction-from-regex animation after two failed equivalence checks on the same exercise.',
    xpReward: 200,
    creditsReward: 70,
    achievements: ['Pattern Whisperer'],
    estimatedMinutes: 12,
    questionType: 'regex-construction',
    format: 'construction',
    originality:
      'Inspired by the structural pattern of binary-string regex batteries (common across the genre, and confirmed live in the Sukkur IBA "Construct Regular Expression" assignment) — properties and wording rewritten from scratch.',
    variations: [
      { tier: 'easy', prompt: 'Strings that start with "1".', xpReward: 60 },
      { tier: 'medium', prompt: 'Strings with no two consecutive 0s.', xpReward: 200 },
      { tier: 'hard', prompt: 'Strings where every block of 1s has even length.', xpReward: 320 },
      {
        tier: 'boss',
        prompt: 'Strings that contain "101" as a substring exactly once.',
        xpReward: 500,
      },
      {
        tier: 'legend',
        prompt: 'Strings whose length mod 3 equals the count of "1"s mod 3.',
        xpReward: 800,
      },
      {
        tier: 'daily',
        prompt: 'A freshly seeded property drawn from the same generator family each day.',
        xpReward: 150,
      },
      {
        tier: 'infinite',
        prompt: 'Escalating random property batteries until the first wrong answer.',
        xpReward: 50,
      },
    ],
  },
  {
    id: 'toa.design.regex-to-dfa-01',
    status: 'designed',
    versionScope: 'v1',
    world: 'Automata Academy',
    district: 'regex-workshop',
    difficulty: 4,
    conceptId: 'regex-automata-equivalence',
    prerequisites: ['toa.design.regex-construction-01'],
    title: 'State Elimination Protocol',
    objective:
      'Given a small DFA, eliminate its intermediate states one at a time to derive an equivalent regular expression.',
    victoryCondition: 'Final regular expression is language-equivalent to the original DFA.',
    failureCondition:
      'Eliminating a state without correctly absorbing its self-loop into the surrounding edge expressions.',
    hints: [
      'Pick the state with the fewest connections to eliminate first — fewer edges to merge means fewer mistakes.',
      'Before deleting a state, does it have a transition back to itself? That has to fold into every path through it.',
    ],
    visualizationTrigger:
      'Visualization hint shows the generalized transition graph mid-elimination after one failed attempt.',
    xpReward: 280,
    creditsReward: 90,
    achievements: ['Reduction Specialist'],
    estimatedMinutes: 15,
    questionType: 'automaton-to-regex',
    format: 'conversion',
    originality:
      'Original 4-5 state DFA designed for this mission; algorithm is the standard Busch-RPI state-elimination method, applied to new material.',
  },
  {
    id: 'toa.design.moore-mealy-01',
    status: 'designed',
    versionScope: 'v2-future',
    world: 'Automata Academy',
    district: 'security-district',
    difficulty: 3,
    conceptId: 'moore-mealy-machines',
    prerequisites: ['toa.build.dfa-ends-01'],
    title: 'Signal Translator',
    objective:
      'Convert a given Moore machine (binary incrementer) into an equivalent Mealy machine with identical output behavior.',
    victoryCondition:
      'Output sequence of the submitted Mealy machine matches the reference Moore machine on all test input sequences.',
    failureCondition:
      'Output is off-by-one in timing (a classic symptom of misplacing where the output is attached — state vs. transition).',
    hints: [
      'In a Moore machine, when exactly is an output produced — on arrival at a state, or on the move between states?',
      'If two states agree on every outgoing transition, do they need separate states once that output moves onto the edge?',
    ],
    visualizationTrigger:
      'Side-by-side state-vs-edge output animation, unlocked after one failed conversion.',
    xpReward: 230,
    creditsReward: 75,
    achievements: ['Transducer Engineer'],
    estimatedMinutes: 12,
    questionType: 'moore-mealy-conversion',
    format: 'conversion',
    originality:
      'Inspired by the binary-increment Moore→Mealy exercise pattern confirmed live in the Sukkur IBA exam (Q4); machine redesigned from scratch.',
  },
  {
    id: 'toa.design.nfa-determinize-01',
    status: 'designed',
    versionScope: 'v1',
    world: 'Automata Academy',
    district: 'quantum-research-lab',
    difficulty: 3,
    conceptId: 'nfa-to-dfa-subset-construction',
    prerequisites: ['toa.nfa-branching'],
    title: 'Collapse the Superposition',
    objective:
      'Given a small ε-NFA, perform subset construction by hand: submit the DFA transition table, not just watch it animate.',
    victoryCondition:
      'Submitted transition table matches the reachable-subsets table computed from the reference NFA.',
    failureCondition:
      'A reachable subset is missing from the table, or ε-closure was not applied before recording a subset.',
    hints: [
      'Before reading any input symbol — does ε-closure already merge the start state with anything else?',
      'A subset only needs to be listed once even if you reach it by two different paths — did you create a duplicate?',
    ],
    visualizationTrigger:
      'Unlocks the live "toa.nfa-to-dfa" spectacle animation as its own visualization reward on completion.',
    xpReward: 260,
    creditsReward: 85,
    achievements: ['Determinization Apprentice'],
    estimatedMinutes: 14,
    questionType: 'nfa-determinization',
    format: 'completion',
    originality:
      'Teaching-focused companion to the existing toa.nfa-to-dfa spectacle: that mission shows the algorithm running; this one requires the player to execute it.',
  },
  {
    id: 'toa.design.dfa-minimization-01',
    status: 'designed',
    versionScope: 'v1',
    world: 'Automata Academy',
    district: 'security-district',
    difficulty: 3,
    conceptId: 'dfa-minimization',
    prerequisites: ['toa.build.dfa-ends-01'],
    title: 'Trim the Fat',
    objective:
      'Given a correct but redundant 7-state DFA, minimize it to its unique smallest equivalent form.',
    victoryCondition:
      'Submitted DFA is language-equivalent to the original AND has the minimum possible number of states for that language.',
    failureCondition:
      'Merging two states that are actually distinguishable (some string drives them to different accept/reject outcomes).',
    hints: [
      'Two states are safe to merge only if EVERY possible future string treats them identically. Have you checked every symbol, not just one?',
      'Start by separating accepting states from non-accepting ones — they can never merge with each other.',
    ],
    visualizationTrigger:
      'Table-filling algorithm animation, unlocked after one failed minimization attempt.',
    xpReward: 240,
    creditsReward: 80,
    achievements: ['Minimalist Engineer'],
    estimatedMinutes: 14,
    questionType: 'dfa-nfa-construction',
    format: 'optimization',
    originality:
      'Original 7-state DFA designed for this mission; concept added to the universal curriculum per PROMPT 04.6 global research (confirmed standard via Stanford CS154), not present in the ingested Sukkur IBA material.',
  },
  {
    id: 'toa.design.dfa-debug-01',
    status: 'designed',
    versionScope: 'v1',
    world: 'Automata Academy',
    district: 'security-district',
    difficulty: 2,
    conceptId: 'dfa-fundamentals',
    prerequisites: ['toa.dfa-ends-01'],
    title: 'Patch the Perimeter',
    objective:
      'Given a DFA that is almost correct for a stated language but has exactly one wrong transition, find and fix it.',
    victoryCondition:
      'The single incorrect transition is identified and corrected, and the resulting DFA is verified language-equivalent to the target.',
    failureCondition:
      'Changing a transition that was already correct, or missing the actual planted bug.',
    hints: [
      'Try a few short test strings by hand — which one gets the wrong verdict from this machine?',
      'Once you have a failing string, which single transition did it cross that a correct machine would not have taken?',
    ],
    visualizationTrigger:
      'Highlights the exact failing trace through the buggy machine after one failed diagnosis.',
    xpReward: 190,
    creditsReward: 55,
    achievements: [],
    estimatedMinutes: 9,
    questionType: 'dfa-nfa-construction',
    format: 'debugging',
    originality:
      'Original buggy DFA designed for this mission; format added per PROMPT 04.6 Phase 6 question-format expansion.',
  },
  {
    id: 'toa.design.dfa-completion-01',
    status: 'designed',
    versionScope: 'v1',
    world: 'Automata Academy',
    district: 'security-district',
    difficulty: 2,
    conceptId: 'dfa-fundamentals',
    prerequisites: ['toa.dfa-ends-01'],
    title: 'Finish the Blueprint',
    objective:
      'Given a DFA transition table with several cells left blank, fill in the missing transitions so the machine matches the stated language.',
    victoryCondition:
      'Every blank cell is filled correctly and the completed machine is verified language-equivalent to the target.',
    failureCondition:
      'At least one filled-in transition does not match the language, even if the others are correct.',
    hints: [
      'For each blank cell, what state were you in, and what does adding that one symbol need to mean for the language?',
      'Cross-check a completed row against a test string that is forced to pass through it.',
    ],
    visualizationTrigger:
      'Highlights which blank cells are still inconsistent with the target language after a failed submission.',
    xpReward: 170,
    creditsReward: 50,
    achievements: [],
    estimatedMinutes: 8,
    questionType: 'dfa-nfa-construction',
    format: 'completion',
    originality:
      'Original partial transition table designed for this mission; format added per PROMPT 04.6 Phase 6 question-format expansion.',
  },
  {
    id: 'toa.design.automaton-classification-daily',
    status: 'designed',
    versionScope: 'v1',
    world: 'Automata Academy',
    district: 'security-district',
    difficulty: 2,
    conceptId: 'nfa-fundamentals',
    prerequisites: ['toa.nfa-branching'],
    title: 'Daily Diagnostic',
    objective:
      'Complete a property table (start states, final states, edge labels, edges-per-state, determinism) across FA/NFA/Moore/Mealy by selecting from a fixed option bank per cell.',
    victoryCondition: 'All table cells match the correct property for their automaton family.',
    failureCondition: 'Any cell selects a property that does not hold for that automaton family.',
    hints: [
      'Which of these families is allowed to have zero start states, and which absolutely cannot?',
      'Determinism and "exactly one transition per symbol" are the same idea stated two ways — which families satisfy it?',
    ],
    visualizationTrigger:
      'Highlights the specific row that is wrong after a failed submission, never the correct value.',
    xpReward: 120,
    creditsReward: 40,
    achievements: [],
    estimatedMinutes: 6,
    questionType: 'automaton-classification',
    format: 'mcq',
    originality:
      "Directly inspired by the real Sukkur IBA exam's graded classification table (FA/TG/NFA/Moore/Mealy properties) flagged in the Phase 10 report of PROMPT 04.5 as an excellent recurring daily-mission template; option bank and table rebuilt from scratch as a reusable generator pattern rather than the original fixed table.",
    variations: [
      {
        tier: 'daily',
        prompt: 'A freshly shuffled property table each day, same five automaton families.',
        xpReward: 120,
      },
      {
        tier: 'infinite',
        prompt: 'One row at a time, escalating speed, until the first wrong cell.',
        xpReward: 30,
      },
    ],
  },
  {
    id: 'toa.design.regex-precedence-mcq-01',
    status: 'designed',
    versionScope: 'v1',
    world: 'Automata Academy',
    district: 'regex-workshop',
    difficulty: 1,
    conceptId: 'regular-expressions',
    prerequisites: ['toa.design.regex-construction-01'],
    title: 'Order of Operations',
    objective:
      'For each of several short regular expressions, choose which of four candidate languages it actually denotes.',
    victoryCondition: 'All multiple-choice selections match the correct denoted language.',
    failureCondition:
      'Any selection corresponds to a common precedence-confusion error (e.g. treating ab* as (ab)*).',
    hints: ['If you removed the star right now, exactly which part of the expression disappears?'],
    visualizationTrigger:
      'Highlights exactly which sub-expression the star/plus operator scopes over, after a wrong answer.',
    xpReward: 90,
    creditsReward: 25,
    achievements: [],
    estimatedMinutes: 5,
    questionType: 'regex-construction',
    format: 'mcq',
    originality:
      'Built directly from the regex-precedence-confusion misconception entry in misconceptions.ts; all expressions and distractor options original.',
  },
  {
    id: 'toa.design.grammar-derivation-01',
    status: 'designed',
    versionScope: 'v1',
    world: 'Automata Academy',
    district: 'grammar-tower',
    difficulty: 2,
    conceptId: 'grammars-general',
    prerequisites: ['toa.build.dfa-ends-01'],
    title: 'First Ascent',
    objective:
      'Given an original 3-production grammar, produce a leftmost derivation of a target string.',
    victoryCondition:
      'Derivation is valid (every step applies an existing production) and terminates at the target string.',
    failureCondition:
      'Substituting a variable that is not the leftmost one remaining in the sentential form.',
    hints: [
      'Scan the current sentential form left to right — what is the FIRST symbol that is still a variable?',
      'A production can only be applied to a variable that matches its left side exactly.',
    ],
    visualizationTrigger:
      'Sentential-form-by-sentential-form playback, unlocked after one failed derivation.',
    xpReward: 180,
    creditsReward: 50,
    achievements: ['Tower Climber'],
    estimatedMinutes: 8,
    questionType: 'grammar-derivation',
    format: 'construction',
    originality:
      'Original grammar and target string, structurally inspired by the recursive aSb/AB-style examples common to the genre.',
  },
  {
    id: 'toa.design.regular-grammar-01',
    status: 'designed',
    versionScope: 'v1',
    world: 'Automata Academy',
    district: 'grammar-tower',
    difficulty: 4,
    conceptId: 'regular-grammars',
    prerequisites: ['toa.design.grammar-derivation-01', 'toa.build.dfa-ends-01'],
    title: 'Right and Left of Center',
    objective:
      'Given a right-linear grammar, construct the equivalent NFA whose states are exactly the grammar variables.',
    victoryCondition:
      'Constructed NFA accepts the same language as the grammar (verified via equivalence, not by inspection).',
    failureCondition:
      'Forgetting the special final state required for productions whose right side is terminals-only with no trailing variable.',
    hints: [
      'Every variable becomes a state. What kind of production needs a brand-new "done" state on its right side?',
      'A production with k terminals before a variable needs how many intermediate states between them?',
    ],
    visualizationTrigger: 'Animates the variable-to-state mapping after one failed construction.',
    xpReward: 300,
    creditsReward: 95,
    achievements: ['Grammar Architect'],
    estimatedMinutes: 16,
    questionType: 'grammar-construction',
    format: 'conversion',
    originality:
      'Original right-linear grammar, applying the standard Busch-RPI variable-as-state construction to new material.',
  },
  {
    id: 'toa.design.cfg-parse-tree-01',
    status: 'designed',
    versionScope: 'v1',
    world: 'Automata Academy',
    district: 'grammar-tower',
    difficulty: 3,
    conceptId: 'context-free-grammars',
    prerequisites: ['toa.design.grammar-derivation-01'],
    title: 'Branching Ascent',
    objective: 'Given an original CFG, construct the derivation (parse) tree for a target string.',
    victoryCondition:
      "Submitted tree's yield (leaves read left to right) equals the target string, and every internal node's children match a real production.",
    failureCondition:
      'Tree yield does not match the target string, or a node has children that do not correspond to any production right-hand side.',
    hints: [
      'What does every internal node in this tree actually represent — a variable, or the string it eventually became?',
      'Read the leaves of your tree left to right. Does that match the target string exactly, including length?',
    ],
    visualizationTrigger: 'Tree-construction animation unlocked after one failed submission.',
    xpReward: 220,
    creditsReward: 65,
    achievements: [],
    estimatedMinutes: 12,
    questionType: 'parse-tree-construction',
    format: 'construction',
    originality: 'Original grammar and target string.',
  },
  {
    id: 'toa.design.cfg-language-description-01',
    status: 'designed',
    versionScope: 'v1',
    world: 'Automata Academy',
    district: 'grammar-tower',
    difficulty: 3,
    conceptId: 'context-free-grammars',
    prerequisites: ['toa.design.cfg-parse-tree-01'],
    title: 'Reverse Engineering',
    objective: 'Given an original CFG with 2-3 productions, describe L(G) in set-builder notation.',
    victoryCondition:
      'Submitted set-builder description is verified equivalent by sampling many generated strings against the submitted predicate.',
    failureCondition:
      'Description matches some but not all strings the grammar actually generates (verified by counterexample sampling).',
    hints: [
      'Derive three or four short strings by hand first. What do they all have in common?',
      'Does every production keep some kind of count balanced, or always add symbols in a fixed ratio?',
    ],
    visualizationTrigger:
      'Shows a sample of 8 generated strings as a hint after one failed attempt.',
    xpReward: 240,
    creditsReward: 70,
    achievements: [],
    estimatedMinutes: 10,
    questionType: 'grammar-language-description',
    format: 'theory',
    originality: 'Original grammar.',
  },
  {
    id: 'toa.design.cfg-ambiguity-01',
    status: 'designed',
    versionScope: 'v1',
    world: 'Automata Academy',
    district: 'grammar-tower',
    difficulty: 4,
    conceptId: 'cfg-ambiguity',
    prerequisites: ['toa.design.cfg-parse-tree-01'],
    title: 'Tower Boss: The Two Trees',
    objective:
      'Given an original ambiguous CFG, find one witness string and exhibit two distinct, valid parse trees for it.',
    victoryCondition:
      'Both submitted trees yield the same target string, both are valid under the grammar, and the trees are structurally distinct.',
    failureCondition:
      'The two "trees" submitted are actually the same tree drawn differently, or one is invalid under the grammar.',
    hints: [
      'Try a short string first — ambiguity often shows up even at length 2 or 3 if the grammar is genuinely ambiguous.',
      'Two different derivation ORDERS of the same tree are not what you are looking for — the trees themselves must branch differently.',
    ],
    visualizationTrigger:
      'Reveals one (not both) of the two trees as a hint after two failed attempts.',
    xpReward: 450,
    creditsReward: 150,
    achievements: ['Ambiguity Hunter'],
    estimatedMinutes: 20,
    questionType: 'ambiguity-proof',
    format: 'proof',
    isCapstone: true,
    originality:
      'Inspired by the structural pattern of the ambiguity-proof exercises confirmed live in Assignment_1 (Q7–Q9); grammar rewritten from scratch — boss-tier, district-capstone mission.',
    variations: [
      {
        tier: 'easy',
        prompt: 'A 2-production grammar with one obviously ambiguous short string.',
        xpReward: 200,
      },
      {
        tier: 'medium',
        prompt: 'A 3-production grammar requiring a length-4 witness string.',
        xpReward: 350,
      },
      {
        tier: 'hard',
        prompt: 'A 4-production grammar where the shortest witness has length 5+.',
        xpReward: 450,
      },
      {
        tier: 'boss',
        prompt: 'The Tower Boss grammar: ambiguity hidden behind a recursive self-reference.',
        xpReward: 600,
      },
      {
        tier: 'legend',
        prompt:
          'Prove ambiguity AND propose an equivalent unambiguous grammar for the same language.',
        xpReward: 900,
      },
      {
        tier: 'daily',
        prompt: 'A freshly seeded small ambiguous grammar each day.',
        xpReward: 250,
      },
      {
        tier: 'infinite',
        prompt: 'Escalating grammars until the first failed ambiguity proof.',
        xpReward: 80,
      },
    ],
  },
  {
    id: 'toa.design.cfg-simplify-01',
    status: 'designed',
    versionScope: 'v1',
    world: 'Automata Academy',
    district: 'grammar-tower',
    difficulty: 4,
    conceptId: 'cfg-simplification',
    prerequisites: ['toa.design.cfg-parse-tree-01'],
    title: 'Strip the Dead Weight',
    objective:
      'Given an original CFG containing useless productions and a nullable variable, simplify it without changing L(G).',
    victoryCondition:
      'Simplified grammar generates exactly the same language as the original (verified by equivalence sampling), with no useless symbols and no ε-productions except possibly on the start symbol.',
    failureCondition:
      'A production using the removed nullable variable was not updated with its ε-skipping counterpart.',
    hints: [
      'A symbol is useless if no derivation from the start variable ever reaches it — trace every variable back to S.',
      'If a variable can produce ε, what extra version of every production that contains it do you now need?',
    ],
    visualizationTrigger:
      'Highlights unreachable/non-generating symbols in the grammar graph after one failed attempt.',
    xpReward: 320,
    creditsReward: 100,
    achievements: [],
    estimatedMinutes: 15,
    questionType: 'grammar-simplification',
    format: 'optimization',
    originality:
      'Inspired by the simplification exercise pattern confirmed live in Assignment_1 (Q10–Q11); grammar rewritten from scratch.',
  },
  {
    id: 'toa.design.cfg-cnf-01',
    status: 'designed',
    versionScope: 'v1',
    world: 'Automata Academy',
    district: 'grammar-tower',
    difficulty: 4,
    conceptId: 'chomsky-normal-form',
    prerequisites: ['toa.design.cfg-simplify-01'],
    title: 'Tower Boss: Normal Form',
    objective:
      'Convert an original, already-simplified CFG into an equivalent grammar in Chomsky Normal Form.',
    victoryCondition:
      'Every production in the submitted grammar is of the form A → BC or A → a, and the language is unchanged.',
    failureCondition:
      "Leaving a 'mixed' production (one terminal plus one variable on the right side), or a right side longer than two symbols.",
    hints: [
      'A production with three or more symbols on the right needs new variables introduced to break it into pairs — how many new variables does length k need?',
      'A terminal hiding inside a longer production needs its own one-variable substitute first.',
    ],
    visualizationTrigger:
      'Shows the substitution-variable naming scheme as a hint after one failed attempt.',
    xpReward: 400,
    creditsReward: 130,
    achievements: ['Normal Form Master'],
    estimatedMinutes: 18,
    questionType: 'cnf-conversion',
    format: 'conversion',
    isCapstone: true,
    originality:
      'Inspired by the CNF-conversion exercise pattern confirmed live in Assignment_1 (Q12–Q13); grammar rewritten from scratch — boss-tier, district-capstone mission.',
    variations: [
      {
        tier: 'easy',
        prompt: 'A 3-production grammar needing only terminal substitution, no length-breaking.',
        xpReward: 250,
      },
      {
        tier: 'medium',
        prompt: 'A 4-production grammar needing one length-breaking substitution.',
        xpReward: 380,
      },
      {
        tier: 'hard',
        prompt: 'A grammar with a right side of length 4, needing chained substitutions.',
        xpReward: 480,
      },
      {
        tier: 'boss',
        prompt: 'The Tower Boss grammar: mixed terminal/variable productions throughout.',
        xpReward: 600,
      },
      {
        tier: 'legend',
        prompt:
          'Convert to CNF AND report the exact number of new variables introduced, with justification.',
        xpReward: 950,
      },
      {
        tier: 'daily',
        prompt: 'A freshly seeded grammar needing CNF conversion each day.',
        xpReward: 280,
      },
      {
        tier: 'infinite',
        prompt: 'Escalating grammars until the first invalid CNF submission.',
        xpReward: 90,
      },
    ],
  },
  {
    id: 'toa.design.pumping-lemma-01',
    status: 'designed',
    versionScope: 'v1',
    world: 'Automata Academy',
    district: 'pumping-dungeon',
    difficulty: 5,
    conceptId: 'regular-language-properties',
    prerequisites: ['toa.design.regex-construction-01'],
    title: 'Dungeon Boss: The Unpumpable',
    objective:
      'Given an original language description, decide whether it is regular — and back the decision with a rigorous pumping-lemma (or closure-property) argument.',
    victoryCondition:
      'Submitted proof correctly identifies regular vs. non-regular AND the argument structure is sound (correct pumping length reasoning or correct closure-property chain).',
    failureCondition:
      'Pumped substring falls outside the guaranteed prefix, or the post-pump string is checked against the wrong condition.',
    hints: [
      'Is there a fixed-size DFA that could possibly track the quantity this language depends on, no matter how large the input gets?',
      'If you suspect non-regularity: which substring, when pumped, breaks the defining condition — and is that substring guaranteed to exist within the pumping length?',
    ],
    visualizationTrigger:
      'Visualization is deliberately withheld on this one — the proof must stand on its own; an annotated worked example unlocks only after submission, win or lose.',
    xpReward: 600,
    creditsReward: 200,
    achievements: ['Pumping Lemma Survivor', 'Academy Theorist'],
    estimatedMinutes: 25,
    questionType: 'regularity-proof',
    format: 'proof',
    isCapstone: true,
    originality:
      'Inspired by the regularity-proof exercise pattern confirmed live in Assignment_1 (Q1, Q15–Q17); language rewritten from scratch — legend-tier, district-capstone mission. The underlying lecture deck for this topic ("9 - Properties RL.ppt") could not be text-extracted; see docs/curriculum-ingestion-report.md.',
    variations: [
      { tier: 'easy', prompt: 'Prove {0ⁱ1ⁱ : i ≥ 0} is not regular.', xpReward: 250 },
      {
        tier: 'medium',
        prompt: 'Prove the set of binary strings with equal 0s and 1s is not regular.',
        xpReward: 400,
      },
      { tier: 'hard', prompt: 'Prove or disprove: {0ⁱ1ʲ : i ≠ j} is regular.', xpReward: 550 },
      { tier: 'boss', prompt: 'Prove {wwᴿ : w ∈ {0,1}*} is not regular.', xpReward: 600 },
      { tier: 'legend', prompt: 'Prove {0ⁱ1ʲ0ᵏ : k = i + j} is not regular.', xpReward: 900 },
      {
        tier: 'daily',
        prompt: 'A freshly seeded aⁱbʲ-style relation, regular or not, decide and prove.',
        xpReward: 300,
      },
      {
        tier: 'infinite',
        prompt: 'Escalating proof battery until the first unsound argument.',
        xpReward: 100,
      },
    ],
  },
  {
    id: 'toa.design.pda-construction-01',
    status: 'designed',
    versionScope: 'v1',
    world: 'Automata Academy',
    district: 'stack-reactor',
    difficulty: 4,
    conceptId: 'pushdown-automata',
    prerequisites: ['toa.design.cfg-parse-tree-01'],
    title: 'First Stack',
    objective:
      'Given an original language requiring an unbounded count (e.g. {aⁱbʲcᵏ : k = i + j}), construct a pushdown automaton that accepts it.',
    victoryCondition:
      'Constructed PDA accepts exactly the target language (verified by simulation against a generated test-string battery, accept and reject cases both).',
    failureCondition:
      'PDA accepts a string outside the language, or rejects one inside it, on the test battery.',
    hints: [
      'What do you need to count while reading the FIRST part of the string, and what do you need to do with that count while reading the rest?',
      'Does the stack need to grow during the part you are counting up, or during the part you are counting down?',
    ],
    visualizationTrigger:
      'Stack-content animation alongside the state diagram, unlocked after one failed simulation run.',
    xpReward: 350,
    creditsReward: 110,
    achievements: ['Stack Reactor Online'],
    estimatedMinutes: 18,
    questionType: 'pda-construction',
    format: 'construction',
    originality:
      'Inspired by the PDA-construction exercise pattern confirmed live in Assignment_1 (Q14); language rewritten from scratch. NOTE: no PDA lecture deck exists anywhere in the source material — this mission is fully designed ahead of the underlying lecture content; see docs/curriculum-ingestion-report.md for the gap.',
  },
];

/** Adapts the mission database to `@arc/engine-game`'s generic unlock-node shape. */
export function toMissionUnlockNodes(): readonly UnlockNode[] {
  return MISSIONS.map((m) => ({ id: m.id, dependsOn: m.prerequisites }));
}

export function missionById(id: string): CurriculumMission | undefined {
  return MISSIONS.find((m) => m.id === id);
}

export function missionsForConcept(conceptId: string): readonly CurriculumMission[] {
  return MISSIONS.filter((m) => m.conceptId === conceptId);
}

export function liveMissions(): readonly CurriculumMission[] {
  return MISSIONS.filter((m) => m.status === 'live');
}

export function designedMissions(): readonly CurriculumMission[] {
  return MISSIONS.filter((m) => m.status === 'designed');
}

export function v1Missions(): readonly CurriculumMission[] {
  return MISSIONS.filter((m) => m.versionScope === 'v1');
}
