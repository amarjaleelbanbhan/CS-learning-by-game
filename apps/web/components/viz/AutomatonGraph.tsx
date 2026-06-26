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
import type { AutomatonView } from '@/lib/automata/examples';
import { StateNode, type StateNodeData } from './StateNode';
import { AutomataEdge } from './AutomataEdge';

const nodeTypes = { state: StateNode };
const edgeTypes = { automata: AutomataEdge };

export interface AutomatonGraphProps {
  view: AutomatonView;
  activeStates?: readonly string[];
  activeEdgeKey?: string | null;
  height?: number;
}

function Inner({
  view,
  activeStates = [],
  activeEdgeKey = null,
  height = 360,
}: AutomatonGraphProps) {
  const activeSet = useMemo(() => new Set(activeStates), [activeStates]);

  const nodes: Node<StateNodeData>[] = useMemo(
    () =>
      view.dfa.states.map((s) => ({
        id: s,
        type: 'state',
        position: view.layout[s] ?? { x: 0, y: 0 },
        data: {
          label: s,
          isStart: s === view.dfa.start,
          isAccepting: view.dfa.accepting.has(s),
          isActive: activeSet.has(s),
        },
      })),
    [view, activeSet],
  );

  const edges: Edge[] = useMemo(() => {
    const groups = new Map<string, { from: string; to: string; symbols: string[] }>();
    for (const [from, row] of view.dfa.delta) {
      for (const [sym, to] of row) {
        const key = `${from}->${to}`;
        const g = groups.get(key) ?? { from, to, symbols: [] };
        g.symbols.push(sym);
        groups.set(key, g);
      }
    }
    return [...groups.values()].map((g) => {
      const key = `${g.from}->${g.to}`;
      const isActive = key === activeEdgeKey;
      return {
        id: key,
        source: g.from,
        target: g.to,
        type: 'automata',
        className: isActive ? 'is-active' : '',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isActive ? '#38E1FF' : 'rgba(157,176,206,0.6)',
          width: 18,
          height: 18,
        },
        data: { label: [...g.symbols].sort().join(', '), active: isActive },
      } satisfies Edge;
    });
  }, [view, activeEdgeKey]);

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
        minZoom={0.4}
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

export function AutomatonGraph(props: AutomatonGraphProps) {
  return (
    <ReactFlowProvider>
      <Inner {...props} />
    </ReactFlowProvider>
  );
}
