'use client';

import { useCallback } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  useStore,
  type EdgeProps,
  type ReactFlowState,
} from 'reactflow';

const RADIUS = 32;

interface NodeLike {
  positionAbsolute?: { x: number; y: number };
  position: { x: number; y: number };
  width?: number | null;
  height?: number | null;
}

function centerOf(node: NodeLike): { x: number; y: number } {
  const p = node.positionAbsolute ?? node.position;
  const w = node.width ?? 60;
  const h = node.height ?? 60;
  return { x: p.x + w / 2, y: p.y + h / 2 };
}

/**
 * Floating, curved edge for automata diagrams. Computes geometry from node
 * centers (not fixed handle positions) so transitions look clean from any angle,
 * curves bidirectional pairs apart, and draws self-loops as arcs above the state.
 */
export function AutomataEdge({ id, source, target, markerEnd, data }: EdgeProps) {
  const sourceNode = useStore(
    useCallback((s: ReactFlowState) => s.nodeInternals.get(source), [source]),
  ) as NodeLike | undefined;
  const targetNode = useStore(
    useCallback((s: ReactFlowState) => s.nodeInternals.get(target), [target]),
  ) as NodeLike | undefined;

  if (!sourceNode || !targetNode) return null;

  const sc = centerOf(sourceNode);
  const tc = centerOf(targetNode);
  const active = Boolean(data?.active);

  let path: string;
  let labelX: number;
  let labelY: number;

  if (source === target) {
    const top = sc.y - RADIUS;
    path = `M ${sc.x - 12},${top + 6} C ${sc.x - 54},${top - 54} ${sc.x + 54},${top - 54} ${sc.x + 12},${top + 6}`;
    labelX = sc.x;
    labelY = top - 46;
  } else {
    const dx = tc.x - sc.x;
    const dy = tc.y - sc.y;
    const dist = Math.hypot(dx, dy) || 1;
    const ux = dx / dist;
    const uy = dy / dist;
    const px = -uy;
    const py = ux;
    const curve = 30 * (source < target ? 1 : -1);
    const sx = sc.x + ux * RADIUS;
    const sy = sc.y + uy * RADIUS;
    const tx = tc.x - ux * RADIUS;
    const ty = tc.y - uy * RADIUS;
    const mx = (sx + tx) / 2 + px * curve;
    const my = (sy + ty) / 2 + py * curve;
    path = `M ${sx},${sy} Q ${mx},${my} ${tx},${ty}`;
    labelX = mx;
    labelY = my;
  }

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'none',
          }}
          className={`rounded-md border px-1.5 py-0.5 font-mono text-xs transition-colors ${
            active
              ? 'border-arc-cyan/60 bg-void/90 text-arc-cyan'
              : 'border-ink-low/20 bg-void/80 text-ink-mid'
          }`}
        >
          {String(data?.label ?? '')}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
