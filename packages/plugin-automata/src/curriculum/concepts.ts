import type { Difficulty } from '@arc/plugin-sdk';
import type { UnlockNode } from '@arc/engine-game';

/**
 * Knowledge graph for Theory of Automata, distilled from `docs/Knowladge/` (CS301-style
 * lecture decks credited "Courtesy Costas Busch - RPI") plus the real Sukkur IBA
 * University assessment material in the same folder. `prerequisites` doubles as the
 * `dependsOn` shape `@arc/engine-game`'s unlock-graph already understands — see
 * `toConceptUnlockNodes` below and the campaign districts in `apps/web`.
 *
 * `sourceDocs` entries prefixed `gap:` mean the topic is confirmed to be taught (it shows
 * up in the real assignment/exam) but the lecture slide deck itself could not be read
 * (legacy binary `.ppt`, mostly diagram-only with no extractable text) — see
 * `docs/curriculum-ingestion-report.md` for the full account.
 */
export interface CurriculumConcept {
  readonly id: string;
  readonly title: string;
  readonly prerequisites: readonly string[];
  readonly difficulty: Difficulty;
  readonly skills: readonly string[];
  readonly description: string;
  readonly sourceDocs: readonly string[];
}

export const CONCEPTS: readonly CurriculumConcept[] = [
  {
    id: 'mathematical-preliminaries',
    title: 'Sets, Relations & Induction',
    prerequisites: [],
    difficulty: 1,
    skills: ['set-notation', 'cartesian-product', 'proof-by-induction'],
    description:
      'Set representations, Cartesian product, and induction proofs over trees/recursive structures — the toolbox every later proof borrows from.',
    sourceDocs: ['3 - Mathematical Preliminaries.ppt (partial recovery)'],
  },
  {
    id: 'languages-strings-alphabets',
    title: 'Alphabets, Strings & Languages',
    prerequisites: ['mathematical-preliminaries'],
    difficulty: 1,
    skills: ['string-operations', 'language-as-a-set'],
    description:
      'A language is just a set of strings over an alphabet. Establishes |Σ|, Σ*, concatenation, length, and reversal before any machine exists.',
    sourceDocs: ['4 - Languages.pdf'],
  },
  {
    id: 'language-set-operations',
    title: 'Operations on Languages',
    prerequisites: ['languages-strings-alphabets'],
    difficulty: 1,
    skills: ['union', 'concatenation', 'kleene-star', 'complement', 'reverse'],
    description:
      'Union, concatenation, Kleene star, complement, and reverse defined directly on languages — the operations every closure proof later reasons about.',
    sourceDocs: ['4 - Languages.pdf'],
  },
  {
    id: 'dfa-fundamentals',
    title: 'Deterministic Finite Automata',
    prerequisites: ['language-set-operations'],
    difficulty: 2,
    skills: ['state-diagrams', 'transition-functions', 'acceptance'],
    description:
      'Exactly one transition per symbol per state. The acceptance/rejection definition that every later automaton variant either keeps or deliberately relaxes.',
    sourceDocs: ['6 - DFA and RL (1).pdf'],
  },
  {
    id: 'dfa-language-design',
    title: 'Designing DFAs for a Target Language',
    prerequisites: ['dfa-fundamentals'],
    difficulty: 2,
    skills: ['state-minimality', 'invariant-design'],
    description:
      'Going from an informal language description ("ends in 01", "divisible by 3") to a concrete, minimal state machine — the core construction skill, not just the definition.',
    sourceDocs: ['6 - DFA and RL (1).pdf'],
  },
  {
    id: 'nfa-fundamentals',
    title: 'Nondeterministic Finite Automata',
    prerequisites: ['dfa-fundamentals'],
    difficulty: 2,
    skills: ['nondeterminism', 'branching-acceptance'],
    description:
      'Multiple (or zero) transitions per symbol. A string is accepted if ANY branch reaches an accepting state — acceptance becomes existential, not deterministic.',
    sourceDocs: ['7 - NFA.pdf'],
  },
  {
    id: 'epsilon-transitions',
    title: 'Epsilon (ε) Transitions',
    prerequisites: ['nfa-fundamentals'],
    difficulty: 3,
    skills: ['epsilon-closure', 'free-moves'],
    description:
      'A transition that consumes no input symbol. Computing ε-closure correctly is the single most common source of NFA simulation bugs.',
    sourceDocs: ['7 - NFA.pdf'],
  },
  {
    id: 'nfa-to-dfa-subset-construction',
    title: 'NFA → DFA: Subset Construction',
    prerequisites: ['epsilon-transitions'],
    difficulty: 3,
    skills: ['powerset-states', 'determinization', 'equivalence-proof'],
    description:
      'Every NFA state becomes a SET of NFA states in the new DFA. Proves NFAs and DFAs accept exactly the same class of languages despite looking structurally different.',
    sourceDocs: ['8 - NFA and RL (1).pdf'],
  },
  {
    id: 'moore-mealy-machines',
    title: 'Moore & Mealy Machines',
    prerequisites: ['dfa-fundamentals'],
    difficulty: 3,
    skills: ['output-functions', 'transducer-conversion'],
    description:
      'Finite automata that produce output, not just accept/reject. Moore machines emit output per-state; Mealy machines emit output per-transition — converting between them is a standard exam skill.',
    sourceDocs: ['gap: no lecture deck found — confirmed taught via Sukkur IBA exam material (Q4)'],
  },
  {
    id: 'regular-expressions',
    title: 'Regular Expressions',
    prerequisites: ['nfa-fundamentals'],
    difficulty: 3,
    skills: ['regex-syntax', 'regex-semantics'],
    description:
      'A compact algebraic notation (union +, concatenation ·, star *) for describing exactly the regular languages — the third standard representation alongside DFA and NFA.',
    sourceDocs: ['10 - RE & RL.pdf'],
  },
  {
    id: 'regex-automata-equivalence',
    title: 'Regex ↔ Automata: State Elimination',
    prerequisites: ['regular-expressions', 'nfa-to-dfa-subset-construction'],
    difficulty: 4,
    skills: ['generalized-transition-graphs', 'state-elimination'],
    description:
      'Two-directional proof: any regex compiles to an NFA (induction on regex structure), and any DFA/NFA reduces to a regex by eliminating states from a generalized transition graph one at a time.',
    sourceDocs: ['10 - RE & RL.pdf'],
  },
  {
    id: 'regular-language-properties',
    title: 'Closure Properties & the Pumping Lemma',
    prerequisites: ['dfa-fundamentals', 'regular-expressions'],
    difficulty: 4,
    skills: ['pumping-lemma', 'closure-proofs', 'non-regularity-proofs'],
    description:
      'Regular languages are closed under union/concat/star/complement/intersection — and the pumping lemma is the standard tool for proving a language is NOT regular.',
    sourceDocs: [
      'gap: "9 - Properties RL [Autosaved].ppt" is diagram-only, no text recoverable — confirmed taught via Assignment_1 Q1, Q15–17 (regularity/non-regularity proofs)',
    ],
  },
  {
    id: 'grammars-general',
    title: 'Grammars & Derivations',
    prerequisites: ['languages-strings-alphabets'],
    difficulty: 2,
    skills: ['production-rules', 'derivations', 'sentential-forms'],
    description:
      'A grammar generates strings via production rules rather than accepting them via a machine — the generative dual of everything done so far with automata.',
    sourceDocs: ['11 - Grammars.pdf'],
  },
  {
    id: 'regular-grammars',
    title: 'Regular Grammars',
    prerequisites: ['grammars-general', 'dfa-fundamentals'],
    difficulty: 4,
    skills: ['right-linear-grammars', 'left-linear-grammars', 'grammar-automaton-conversion'],
    description:
      'Right-linear and left-linear grammars generate exactly the regular languages — a third equivalence proof (grammar ↔ automaton) using the same NFA-construction idea as subset construction.',
    sourceDocs: ['11 - Grammars.pdf'],
  },
  {
    id: 'context-free-grammars',
    title: 'Context-Free Grammars',
    prerequisites: ['grammars-general'],
    difficulty: 3,
    skills: ['cfg-derivations', 'leftmost-rightmost-derivation', 'derivation-trees'],
    description:
      'Grammars whose left side is always a single variable, with no further restriction on the right side — generates a strictly larger class of languages than regular grammars (e.g. {aⁿbⁿ}, {wwᴿ}).',
    sourceDocs: ['16 - CFG.pdf'],
  },
  {
    id: 'cfg-ambiguity',
    title: 'CFG Ambiguity',
    prerequisites: ['context-free-grammars'],
    difficulty: 4,
    skills: ['ambiguity-proofs', 'multiple-parse-trees'],
    description:
      'A grammar is ambiguous if some string has two distinct derivation trees. Proving ambiguity means exhibiting two such trees for one witness string — confirmed as a recurring exam/assignment question.',
    sourceDocs: ['16 - CFG.pdf', 'Assignment_1 _TOA-CFG.doc (Q7–Q9)'],
  },
  {
    id: 'cfg-simplification',
    title: 'Grammar Simplification',
    prerequisites: ['context-free-grammars'],
    difficulty: 4,
    skills: ['useless-symbol-removal', 'nullable-variable-removal'],
    description:
      'Removing useless terminals/productions and eliminating ε-productions without changing the generated language — required groundwork before Chomsky Normal Form.',
    sourceDocs: ['Assignment_1 _TOA-CFG.doc (Q10–Q11)'],
  },
  {
    id: 'chomsky-normal-form',
    title: 'Chomsky Normal Form',
    prerequisites: ['cfg-simplification'],
    difficulty: 4,
    skills: ['cnf-conversion'],
    description:
      'Every production restricted to A → BC or A → a. A standard normalization that later enables CYK-style parsing algorithms (not yet covered in the source material).',
    sourceDocs: ['Assignment_1 _TOA-CFG.doc (Q12–Q13)'],
  },
  {
    id: 'pushdown-automata',
    title: 'Pushdown Automata',
    prerequisites: ['context-free-grammars'],
    difficulty: 4,
    skills: ['stack-based-acceptance', 'pda-construction'],
    description:
      'A finite automaton plus an unbounded stack — accepts exactly the context-free languages. Referenced by name in the assignment (PDA construction for {aⁿbᵒcⁿ}-style languages) but no PDA lecture deck exists in the source material yet.',
    sourceDocs: [
      'gap: no lecture deck found at all — confirmed assigned via Assignment_1 Q14, Q15c, Q18c/d/e',
    ],
  },
];

/** Adapts the concept graph to `@arc/engine-game`'s generic unlock-node shape. */
export function toConceptUnlockNodes(): readonly UnlockNode[] {
  return CONCEPTS.map((c) => ({ id: c.id, dependsOn: c.prerequisites }));
}

export function conceptById(id: string): CurriculumConcept | undefined {
  return CONCEPTS.find((c) => c.id === id);
}
