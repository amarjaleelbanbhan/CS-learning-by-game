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
  const w = node.width ?? 64;
  const h = node.height ?? 64;
  return { x: p.x + w / 2, y: p.y + h / 2 };
}

export interface BuilderEdgeData {
  label: string;
  isSelected: boolean;
}

/** Same floating-geometry technique as the read-only labs' edges (deliberately
 * duplicated — this one additionally supports a click-to-select highlight,
 * which the read-only renderers have no reason to carry). */
export function BuilderEdge({ id, source, target, data }: EdgeProps<BuilderEdgeData>) {
  const sourceNode = useStore(
    useCallback((s: ReactFlowState) => s.nodeInternals.get(source), [source]),
  ) as NodeLike | undefined;
  const targetNode = useStore(
    useCallback((s: ReactFlowState) => s.nodeInternals.get(target), [target]),
  ) as NodeLike | undefined;

  if (!sourceNode || !targetNode) return null;

  const sc = centerOf(sourceNode);
  const tc = centerOf(targetNode);
  const selected = Boolean(data?.isSelected);

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
      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke: selected ? '#38E1FF' : 'rgba(157,176,206,0.55)',
          strokeWidth: selected ? 3 : 2,
          filter: selected ? 'drop-shadow(0 0 6px rgba(56,225,255,0.8))' : 'none',
          cursor: 'pointer',
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'none',
          }}
          className={`rounded-md border px-1.5 py-0.5 font-mono text-xs ${
            selected
              ? 'border-arc-cyan/70 bg-void/90 text-arc-cyan'
              : 'border-ink-low/25 bg-void/85 text-ink-mid'
          }`}
        >
          {data?.label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
