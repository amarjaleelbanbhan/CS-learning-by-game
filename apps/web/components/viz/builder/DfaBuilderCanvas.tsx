'use client';

import { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  ReactFlowProvider,
  type Connection,
  type Node,
  type NodeMouseHandler,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { AnimatePresence } from 'framer-motion';
import { HoloButton } from '@/components/ui/HoloButton';
import {
  addOrExtendEdge,
  addState as addStateToModel,
  deleteEdge as deleteEdgeFromModel,
  deleteState as deleteStateFromModel,
  moveState,
  renameState as renameStateInModel,
  setStart as setStartInModel,
  toggleAccepting as toggleAcceptingInModel,
  usedSymbolTargets,
  type BuilderModel,
} from '@/lib/automata/builder-types';
import { BuilderStateNode, type BuilderStateNodeData } from './BuilderStateNode';
import { BuilderEdge, type BuilderEdgeData } from './BuilderEdge';
import { SymbolPicker } from './SymbolPicker';

const nodeTypes = { builder: BuilderStateNode };
const edgeTypes = { builder: BuilderEdge };

export interface DfaBuilderCanvasProps {
  alphabet: readonly string[];
  value: BuilderModel;
  onChange: (model: BuilderModel) => void;
  height?: number;
  /** Hint targets — a gentle pulse on the indicated state/edge. */
  highlightStateId?: string | null;
  highlightEdgeId?: string | null;
  /** Shows a rename input in the state panel — for missions where the player must
   * label states themselves (e.g. subset names like "q0,q1" in NFA→DFA construction). */
  allowRename?: boolean;
}

function Inner({
  alphabet,
  value,
  onChange,
  height = 380,
  highlightStateId,
  highlightEdgeId,
  allowRename = false,
}: DfaBuilderCanvasProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [pending, setPending] = useState<{ source: string; target: string } | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [renameError, setRenameError] = useState<string | null>(null);

  const addState = useCallback(() => {
    const next = addStateToModel(value);
    const newId = next.states.at(-1)!.id;
    onChange(next);
    setSelectedNodeId(newId);
    setRenameDraft(newId);
    setRenameError(null);
  }, [value, onChange]);

  const setStart = useCallback(
    (id: string) => onChange(setStartInModel(value, id)),
    [value, onChange],
  );

  const toggleAccepting = useCallback(
    (id: string) => onChange(toggleAcceptingInModel(value, id)),
    [value, onChange],
  );

  const deleteState = useCallback(
    (id: string) => {
      onChange(deleteStateFromModel(value, id));
      setSelectedNodeId(null);
    },
    [value, onChange],
  );

  const deleteEdge = useCallback(
    (id: string) => {
      onChange(deleteEdgeFromModel(value, id));
      setSelectedEdgeId(null);
    },
    [value, onChange],
  );

  const onConnect = useCallback((conn: Connection) => {
    if (!conn.source || !conn.target) return;
    setPending({ source: conn.source, target: conn.target });
  }, []);

  const resolveSymbol = useCallback(
    (symbol: string) => {
      if (!pending) return;
      onChange(addOrExtendEdge(value, pending.source, pending.target, symbol));
      setPending(null);
    },
    [pending, value, onChange],
  );

  const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
    setSelectedNodeId(node.id);
    setSelectedEdgeId(null);
    setRenameDraft(node.id);
    setRenameError(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, []);

  const commitRename = useCallback(() => {
    if (!selectedNodeId) return;
    const { model: next, error } = renameStateInModel(value, selectedNodeId, renameDraft);
    if (error) {
      setRenameError(error);
      return;
    }
    setRenameError(null);
    onChange(next);
    setSelectedNodeId(renameDraft.trim());
  }, [selectedNodeId, renameDraft, value, onChange]);

  const onNodeDragStop = useCallback(
    (_: unknown, node: Node) => {
      onChange(moveState(value, node.id, node.position.x, node.position.y));
    },
    [value, onChange],
  );

  const nodes: Node<BuilderStateNodeData>[] = useMemo(
    () =>
      value.states.map((s) => ({
        id: s.id,
        type: 'builder',
        position: { x: s.x, y: s.y },
        data: {
          label: s.id,
          isStart: s.isStart,
          isAccepting: s.isAccepting,
          isSelected: s.id === selectedNodeId || s.id === highlightStateId,
        },
      })),
    [value.states, selectedNodeId, highlightStateId],
  );

  const edges = useMemo(
    () =>
      value.edges.map((e) => ({
        id: e.id,
        source: e.from,
        target: e.to,
        type: 'builder',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: 'rgba(157,176,206,0.7)',
          width: 16,
          height: 16,
        },
        data: {
          label: [...e.symbols].sort().join(', '),
          isSelected: e.id === selectedEdgeId || e.id === highlightEdgeId,
        } satisfies BuilderEdgeData,
      })),
    [value.edges, selectedEdgeId, highlightEdgeId],
  );

  const selectedState = value.states.find((s) => s.id === selectedNodeId) ?? null;
  const selectedEdge = value.edges.find((e) => e.id === selectedEdgeId) ?? null;

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_180px]">
      <div
        style={{ height }}
        className="overflow-hidden rounded-xl border border-arc-cyan/10 bg-void/40"
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onEdgeClick={(_, edge) => {
            setSelectedEdgeId(edge.id);
            setSelectedNodeId(null);
          }}
          onPaneClick={onPaneClick}
          onNodeDragStop={onNodeDragStop}
          fitView
          fitViewOptions={{ padding: 0.4 }}
          minZoom={0.4}
          maxZoom={1.8}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={26}
            size={1}
            color="rgba(56,225,255,0.14)"
          />
          <Controls showInteractive={false} className="!border-arc-cyan/20 !bg-void/70" />
        </ReactFlow>
      </div>

      <div className="flex flex-col gap-2">
        <HoloButton onClick={addState} className="w-full text-xs">
          + Add State
        </HoloButton>

        {selectedState && (
          <div className="rounded-xl border border-arc-cyan/20 bg-void/50 p-3">
            {allowRename ? (
              <div className="mb-2">
                <div className="flex gap-1">
                  <input
                    value={renameDraft}
                    onChange={(e) => {
                      setRenameDraft(e.target.value);
                      setRenameError(null);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && commitRename()}
                    spellCheck={false}
                    className="w-full rounded-lg border border-ink-low/25 bg-void/60 px-2 py-1 font-mono text-xs text-ink-hi outline-none focus:border-arc-cyan/50"
                  />
                  <button
                    onClick={commitRename}
                    className="rounded-lg border border-arc-cyan/30 px-2 text-xs text-arc-cyan hover:bg-arc-cyan/10"
                  >
                    ✓
                  </button>
                </div>
                {renameError && <p className="mt-1 text-[10px] text-reject">{renameError}</p>}
              </div>
            ) : (
              <div className="mb-2 font-mono text-xs text-arc-cyan">{selectedState.id}</div>
            )}
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => setStart(selectedState.id)}
                disabled={selectedState.isStart}
                className="rounded-lg border border-ink-low/25 px-2 py-1 text-left text-xs text-ink-mid transition-colors hover:border-arc-cyan/40 hover:text-ink-hi disabled:opacity-40"
              >
                {selectedState.isStart ? '★ Start state' : 'Set as start'}
              </button>
              <button
                onClick={() => toggleAccepting(selectedState.id)}
                className="rounded-lg border border-ink-low/25 px-2 py-1 text-left text-xs text-ink-mid transition-colors hover:border-arc-cyan/40 hover:text-ink-hi"
              >
                {selectedState.isAccepting ? '✓ Accepting' : 'Mark accepting'}
              </button>
              <button
                onClick={() => deleteState(selectedState.id)}
                className="rounded-lg border border-reject/25 px-2 py-1 text-left text-xs text-reject transition-colors hover:bg-reject/10"
              >
                ✕ Delete state
              </button>
            </div>
          </div>
        )}

        {selectedEdge && (
          <div className="rounded-xl border border-arc-cyan/20 bg-void/50 p-3">
            <div className="mb-2 font-mono text-xs text-arc-cyan">
              {selectedEdge.from} → {selectedEdge.to}
            </div>
            <div className="mb-2 font-mono text-xs text-ink-mid">
              on {selectedEdge.symbols.join(', ')}
            </div>
            <button
              onClick={() => deleteEdge(selectedEdge.id)}
              className="w-full rounded-lg border border-reject/25 px-2 py-1 text-xs text-reject transition-colors hover:bg-reject/10"
            >
              ✕ Delete transition
            </button>
          </div>
        )}

        {!selectedState && !selectedEdge && (
          <p className="rounded-xl border border-ink-low/15 p-3 text-xs text-ink-low">
            Click a state to set start/accept. Drag from one state to another to draw a transition.
          </p>
        )}
      </div>

      <AnimatePresence>
        {pending && (
          <SymbolPicker
            alphabet={alphabet}
            from={pending.source}
            to={pending.target}
            conflicts={usedSymbolTargets(value.edges, pending.source)}
            active={
              new Set(
                value.edges.find((e) => e.id === `${pending.source}->${pending.target}`)?.symbols,
              )
            }
            onPick={resolveSymbol}
            onClose={() => setPending(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export function DfaBuilderCanvas(props: DfaBuilderCanvasProps) {
  return (
    <ReactFlowProvider>
      <Inner {...props} />
    </ReactFlowProvider>
  );
}
