export type {
  QuestionType,
  Topic,
  Difficulty,
  HintKind,
  HintSpec,
  Question,
  GradeResult,
} from './types.js';

export { HINT_KIND_ORDER, unlockedHintTier, unlockedHintKind } from './hint-ladder.js';
export { gradeDfaConstruction } from './dfa-grading.js';

export type { SubsetMistakeKind, SubsetMistake, SubsetAnalysisResult } from './subset-analysis.js';
export { parseSubsetLabel, analyzeSubsetConstruction } from './subset-analysis.js';

// Generalized assessment (the Grader pipeline). `gradeDfaConstruction` above is retained
// as the narrow, already-wired path; new work should use `assess` + a Grader.
export type { Outcome, Mistake, Counterexample, Verdict } from './verdict.js';
export { correct, incorrect, partial, invalid, isSolved, countsAsAttempt } from './verdict.js';

export type { Grader, AnyGrader } from './grader.js';
export { assess, GraderRegistry } from './grader.js';

export * from './graders/index.js';
