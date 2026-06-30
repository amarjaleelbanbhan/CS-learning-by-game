'use client';

import { useMemo } from 'react';
import type { NFA } from '@arc/engine-automata';
import { SimulationControls } from '@/components/viz/SimulationControls';
import { usePlayback } from '@/components/viz/usePlayback';
import { displayLabel, type GraphModel } from '@/components/viz/graph-model';
import { GraphView } from '@/components/viz/GraphView';
import { buildSubsetViz } from '@/lib/automata/subset-frames';
import { Panel } from '@/components/ui/Panel';

/**
 * The earned spectacle: the same subset-construction algorithm playback used by the
 * standalone "toa.nfa-to-dfa" lab, reused here as the top hint tier's full reveal and as
 * the post-success confirmation — visualization is the reward, never the lesson.
 */
export function SubsetVizBlock({ nfa }: { nfa: NFA }) {
  const viz = useMemo(() => buildSubsetViz(nfa), [nfa]);
  const pb = usePlayback(viz.trace);
  const frame = pb.frame?.data;
  const acceptingLabels = useMemo(() => new Set<string>(viz.dfa.accepting), [viz]);

  const dfaModel: GraphModel = useMemo(() => {
    if (!frame) return { nodes: [], edges: [] };
    return {
      nodes: frame.dfaNodeIds.map((id) => ({
        id,
        label: displayLabel(id),
        x: viz.dfaLayout[id]?.x ?? 0,
        y: viz.dfaLayout[id]?.y ?? 0,
        isStart: id === viz.dfa.start,
        isAccepting: acceptingLabels.has(id),
      })),
      edges: frame.dfaEdges,
    };
  }, [frame, viz, acceptingLabels]);

  const activeNodes = frame
    ? [frame.currentDfaNode, ...(frame.resultDfaNode ? [frame.resultDfaNode] : [])]
    : [];

  return (
    <Panel className="p-4">
      <h3 className="mb-2 font-display text-xs uppercase tracking-widest text-ink-mid">
        Confirmed: the algorithm's own conversion
      </h3>
      <GraphView
        model={dfaModel}
        activeNodes={activeNodes}
        activeEdgeKey={frame?.activeDfaEdgeKey ?? null}
        height={280}
        fitViewKey={frame?.dfaNodeIds.length ?? 0}
      />
      <p className="mt-2 font-mono text-xs text-ink-low">{pb.frame?.label}</p>
      <div className="mt-3">
        <SimulationControls pb={pb} />
      </div>
    </Panel>
  );
}
