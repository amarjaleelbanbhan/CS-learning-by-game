import type { StateId } from '@arc/shared';
import { buildTrace, type Trace } from '@arc/engine-core';
import { epsilonClosure, move, type NFA, type Sym } from '@arc/engine-automata';

/** One step of an NFA run: the full set of simultaneously-active states. */
export interface NfaSimFrame {
  readonly position: number;
  readonly consumed: string;
  readonly remaining: string;
  /** All states active after ε-closure at this step (sorted for determinism). */
  readonly activeStates: readonly StateId[];
  /** States that newly died on this step (were active, no longer are). */
  readonly diedStates: readonly StateId[];
  readonly justRead: Sym | null;
  readonly accepted: boolean;
}

function sortIds(set: ReadonlySet<StateId>): StateId[] {
  return [...set].sort();
}

/**
 * Deterministic trace of an NFA run, tracking the active-state set at each step.
 * This is what the NFA lab animates as "parallel branches"; dead branches are
 * surfaced via `diedStates` so the renderer can fade them out.
 */
export function simulateNfa(nfa: NFA, input: string): Trace<NfaSimFrame> {
  const symbols = [...input];
  const steps: Array<{ label: string; data: NfaSimFrame }> = [];

  let active = epsilonClosure(nfa, [nfa.start]);
  const acceptingNow = (set: ReadonlySet<StateId>): boolean =>
    [...set].some((s) => nfa.accepting.has(s));

  steps.push({
    label: `ε-closure of start = {${sortIds(active).join(', ')}}`,
    data: {
      position: 0,
      consumed: '',
      remaining: input,
      activeStates: sortIds(active),
      diedStates: [],
      justRead: null,
      accepted: symbols.length === 0 && acceptingNow(active),
    },
  });

  for (let i = 0; i < symbols.length; i++) {
    const sym = symbols[i]!;
    const prev = active;
    const next = epsilonClosure(nfa, move(nfa, active, sym));
    const died = [...prev].filter((s) => !next.has(s));
    active = next;
    const isLast = i === symbols.length - 1;
    steps.push({
      label:
        active.size === 0
          ? `Read '${sym}' — all branches died`
          : `Read '${sym}' → {${sortIds(active).join(', ')}}`,
      data: {
        position: i + 1,
        consumed: symbols.slice(0, i + 1).join(''),
        remaining: symbols.slice(i + 1).join(''),
        activeStates: sortIds(active),
        diedStates: died.sort(),
        justRead: sym,
        accepted: isLast && acceptingNow(active),
      },
    });
  }

  return buildTrace(steps, acceptingNow(active) ? 'accept' : 'reject');
}
