'use client';

import { useEffect, useMemo } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlowProvider,
  useReactFlow,
  type Node,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { stateId } from '@arc/shared';
import type { NFA } from '@arc/engine-automata';
import { nfaToGraphModel, type Layout } from '@/components/viz/graph-model';
import { QuantumStateNode, type BranchStatus, type QuantumStateNodeData } from './QuantumStateNode';
import { BranchEdge, type BranchEdgeData } from './BranchEdge';

const nodeTypes = { quantum: QuantumStateNode };
const edgeTypes = { branch: BranchEdge };
const NODE_HALF = 32;

export interface BranchGraphProps {
  nfa: NFA;
  layout: Layout;
  activeNodes: readonly string[];
  diedNodes: readonly string[];
  /** Active-state set of the PREVIOUS frame; needed to know which normal
   * (symbol-consuming) edges were actually just traversed. */
  prevActiveNodes: readonly string[];
  /** True only on the final frame of an accepted run — triggers the cyan detonation. */
  acceptBurst: boolean;
  height?: number;
}

function Inner({
  nfa,
  layout,
  activeNodes,
  diedNodes,
  prevActiveNodes,
  acceptBurst,
  height = 360,
}: BranchGraphProps) {
  const model = useMemo(() => nfaToGraphModel(nfa, layout), [nfa, layout]);
  const { setCenter } = useReactFlow();

  const activeSet = useMemo(() => new Set(activeNodes), [activeNodes]);
  const diedSet = useMemo(() => new Set(diedNodes), [diedNodes]);
  const prevSet = useMemo(() => new Set(prevActiveNodes), [prevActiveNodes]);

  const statusOf = (id: string): BranchStatus => {
    if (diedSet.has(id)) return 'dying';
    if (activeSet.has(id))
      return acceptBurst && nfa.accepting.has(stateId(id)) ? 'accepted' : 'active';
    return 'dormant';
  };

  const nodes: Node<QuantumStateNodeData>[] = useMemo(
    () =>
      model.nodes.map((n) => ({
        id: n.id,
        type: 'quantum',
        position: { x: n.x, y: n.y },
        data: {
          label: n.label,
          isStart: n.isStart,
          isAccepting: n.isAccepting,
          status: statusOf(n.id),
        },
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [model.nodes, activeSet, diedSet, acceptBurst],
  );

  const edges = useMemo(
    () =>
      model.edges.map((e) => {
        const kind: BranchEdgeData['kind'] = e.label === 'ε' ? 'epsilon' : 'normal';
        // ε-edges connect two states alive in the SAME instant (no input consumed);
        // normal edges connect last frame's source to this frame's destination.
        const active =
          kind === 'epsilon'
            ? activeSet.has(e.from) && activeSet.has(e.to)
            : prevSet.has(e.from) && activeSet.has(e.to);
        return {
          id: e.id,
          source: e.from,
          target: e.to,
          type: 'branch',
          data: { label: e.label, active, kind } satisfies BranchEdgeData,
        };
      }),
    [model.edges, activeSet, prevSet],
  );

  // Intelligent camera: a lone branch gets a close-up; many branches pull back
  // so every active thread stays in frame; acceptance gets a cinematic punch-in.
  useEffect(() => {
    const ids = [...activeSet];
    if (ids.length === 0) return;
    const xs = ids.map((id) => (layout[id]?.x ?? 0) + NODE_HALF);
    const ys = ids.map((id) => (layout[id]?.y ?? 0) + NODE_HALF);
    const midX = (Math.min(...xs) + Math.max(...xs)) / 2;
    const midY = (Math.min(...ys) + Math.max(...ys)) / 2;
    const zoom = acceptBurst ? 1.6 : ids.length === 1 ? 1.35 : Math.max(0.6, 1 - ids.length * 0.08);
    setCenter(midX, midY, { zoom, duration: 600 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNodes.join(','), acceptBurst]);

  return (
    <div
      style={{ height }}
      className="overflow-hidden rounded-xl border border-arc-violet/15 bg-void/50"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.35 }}
        nodesConnectable={false}
        elementsSelectable={false}
        nodesDraggable
        minZoom={0.4}
        maxZoom={1.8}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={26}
          size={1}
          color="rgba(155,107,255,0.18)"
        />
        <Controls showInteractive={false} className="!border-arc-violet/20 !bg-void/70" />
      </ReactFlow>
    </div>
  );
}

export function BranchGraph(props: BranchGraphProps) {
  return (
    <ReactFlowProvider>
      <Inner {...props} />
    </ReactFlowProvider>
  );
}
