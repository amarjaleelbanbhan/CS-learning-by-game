/**
 * Question-type taxonomy distilled from BOTH the lecture decks' "Activity Time"
 * exercises AND the real Sukkur IBA University assignment/exam material in
 * `docs/Knowladge/`. Every mission in `missions.ts` is tagged with exactly one of
 * these — the set is intentionally closed so ARIA's hint logic and future
 * auto-generation can switch on it exhaustively.
 */
export type QuestionTypeId =
  | 'string-membership'
  | 'language-cardinality'
  | 'dfa-nfa-construction'
  | 'automaton-classification'
  | 'automaton-operation-identification'
  | 'nfa-determinization'
  | 'moore-mealy-conversion'
  | 'automaton-to-regex'
  | 'regex-construction'
  | 'regularity-proof'
  | 'grammar-derivation'
  | 'grammar-language-description'
  | 'grammar-construction'
  | 'parse-tree-construction'
  | 'ambiguity-proof'
  | 'grammar-simplification'
  | 'cnf-conversion'
  | 'pda-construction';

export interface QuestionTypeMeta {
  readonly id: QuestionTypeId;
  readonly label: string;
  readonly description: string;
  /** Never reveal the answer directly — these are the failure modes the hint ladder must dodge. */
  readonly autoGradable: boolean;
}

export const QUESTION_TYPES: readonly QuestionTypeMeta[] = [
  {
    id: 'string-membership',
    label: 'String Membership',
    description: 'Decide whether a specific string belongs to a described language.',
    autoGradable: true,
  },
  {
    id: 'language-cardinality',
    label: 'Language Cardinality',
    description:
      'Count how many words of a given length a language contains, or find the general formula.',
    autoGradable: true,
  },
  {
    id: 'dfa-nfa-construction',
    label: 'Automaton Construction',
    description: 'Build a DFA or NFA whose accepted language matches a described target.',
    autoGradable: true,
  },
  {
    id: 'automaton-classification',
    label: 'Automaton Classification',
    description:
      'Given a property (start states, final states, edge labels, determinism), identify which automaton family (FA/TG/NFA/Moore/Mealy) it describes.',
    autoGradable: true,
  },
  {
    id: 'automaton-operation-identification',
    label: 'Operation Identification',
    description:
      'Given two automata and a resulting automaton, identify which set operation (∪, ·, ∩, −, *) produced it.',
    autoGradable: true,
  },
  {
    id: 'nfa-determinization',
    label: 'NFA → DFA Determinization',
    description:
      'Apply subset construction to convert a given NFA (with or without ε-transitions) into an equivalent DFA.',
    autoGradable: true,
  },
  {
    id: 'moore-mealy-conversion',
    label: 'Moore ↔ Mealy Conversion',
    description: 'Convert a Moore machine to an equivalent Mealy machine, or vice versa.',
    autoGradable: true,
  },
  {
    id: 'automaton-to-regex',
    label: 'Automaton → Regex (State Elimination)',
    description:
      'Reduce a DFA/NFA to an equivalent regular expression via the generalized-transition-graph state-elimination algorithm.',
    autoGradable: true,
  },
  {
    id: 'regex-construction',
    label: 'Regex Construction',
    description:
      'Write a regular expression for a described set of strings, using only the basic operations.',
    autoGradable: true,
  },
  {
    id: 'regularity-proof',
    label: 'Regularity / Non-Regularity Proof',
    description:
      'Prove or disprove that a language is regular, typically via the pumping lemma or a closure-property argument.',
    autoGradable: false,
  },
  {
    id: 'grammar-derivation',
    label: 'Grammar Derivation',
    description:
      'Produce a leftmost or rightmost derivation of a target string from a given grammar.',
    autoGradable: true,
  },
  {
    id: 'grammar-language-description',
    label: 'Describe L(G)',
    description:
      'Given a grammar, describe the language it generates (in words or set-builder notation).',
    autoGradable: false,
  },
  {
    id: 'grammar-construction',
    label: 'Grammar Construction',
    description:
      'Given a described language, construct a grammar (regular or context-free) that generates exactly it.',
    autoGradable: true,
  },
  {
    id: 'parse-tree-construction',
    label: 'Parse Tree Construction',
    description: 'Draw the derivation (parse) tree for a given string under a given grammar.',
    autoGradable: true,
  },
  {
    id: 'ambiguity-proof',
    label: 'Ambiguity Proof',
    description:
      'Prove a grammar is ambiguous by exhibiting two distinct parse trees for one witness string.',
    autoGradable: false,
  },
  {
    id: 'grammar-simplification',
    label: 'Grammar Simplification',
    description:
      'Remove useless symbols/productions and/or eliminate nullable (ε-producing) variables without changing L(G).',
    autoGradable: true,
  },
  {
    id: 'cnf-conversion',
    label: 'Chomsky Normal Form Conversion',
    description:
      'Convert a context-free grammar into an equivalent grammar in Chomsky Normal Form.',
    autoGradable: true,
  },
  {
    id: 'pda-construction',
    label: 'PDA Construction',
    description:
      'Construct a pushdown automaton that accepts a described (typically non-regular, context-free) language.',
    autoGradable: false,
  },
];

export function questionTypeById(id: QuestionTypeId): QuestionTypeMeta {
  const found = QUESTION_TYPES.find((q) => q.id === id);
  if (!found) throw new Error(`Unknown question type: ${id}`);
  return found;
}
