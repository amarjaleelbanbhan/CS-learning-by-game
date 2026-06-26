'use client';

import { useMemo } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  ReactFlowProvider,
  type Edge,
  type Node,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { StateNode, type StateNodeData } from './StateNode';
import { AutomataEdge } from './AutomataEdge';
import type { GraphModel } from './graph-model';

const nodeTypes = { state: StateNode };
const edgeTypes = { automata: AutomataEdge };

export interface GraphViewProps {
  model: GraphModel;
  activeNodes?: readonly string[];
  activeEdgeKey?: string | null;
  height?: number;
  /** Re-fit the viewport when this key changes (e.g. as a graph grows). */
  fitViewKey?: string | number;
}

function Inner({ model, activeNodes = [], activeEdgeKey = null, height = 340 }: GraphViewProps) {
  const activeSet = useMemo(() => new Set(activeNodes), [activeNodes]);

  const nodes: Node<StateNodeData>[] = useMemo(
    () =>
      model.nodes.map((n) => ({
        id: n.id,
        type: 'state',
        position: { x: n.x, y: n.y },
        data: {
          label: n.label,
          isStart: n.isStart,
          isAccepting: n.isAccepting,
          isActive: activeSet.has(n.id),
        },
      })),
    [model.nodes, activeSet],
  );

  const edges: Edge[] = useMemo(
    () =>
      model.edges.map((e) => {
        const isActive = e.id === activeEdgeKey;
        return {
          id: e.id,
          source: e.from,
          target: e.to,
          type: 'automata',
          className: isActive ? 'is-active' : '',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isActive ? '#38E1FF' : 'rgba(157,176,206,0.6)',
            width: 18,
            height: 18,
          },
          data: { label: e.label, active: isActive },
        } satisfies Edge;
      }),
    [model.edges, activeEdgeKey],
  );

  return (
    <div
      style={{ height }}
      className="overflow-hidden rounded-xl border border-arc-cyan/10 bg-void/40"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        nodesConnectable={false}
        elementsSelectable={false}
        nodesDraggable
        minZoom={0.3}
        maxZoom={1.75}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={26}
          size={1}
          color="rgba(56,225,255,0.16)"
        />
        <Controls showInteractive={false} className="!border-arc-cyan/20 !bg-void/70" />
      </ReactFlow>
    </div>
  );
}

export function GraphView(props: GraphViewProps) {
  // Remounting on fitViewKey re-runs fitView as the DFA grows during construction.
  return (
    <ReactFlowProvider key={props.fitViewKey}>
      <Inner {...props} />
    </ReactFlowProvider>
  );
}
