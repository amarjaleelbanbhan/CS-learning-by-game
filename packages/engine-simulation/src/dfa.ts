import type { StateId } from '@arc/shared';
import { buildTrace, type Trace } from '@arc/engine-core';
import type { DFA, Sym } from '@arc/engine-automata';

/** One step of a DFA run: the machine's state after reading `position` symbols. */
export interface DfaSimFrame {
  /** Number of input symbols consumed so far (0 = before reading anything). */
  readonly position: number;
  readonly consumed: string;
  readonly remaining: string;
  /** Current state, or null if the machine got stuck (no transition). */
  readonly currentState: StateId | null;
  /** Symbol read to arrive at this frame (null for the initial frame). */
  readonly justRead: Sym | null;
  /** True on the final frame iff the current state is accepting. */
  readonly accepted: boolean;
}

/**
 * Produces a deterministic, replayable trace of a DFA consuming `input`.
 * Frame count is always input.length + 1 (initial frame + one per symbol).
 */
export function simulateDfa(dfa: DFA, input: string): Trace<DfaSimFrame> {
  const symbols = [...input];
  const steps: Array<{ label: string; data: DfaSimFrame }> = [];
  let current: StateId | null = dfa.start;

  steps.push({
    label: `Start in ${dfa.start}`,
    data: {
      position: 0,
      consumed: '',
      remaining: input,
      currentState: current,
      justRead: null,
      accepted: dfa.accepting.has(dfa.start) && symbols.length === 0,
    },
  });

  for (let i = 0; i < symbols.length; i++) {
    const sym = symbols[i]!;
    if (current !== null) {
      current = dfa.delta.get(current)?.get(sym) ?? null;
    }
    const consumed = symbols.slice(0, i + 1).join('');
    const remaining = symbols.slice(i + 1).join('');
    const isLast = i === symbols.length - 1;
    steps.push({
      label:
        current === null
          ? `No transition on '${sym}' — rejected`
          : `Read '${sym}' → ${current}`,
      data: {
        position: i + 1,
        consumed,
        remaining,
        currentState: current,
        justRead: sym,
        accepted: isLast && current !== null && dfa.accepting.has(current),
      },
    });
  }

  const accepted = current !== null && dfa.accepting.has(current);
  return buildTrace(steps, accepted ? 'accept' : 'reject');
}
