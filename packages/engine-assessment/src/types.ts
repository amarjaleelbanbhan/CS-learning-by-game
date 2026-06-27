/**
 * Question Engine — core metadata model.
 *
 * A Question is the unit of practice across every lab. It carries everything
 * needed to run a mission without hardcoding content into UI components:
 * what to ask, how to grade it, and how to help without spoiling it. New
 * question types (NFA, CFG, PDA, pumping lemma) extend this shape rather than
 * replacing it, so the mission runner and hint ladder stay generic.
 */
export type QuestionType =
  | 'dfa-construct'
  | 'dfa-debug'
  | 'dfa-minimize'
  | 'dfa-equivalent'
  | 'nfa-construct'
  | 'nfa-predict-active'
  | 'nfa-to-dfa'
  | 'regex-construct'
  | 'cfg-construct'
  | 'cfg-derivation'
  | 'pda-construct'
  | 'pumping-lemma-split';

export type Topic = 'languages' | 'dfa' | 'nfa' | 'regex' | 'cfg' | 'pda' | 'pumping-lemma';

export type Difficulty = 1 | 2 | 3 | 4 | 5;

/**
 * The hint ladder never opens with the answer. Each kind is strictly more
 * revealing than the last; `visualization` (the full worked animation) is
 * the LAST resort, not the lesson.
 */
export type HintKind =
  | 'tiny-hint'
  | 'question'
  | 'highlight-state'
  | 'highlight-transition'
  | 'animate-idea'
  | 'visualization';

export interface HintSpec {
  readonly kind: HintKind;
  /** Shown text for tiny-hint/question kinds; a Socratic prompt, never an answer. */
  readonly text?: string;
  /** For highlight-* kinds: which state/transition id to draw attention to. */
  readonly targetId?: string;
}

export interface Question<TPayload> {
  readonly id: string;
  readonly type: QuestionType;
  readonly topic: Topic;
  readonly concept: string;
  readonly difficulty: Difficulty;
  /** The mission objective shown to the player — never a definition or lesson. */
  readonly prompt: string;
  readonly hints: readonly HintSpec[];
  readonly xpReward: number;
  readonly coinsReward: number;
  readonly achievementId?: string;
  readonly estimatedTimeSec: number;
  readonly commonMistakes: readonly string[];
  /** Problem-specific data (e.g. the hidden reference automaton). */
  readonly payload: TPayload;
}

export interface GradeResult {
  readonly correct: boolean;
  /** A shortest input the player's construction disagrees with the target
   * on — null when correct. Surfaced only at the later hint tiers. */
  readonly counterexample: string | null;
}
