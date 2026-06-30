'use client';

import { useMemo } from 'react';
import { buildTrace } from '@arc/engine-core';
import { usePlayback } from '@/components/viz/usePlayback';
import { SimulationControls } from '@/components/viz/SimulationControls';
import { GraphView } from '@/components/viz/GraphView';
import { builderModelToGraphModel, type GraphModel } from '@/components/viz/graph-model';
import type { BuilderModel } from '@/lib/automata/builder-types';
import { Panel } from '@/components/ui/Panel';

/**
 * Replays the player's own completed build, step by step. Reuses the undo/redo history
 * stack itself as the replay log (`history.snapshots`) rather than maintaining a
 * separate action-recording mechanism — every edit that produced the final, correct
 * model is already captured there in order.
 */
export function ReplayViewer({ snapshots }: { snapshots: readonly BuilderModel[] }) {
  const trace = useMemo(
    () =>
      buildTrace(
        snapshots.map((model, i) => ({
          label: i === 0 ? 'Starting canvas' : `Edit ${i} of ${snapshots.length - 1}`,
          data: model,
        })),
        'incomplete',
      ),
    [snapshots],
  );
  const pb = usePlayback(trace);
  const model = pb.frame?.data;
  const graph: GraphModel = useMemo(
    () => (model ? builderModelToGraphModel(model) : { nodes: [], edges: [] }),
    [model],
  );

  return (
    <Panel className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-display text-xs uppercase tracking-widest text-ink-mid">
          Replay your build
        </h3>
        <span className="font-mono text-[10px] text-ink-low">{pb.frame?.label}</span>
      </div>
      <GraphView model={graph} height={280} fitViewKey={graph.nodes.length} />
      <div className="mt-3">
        <SimulationControls pb={pb} />
      </div>
    </Panel>
  );
}
