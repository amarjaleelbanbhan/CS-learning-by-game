'use client';

import { useMemo } from 'react';
import { compileToDfa, type BuilderModel } from '@/lib/automata/builder-types';
import { builderModelToGraphModel, dfaToGraphModel } from '@/components/viz/graph-model';
import { GraphView } from '@/components/viz/GraphView';
import { simulateDfa } from '@arc/engine-simulation';
import { subsetConstruction, type NFA } from '@arc/engine-automata';
import type { Layout } from '@/lib/automata/examples';
import { Panel } from '@/components/ui/Panel';

/**
 * Comparison Mode: never a visual diff of graph shapes — both panes are simulated on the
 * SAME counterexample string and only the divergence point is highlighted, which is the
 * only thing that actually matters when two automata disagree. The reference graph itself
 * is withheld until the player has earned a late-enough hint tier (never shown first).
 */
export function ComparisonView({
  playerModel,
  alphabet,
  nfa,
  counterexample,
  revealReference,
}: {
  playerModel: BuilderModel;
  alphabet: readonly string[];
  nfa: NFA;
  counterexample: string;
  revealReference: boolean;
}) {
  const playerGraph = useMemo(() => builderModelToGraphModel(playerModel), [playerModel]);
  const playerTrace = useMemo(() => {
    try {
      return simulateDfa(compileToDfa(playerModel, alphabet), counterexample);
    } catch {
      return null;
    }
  }, [playerModel, alphabet, counterexample]);
  const playerFinal = playerTrace?.frames.at(-1)?.data.currentState;

  const reference = useMemo(() => subsetConstruction(nfa), [nfa]);
  const referenceLayout: Layout = useMemo(() => {
    const layout: Layout = {};
    reference.dfa.states.forEach((s, i) => {
      layout[s] = { x: (i % 3) * 200, y: Math.floor(i / 3) * 140 };
    });
    return layout;
  }, [reference]);
  const referenceGraph = useMemo(
    () => dfaToGraphModel(reference.dfa, referenceLayout),
    [reference, referenceLayout],
  );
  const referenceTrace = useMemo(
    () => simulateDfa(reference.dfa, counterexample),
    [reference, counterexample],
  );
  const referenceFinal = referenceTrace.frames.at(-1)?.data.currentState;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Panel className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-display text-xs uppercase tracking-widest text-ink-mid">Your DFA</h3>
          <span className="font-mono text-[10px] text-ink-low">
            on &quot;{counterexample || 'ε'}&quot; →{' '}
            <span className={playerTrace?.outcome === 'accept' ? 'text-accept' : 'text-reject'}>
              {playerTrace?.outcome ?? 'invalid'}
            </span>
          </span>
        </div>
        <GraphView
          model={playerGraph}
          activeNodes={playerFinal ? [playerFinal] : []}
          height={260}
        />
      </Panel>

      <Panel className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-display text-xs uppercase tracking-widest text-ink-mid">
            Reference DFA
          </h3>
          {revealReference && (
            <span className="font-mono text-[10px] text-ink-low">
              on &quot;{counterexample || 'ε'}&quot; →{' '}
              <span className={referenceTrace.outcome === 'accept' ? 'text-accept' : 'text-reject'}>
                {referenceTrace.outcome}
              </span>
            </span>
          )}
        </div>
        {revealReference ? (
          <GraphView
            model={referenceGraph}
            activeNodes={referenceFinal ? [referenceFinal] : []}
            height={260}
          />
        ) : (
          <div className="grid h-[260px] place-items-center rounded-xl border border-ink-low/15 text-center text-xs text-ink-low">
            Keep working through the hint ladder to unlock the reference machine.
          </div>
        )}
      </Panel>
    </div>
  );
}
