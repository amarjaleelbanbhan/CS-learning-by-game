import type { UnlockNode } from '@arc/engine-game';

/**
 * UNIVERSAL Theory of Automata knowledge graph — university-agnostic by construction.
 *
 * This graph does not encode "Sukkur IBA's course" — it encodes the subject itself,
 * normalized against the standard topic sequencing shared by MIT 18.404/6.045, Stanford
 * CS154, and NPTEL's Theory of Computation course (topic NAMES and ORDERING only,
 * confirmed via their public syllabus pages — see `docs/curriculum-expansion-report.md`
 * for the exact sources; no copyrighted lecture content was copied). Individual
 * universities are mapped ONTO this graph in `university-mappings.ts`, not the other way
 * around — the engine never depends on any one school's syllabus.
 *
 * `scope` replaces a manually-picked "is this advanced" judgment call with an explicit,
 * auditable category:
 *  - 'v1'                — in the current campaign's scope.
 *  - 'v2-future'          — a real ToA topic, deliberately deferred (PROMPT 04.6 Phase 9).
 *  - 'advanced-optional'  — correct and interesting, but not required by any mainstream
 *                           undergraduate ToA course; lowest priority for future work.
 *
 * Difficulty is NEVER stored here — see `difficulty-model.ts`. A concept's difficulty
 * tier is always a computed function of `complexityFactors` plus the concept's depth in
 * this very graph, so re-ordering prerequisites automatically re-calibrates difficulty.
 */
export interface ConceptComplexityFactors {
  /** 0–5: how large/intricate are the structures (states, productions, stack alphabet) involved. */
  readonly structuralSize?: number;
  /** 0–5: how much does correctness depend on considering multiple simultaneous possibilities. */
  readonly branchingFactor?: number;
  /** 0–5: how rigorous/multi-step is a typical proof for this concept. */
  readonly proofComplexity?: number;
  /** 0–5: how much original construction (not just analysis) does mastering this require. */
  readonly constructionEffort?: number;
  /** 0–5: how many distinct reasoning steps does a typical problem require, end to end. */
  readonly reasoningSteps?: number;
}

export interface CurriculumConcept {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly prerequisites: readonly string[];
  /** Concepts that illuminate this one without being a hard prerequisite (cross-links, not edges). */
  readonly relatedConcepts: readonly string[];
  readonly estimatedStudyMinutes: number;
  readonly skillsTested: readonly string[];
  /** What mastering this concept makes possible next — the forward-looking counterpart to prerequisites. */
  readonly skillsUnlocked: readonly string[];
  readonly visualizationAvailable: boolean;
  readonly complexityFactors: ConceptComplexityFactors;
  readonly sourceDocs: readonly string[];
  readonly scope: 'v1' | 'v2-future' | 'advanced-optional';
  readonly scopeReason?: string;
}

