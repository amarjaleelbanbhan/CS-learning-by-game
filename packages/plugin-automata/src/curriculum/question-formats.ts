/**
 * Question FORMAT taxonomy (PROMPT 04.6 Phase 6) — orthogonal to `question-types.ts`.
 *
 * `QuestionTypeId` answers "what topic/skill is this testing" (e.g. nfa-determinization).
 * `QuestionFormatId` answers "what shape does answering it take" (e.g. construction vs.
 * debugging vs. multiple-choice). The same question type can be presented in several
 * formats — e.g. NFA determinization could be a `construction` mission (build the DFA) or
 * a `debugging` one (find the wrong transition in an almost-correct subset construction).
 */
export type QuestionFormatId =
  | 'construction'
  | 'debugging'
  | 'completion'
  | 'optimization'
  | 'prediction'
  | 'simulation'
  | 'conversion'
  | 'theory'
  | 'proof'
  | 'true-false'
  | 'mcq'
  | 'interactive-builder';

export interface QuestionFormatMeta {
  readonly id: QuestionFormatId;
  readonly label: string;
  readonly description: string;
}

export const QUESTION_FORMATS: readonly QuestionFormatMeta[] = [
  {
    id: 'construction',
    label: 'Construction',
    description:
      'Build a structure (automaton, grammar, expression) from a specification, starting from nothing.',
  },
  {
    id: 'debugging',
    label: 'Debugging',
    description: 'Given an almost-correct structure with one planted flaw, find and fix it.',
  },
  {
    id: 'completion',
    label: 'Completion',
    description:
      'Given a partially-filled structure (transition table, derivation), fill in the missing pieces.',
  },
  {
    id: 'optimization',
    label: 'Optimization',
    description:
      'Given a correct but non-minimal/inefficient structure, improve it without changing its meaning.',
  },
  {
    id: 'prediction',
    label: 'Prediction',
    description: 'Given a fixed structure and an input, predict the outcome before it is revealed.',
  },
  {
    id: 'simulation',
    label: 'Simulation',
    description: 'Trace execution of a given structure step by step.',
  },
  {
    id: 'conversion',
    label: 'Conversion',
    description:
      'Transform one standard representation into an equivalent one (NFA→DFA, Moore→Mealy, DFA→regex).',
  },
  {
    id: 'theory',
    label: 'Theory',
    description:
      "Reason about or describe a structure's properties in words/notation rather than building or tracing it.",
  },
  {
    id: 'proof',
    label: 'Proof',
    description:
      'Construct a rigorous argument (ambiguity, non-regularity, equivalence) with no partial credit for "looks right".',
  },
  {
    id: 'true-false',
    label: 'True/False',
    description:
      'Rapid-fire binary judgment on a stated claim — high volume, low time-per-question.',
  },
  {
    id: 'mcq',
    label: 'Multiple Choice',
    description:
      'Select the correct option from a fixed set — supports automatic, instant grading at scale.',
  },
  {
    id: 'interactive-builder',
    label: 'Interactive Builder',
    description:
      'A free-form canvas/editor task where the player assembles the answer directly (the existing DFA construction canvas is this format).',
  },
];

export function questionFormatById(id: QuestionFormatId): QuestionFormatMeta {
  const found = QUESTION_FORMATS.find((f) => f.id === id);
  if (!found) throw new Error(`Unknown question format: ${id}`);
  return found;
}