export const CONCEPTS: readonly CurriculumConcept[] = [
  {
    id: 'mathematical-preliminaries',
    title: 'Sets, Relations & Induction',
    description:
      'Set representations, Cartesian product, and induction proofs over trees/recursive structures — the toolbox every later proof borrows from.',
    prerequisites: [],
    relatedConcepts: [],
    estimatedStudyMinutes: 30,
    skillsTested: ['set-notation', 'cartesian-product', 'proof-by-induction'],
    skillsUnlocked: ['reading-set-builder-language-definitions', 'following-inductive-proofs'],
    visualizationAvailable: false,
    complexityFactors: { proofComplexity: 1, reasoningSteps: 1 },
    sourceDocs: ['3 - Mathematical Preliminaries.ppt (partial recovery)'],
    scope: 'v1',
  },
  {
    id: 'languages-strings-alphabets',
    title: 'Alphabets, Strings & Languages',
    description:
      'A language is just a set of strings over an alphabet. Establishes |Σ|, Σ*, concatenation, length, and reversal before any machine exists.',
    prerequisites: ['mathematical-preliminaries'],
    relatedConcepts: ['language-set-operations'],
    estimatedStudyMinutes: 25,
    skillsTested: ['string-operations', 'language-as-a-set'],
    skillsUnlocked: ['reasoning-about-languages-without-a-machine'],
    visualizationAvailable: false,
    complexityFactors: { reasoningSteps: 1 },
    sourceDocs: ['4 - Languages.pdf'],
    scope: 'v1',
  },
  {
    id: 'language-set-operations',
    title: 'Operations on Languages',
    description:
      'Union, concatenation, Kleene star, complement, and reverse defined directly on languages — the operations every closure proof later reasons about.',
    prerequisites: ['languages-strings-alphabets'],
    relatedConcepts: ['regular-language-properties'],
    estimatedStudyMinutes: 25,
    skillsTested: ['union', 'concatenation', 'kleene-star', 'complement', 'reverse'],
    skillsUnlocked: ['closure-property-reasoning'],
    visualizationAvailable: false,
    complexityFactors: { reasoningSteps: 1 },
    sourceDocs: ['4 - Languages.pdf'],
    scope: 'v1',
  },
  {
    id: 'dfa-fundamentals',
    title: 'Deterministic Finite Automata',
    description:
      'Exactly one transition per symbol per state. The acceptance/rejection definition that every later automaton variant either keeps or deliberately relaxes.',
    prerequisites: ['language-set-operations'],
    relatedConcepts: ['nfa-fundamentals'],
    estimatedStudyMinutes: 35,
    skillsTested: ['state-diagrams', 'transition-functions', 'acceptance'],
    skillsUnlocked: ['simulating-any-finite-automaton-by-hand'],
    visualizationAvailable: true,
    complexityFactors: { structuralSize: 1, reasoningSteps: 2 },
    sourceDocs: ['6 - DFA and RL (1).pdf'],
    scope: 'v1',
  },
  {
    id: 'dfa-language-design',
    title: 'Designing DFAs for a Target Language',
    description:
      'Going from an informal language description ("ends in 01", "divisible by 3") to a concrete, minimal state machine — the core construction skill, not just the definition.',
    prerequisites: ['dfa-fundamentals'],
    relatedConcepts: ['dfa-minimization'],
    estimatedStudyMinutes: 40,
    skillsTested: ['state-minimality', 'invariant-design'],
    skillsUnlocked: ['translating-an-informal-spec-into-a-formal-machine'],
    visualizationAvailable: true,
    complexityFactors: { structuralSize: 2, constructionEffort: 2, reasoningSteps: 3 },
    sourceDocs: ['6 - DFA and RL (1).pdf'],
    scope: 'v1',
  },
  {
    id: 'dfa-minimization',
    title: 'DFA Minimization',
    description:
      'Two DFAs can accept the same language with wildly different state counts. Minimization finds the unique smallest equivalent DFA by merging indistinguishable states.',
    prerequisites: ['dfa-fundamentals'],
    relatedConcepts: ['dfa-language-design', 'myhill-nerode-theorem'],
    estimatedStudyMinutes: 35,
    skillsTested: ['state-equivalence', 'table-filling-algorithm'],
    skillsUnlocked: ['recognizing-redundant-states', 'myhill-nerode-readiness'],
    visualizationAvailable: true,
    complexityFactors: { structuralSize: 2, constructionEffort: 2, reasoningSteps: 3 },
    sourceDocs: [
      "gap: no lecture deck found in docs/Knowladge — added per PROMPT 04.6 global research (confirmed as a standard topic via Stanford CS154's public syllabus, paired with Myhill-Nerode)",
    ],
    scope: 'v1',
    scopeReason:
      "Confirmed-standard topic absent from the ingested course material; added to make the engine university-agnostic rather than dependent on one syllabus's gaps.",
  },
  {
    id: 'nfa-fundamentals',
    title: 'Nondeterministic Finite Automata',
    description:
      'Multiple (or zero) transitions per symbol. A string is accepted if ANY branch reaches an accepting state — acceptance becomes existential, not deterministic.',
    prerequisites: ['dfa-fundamentals'],
    relatedConcepts: ['epsilon-transitions'],
    estimatedStudyMinutes: 35,
    skillsTested: ['nondeterminism', 'branching-acceptance'],
    skillsUnlocked: ['simulating-multiple-simultaneous-computations'],
    visualizationAvailable: true,
    complexityFactors: { structuralSize: 2, branchingFactor: 2, reasoningSteps: 2 },
    sourceDocs: ['7 - NFA.pdf'],
    scope: 'v1',
  },
  {
    id: 'epsilon-transitions',
    title: 'Epsilon (ε) Transitions',
    description:
      'A transition that consumes no input symbol. Computing ε-closure correctly is the single most common source of NFA simulation bugs.',
    prerequisites: ['nfa-fundamentals'],
    relatedConcepts: ['nfa-to-dfa-subset-construction'],
    estimatedStudyMinutes: 30,
    skillsTested: ['epsilon-closure', 'free-moves'],
    skillsUnlocked: ['handling-epsilon-in-subset-construction'],
    visualizationAvailable: true,
    complexityFactors: { structuralSize: 2, branchingFactor: 2, reasoningSteps: 3 },
    sourceDocs: ['7 - NFA.pdf'],
    scope: 'v1',
  },
  {
    id: 'nfa-to-dfa-subset-construction',
    title: 'NFA → DFA: Subset Construction',
    description:
      'Every NFA state becomes a SET of NFA states in the new DFA. Proves NFAs and DFAs accept exactly the same class of languages despite looking structurally different.',
    prerequisites: ['epsilon-transitions'],
    relatedConcepts: ['dfa-minimization'],
    estimatedStudyMinutes: 45,
    skillsTested: ['powerset-states', 'determinization', 'equivalence-proof'],
    skillsUnlocked: ['converting-freely-between-nfa-and-dfa-representations'],
    visualizationAvailable: true,
    complexityFactors: {
      structuralSize: 3,
      branchingFactor: 3,
      constructionEffort: 3,
      reasoningSteps: 4,
    },
    sourceDocs: ['8 - NFA and RL (1).pdf'],
    scope: 'v1',
  },
  {
    id: 'moore-mealy-machines',
    title: 'Moore & Mealy Machines',
    description:
      'Finite automata that produce output, not just accept/reject. Moore machines emit output per-state; Mealy machines emit output per-transition — converting between them is a standard exam skill.',
    prerequisites: ['dfa-fundamentals'],
    relatedConcepts: [],
    estimatedStudyMinutes: 30,
    skillsTested: ['output-functions', 'transducer-conversion'],
    skillsUnlocked: ['modeling-automata-that-produce-output'],
    visualizationAvailable: true,
    complexityFactors: { structuralSize: 2, constructionEffort: 2, reasoningSteps: 2 },
    sourceDocs: ['gap: no lecture deck found — confirmed taught via Sukkur IBA exam material (Q4)'],
    scope: 'v2-future',
    scopeReason:
      'Confirmed taught at the source university, but PROMPT 04.6 Phase 9 explicitly defers Moore/Mealy machines to Version 2 of the universal campaign. The already-designed mission for this concept is kept (see missions.ts versionScope) but excluded from V1 campaign counts.',
  },
  {
    id: 'regular-expressions',
    title: 'Regular Expressions',
    description:
      'A compact algebraic notation (union +, concatenation ·, star *) for describing exactly the regular languages — the third standard representation alongside DFA and NFA.',
    prerequisites: ['nfa-fundamentals'],
    relatedConcepts: ['regex-automata-equivalence'],
    estimatedStudyMinutes: 35,
    skillsTested: ['regex-syntax', 'regex-semantics'],
    skillsUnlocked: ['describing-a-language-without-drawing-a-machine'],
    visualizationAvailable: true,
    complexityFactors: { constructionEffort: 2, reasoningSteps: 3 },
    sourceDocs: ['10 - RE & RL.pdf'],
    scope: 'v1',
  },
  {
    id: 'regex-automata-equivalence',
    title: 'Regex ↔ Automata: State Elimination',
    description:
      'Two-directional proof: any regex compiles to an NFA (induction on regex structure), and any DFA/NFA reduces to a regex by eliminating states from a generalized transition graph one at a time.',
    prerequisites: ['regular-expressions', 'nfa-to-dfa-subset-construction'],
    relatedConcepts: [],
    estimatedStudyMinutes: 45,
    skillsTested: ['generalized-transition-graphs', 'state-elimination'],
    skillsUnlocked: ['proving-the-three-standard-representations-equivalent'],
    visualizationAvailable: true,
    complexityFactors: {
      structuralSize: 3,
      constructionEffort: 3,
      proofComplexity: 2,
      reasoningSteps: 4,
    },
    sourceDocs: ['10 - RE & RL.pdf'],
    scope: 'v1',
  },
  {
    id: 'regular-language-properties',
    title: 'Closure Properties & the Pumping Lemma',
    description:
      'Regular languages are closed under union/concat/star/complement/intersection — and the pumping lemma is the standard tool for proving a language is NOT regular.',
    prerequisites: ['dfa-fundamentals', 'regular-expressions'],
    relatedConcepts: ['language-set-operations'],
    estimatedStudyMinutes: 50,
    skillsTested: ['pumping-lemma', 'closure-proofs', 'non-regularity-proofs'],
    skillsUnlocked: ['proving-impossibility-not-just-constructing-examples'],
    visualizationAvailable: false,
    complexityFactors: { proofComplexity: 4, reasoningSteps: 5 },
    sourceDocs: [
      'gap: "9 - Properties RL [Autosaved].ppt" is diagram-only, no text recoverable — confirmed taught via Assignment_1 Q1, Q15–17 (regularity/non-regularity proofs)',
    ],
    scope: 'v1',
  },
  {
    id: 'grammars-general',
    title: 'Grammars & Derivations',
    description:
      'A grammar generates strings via production rules rather than accepting them via a machine — the generative dual of everything done so far with automata.',
    prerequisites: ['languages-strings-alphabets'],
    relatedConcepts: ['context-free-grammars'],
    estimatedStudyMinutes: 30,
    skillsTested: ['production-rules', 'derivations', 'sentential-forms'],
    skillsUnlocked: ['thinking-generatively-instead-of-only-accept-reject'],
    visualizationAvailable: false,
    complexityFactors: { reasoningSteps: 2 },
    sourceDocs: ['11 - Grammars.pdf'],
    scope: 'v1',
  },
  {
    id: 'regular-grammars',
    title: 'Regular Grammars',
    description:
      'Right-linear and left-linear grammars generate exactly the regular languages — a third equivalence proof (grammar ↔ automaton) using the same NFA-construction idea as subset construction.',
    prerequisites: ['grammars-general', 'dfa-fundamentals'],
    relatedConcepts: ['nfa-to-dfa-subset-construction'],
    estimatedStudyMinutes: 40,
    skillsTested: ['right-linear-grammars', 'left-linear-grammars', 'grammar-automaton-conversion'],
    skillsUnlocked: ['recognizing-regularity-from-grammar-shape-alone'],
    visualizationAvailable: true,
    complexityFactors: {
      structuralSize: 2,
      constructionEffort: 3,
      proofComplexity: 2,
      reasoningSteps: 4,
    },
    sourceDocs: ['11 - Grammars.pdf'],
    scope: 'v1',
  },
  {
    id: 'context-free-grammars',
    title: 'Context-Free Grammars',
    description:
      'Grammars whose left side is always a single variable, with no further restriction on the right side — generates a strictly larger class of languages than regular grammars (e.g. {aⁿbⁿ}, {wwᴿ}).',
    prerequisites: ['grammars-general'],
    relatedConcepts: ['pushdown-automata'],
    estimatedStudyMinutes: 35,
    skillsTested: ['cfg-derivations', 'leftmost-rightmost-derivation', 'derivation-trees'],
    skillsUnlocked: ['expressing-recursive-and-nested-structure-as-a-grammar'],
    visualizationAvailable: true,
    complexityFactors: { structuralSize: 2, reasoningSteps: 3 },
    sourceDocs: ['16 - CFG.pdf'],
    scope: 'v1',
  },
  {
    id: 'cfg-ambiguity',
    title: 'CFG Ambiguity',
    description:
      'A grammar is ambiguous if some string has two distinct derivation trees. Proving ambiguity means exhibiting two such trees for one witness string — confirmed as a recurring exam/assignment question.',
    prerequisites: ['context-free-grammars'],
    relatedConcepts: [],
    estimatedStudyMinutes: 40,
    skillsTested: ['ambiguity-proofs', 'multiple-parse-trees'],
    skillsUnlocked: ['recognizing-when-a-grammar-needs-rewriting-for-parsing'],
    visualizationAvailable: true,
    complexityFactors: { proofComplexity: 3, reasoningSteps: 4 },
    sourceDocs: ['16 - CFG.pdf', 'Assignment_1 _TOA-CFG.doc (Q7–Q9)'],
    scope: 'v1',
  },
  {
    id: 'cfg-simplification',
    title: 'Grammar Simplification',
    description:
      'Removing useless terminals/productions and eliminating ε-productions without changing the generated language — required groundwork before Chomsky Normal Form.',
    prerequisites: ['context-free-grammars'],
    relatedConcepts: ['chomsky-normal-form'],
    estimatedStudyMinutes: 40,
    skillsTested: ['useless-symbol-removal', 'nullable-variable-removal'],
    skillsUnlocked: ['cnf-readiness'],
    visualizationAvailable: true,
    complexityFactors: { structuralSize: 2, constructionEffort: 3, reasoningSteps: 3 },
    sourceDocs: ['Assignment_1 _TOA-CFG.doc (Q10–Q11)'],
    scope: 'v1',
  },
  {
    id: 'chomsky-normal-form',
    title: 'Chomsky Normal Form',
    description:
      'Every production restricted to A → BC or A → a. A standard normalization that later enables CYK-style parsing algorithms (flagged advanced-optional, not yet covered here).',
    prerequisites: ['cfg-simplification'],
    relatedConcepts: [],
    estimatedStudyMinutes: 45,
    skillsTested: ['cnf-conversion'],
    skillsUnlocked: ['parsing-algorithm-readiness'],
    visualizationAvailable: true,
    complexityFactors: { structuralSize: 3, constructionEffort: 4, reasoningSteps: 4 },
    sourceDocs: ['Assignment_1 _TOA-CFG.doc (Q12–Q13)'],
    scope: 'v1',
  },
  {
    id: 'pushdown-automata',
    title: 'Pushdown Automata',
    description:
      'A finite automaton plus an unbounded stack — accepts exactly the context-free languages. Referenced by name in the assignment (PDA construction for {aⁿbᵒcⁿ}-style languages) but no PDA lecture deck exists in the source material yet.',
    prerequisites: ['context-free-grammars'],
    relatedConcepts: ['turing-machines'],
    estimatedStudyMinutes: 45,
    skillsTested: ['stack-based-acceptance', 'pda-construction'],
    skillsUnlocked: ['unbounded-memory-machine-design'],
    visualizationAvailable: true,
    complexityFactors: { structuralSize: 3, constructionEffort: 3, reasoningSteps: 4 },
    sourceDocs: [
      'gap: no lecture deck found at all — confirmed assigned via Assignment_1 Q14, Q15c, Q18c/d/e',
    ],
    scope: 'v1',
  },

  // ----------------------------------------------------- v2-future / advanced -----
  {
    id: 'myhill-nerode-theorem',
    title: 'Myhill–Nerode Theorem',
    description:
      'A language is regular iff it induces only finitely many equivalence classes under a string-indistinguishability relation — the theoretical justification for why DFA minimization works at all.',
    prerequisites: ['dfa-minimization'],
    relatedConcepts: ['regular-language-properties'],
    estimatedStudyMinutes: 50,
    skillsTested: ['equivalence-classes', 'indistinguishability-relations'],
    skillsUnlocked: ['proving-non-regularity-without-the-pumping-lemma'],
    visualizationAvailable: false,
    complexityFactors: { proofComplexity: 4, reasoningSteps: 5 },
    sourceDocs: [
      'gap: no source material — added per PROMPT 04.6 Phase 9 (confirmed standard via Stanford CS154 public syllabus)',
    ],
    scope: 'v2-future',
    scopeReason: 'Explicitly named as a Version 2 topic in PROMPT 04.6 Phase 9.',
  },
  {
    id: 'turing-machines',
    title: 'Turing Machines',
    description:
      'A finite control plus an unbounded, freely-movable read/write tape — the most powerful standard model of computation, and the model the Church–Turing thesis is stated against.',
    prerequisites: ['pushdown-automata'],
    relatedConcepts: ['decidability'],
    estimatedStudyMinutes: 50,
    skillsTested: ['tape-based-computation', 'configuration-tracing'],
    skillsUnlocked: ['decidability-readiness'],
    visualizationAvailable: true,
    complexityFactors: { structuralSize: 3, constructionEffort: 3, reasoningSteps: 4 },
    sourceDocs: [
      'gap: no source material — added per PROMPT 04.6 Phase 9 (confirmed standard via MIT 18.404/Stanford CS154/NPTEL public syllabi)',
    ],
    scope: 'v2-future',
    scopeReason: 'Explicitly named as a Version 2 topic in PROMPT 04.6 Phase 9.',
  },
  {
    id: 'decidability',
    title: 'Decidability & the Halting Problem',
    description:
      'Some languages have no algorithm that always halts with a correct yes/no answer. The halting problem is the canonical undecidable language, proved via diagonalization.',
    prerequisites: ['turing-machines'],
    relatedConcepts: ['rices-theorem', 'recursively-enumerable-languages'],
    estimatedStudyMinutes: 55,
    skillsTested: ['reduction-proofs', 'diagonalization'],
    skillsUnlocked: ['classifying-problems-as-solvable-or-not'],
    visualizationAvailable: false,
    complexityFactors: { proofComplexity: 5, reasoningSteps: 5 },
    sourceDocs: [
      'gap: no source material — added per PROMPT 04.6 Phase 9 (confirmed standard via MIT 18.404/NPTEL public syllabi)',
    ],
    scope: 'v2-future',
    scopeReason: 'Explicitly named as a Version 2 topic in PROMPT 04.6 Phase 9.',
  },
  {
    id: 'rices-theorem',
    title: "Rice's Theorem",
    description:
      'Almost every nontrivial semantic question about a program (e.g. "does it ever output X") is undecidable in general — Rice\'s theorem generalizes the halting-problem argument into one reusable result.',
    prerequisites: ['decidability'],
    relatedConcepts: [],
    estimatedStudyMinutes: 40,
    skillsTested: ['semantic-property-classification'],
    skillsUnlocked: ['recognizing-undecidable-questions-on-sight'],
    visualizationAvailable: false,
    complexityFactors: { proofComplexity: 5, reasoningSteps: 4 },
    sourceDocs: [
      'gap: no source material — added per PROMPT 04.6 Phase 9 (confirmed standard via Stanford CS154/NPTEL public syllabi)',
    ],
    scope: 'v2-future',
    scopeReason: 'Explicitly named as a Version 2 topic in PROMPT 04.6 Phase 9.',
  },
  {
    id: 'recursively-enumerable-languages',
    title: 'Recursively Enumerable Languages',
    description:
      'Languages accepted by SOME Turing machine, even if that machine might run forever on rejected input — the class one level above decidable languages, completing the Chomsky-hierarchy picture.',
    prerequisites: ['turing-machines'],
    relatedConcepts: ['decidability'],
    estimatedStudyMinutes: 35,
    skillsTested: ['recognizer-vs-decider-distinction'],
    skillsUnlocked: ['placing-any-language-in-the-chomsky-hierarchy'],
    visualizationAvailable: false,
    complexityFactors: { proofComplexity: 3, reasoningSteps: 3 },
    sourceDocs: [
      'gap: no source material — added per PROMPT 04.6 Phase 9 (confirmed standard via MIT 18.404/NPTEL public syllabi)',
    ],
    scope: 'v2-future',
    scopeReason: 'Explicitly named as a Version 2 topic in PROMPT 04.6 Phase 9.',
  },
  {
    id: 'complexity-theory-basics',
    title: 'Complexity Theory Basics (P vs. NP)',
    description:
      'Beyond "can it be computed at all" lies "how efficiently" — time complexity classes P and NP, polynomial-time reductions, and the P-vs-NP question.',
    prerequisites: ['decidability'],
    relatedConcepts: ['rices-theorem'],
    estimatedStudyMinutes: 45,
    skillsTested: ['asymptotic-time-analysis', 'polynomial-reductions'],
    skillsUnlocked: ['np-completeness-readiness'],
    visualizationAvailable: false,
    complexityFactors: { proofComplexity: 4, reasoningSteps: 4 },
    sourceDocs: [
      'gap: no source material — added per PROMPT 04.6 Phase 9 (confirmed standard via MIT 18.404/Stanford CS154/NPTEL public syllabi)',
    ],
    scope: 'advanced-optional',
    scopeReason:
      'Named in PROMPT 04.6 Phase 9 as future content; classified advanced-optional rather than v2-future because it is a full subject in its own right (more naturally a Version 3+ "Complexity Theory" module than part of the core automata sequence).',
  },
];

/** Adapts the concept graph to `@arc/engine-game`'s generic unlock-node shape. */
export function toConceptUnlockNodes(): readonly UnlockNode[] {
  return CONCEPTS.map((c) => ({ id: c.id, dependsOn: c.prerequisites }));
}

export function conceptById(id: string): CurriculumConcept | undefined {
  return CONCEPTS.find((c) => c.id === id);
}

/** Reverse lookup: which concepts list `conceptId` as a direct prerequisite. */
export function conceptChildren(conceptId: string): readonly string[] {
  return CONCEPTS.filter((c) => c.prerequisites.includes(conceptId)).map((c) => c.id);
}

export function v1Concepts(): readonly CurriculumConcept[] {
  return CONCEPTS.filter((c) => c.scope === 'v1');
}

export function futureConcepts(): readonly CurriculumConcept[] {
  return CONCEPTS.filter((c) => c.scope !== 'v1');
}
