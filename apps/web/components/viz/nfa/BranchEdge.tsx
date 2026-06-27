'use client';

import { useCallback } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  useStore,
  type EdgeProps,
  type ReactFlowState,
} from 'reactflow';
import { motion } from 'framer-motion';

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

export interface BranchEdgeData {
  label: string;
  active: boolean;
  kind: 'normal' | 'epsilon';
}

/**
 * The NFA Lab's edge renderer. Normal transitions are solid curved arrows
 * (same floating-geometry technique as the DFA Lab's edges, deliberately
 * duplicated rather than shared — the visual languages are meant to diverge).
 * ε-transitions are drawn as a dashed "energy tunnel" with pulsing portal
 * rings at both ends instead of an arrowhead: nothing flows along it like a
 * normal transition, it just connects two points that are the same instant.
 */
export function BranchEdge({ id, source, target, data }: EdgeProps<BranchEdgeData>) {
  const sourceNode = useStore(
    useCallback((s: ReactFlowState) => s.nodeInternals.get(source), [source]),
  ) as NodeLike | undefined;
  const targetNode = useStore(
    useCallback((s: ReactFlowState) => s.nodeInternals.get(target), [target]),
  ) as NodeLike | undefined;

  if (!sourceNode || !targetNode) return null;

  const sc = centerOf(sourceNode);
  const tc = centerOf(targetNode);
  const isEpsilon = data?.kind === 'epsilon';
  const active = Boolean(data?.active);

  let sx: number, sy: number, tx: number, ty: number, mx: number, my: number, path: string;

  if (source === target) {
    const top = sc.y - RADIUS;
    sx = sc.x - 12;
    sy = top + 6;
    tx = sc.x + 12;
    ty = top + 6;
    mx = sc.x;
    my = top - 46;
    path = `M ${sx},${sy} C ${sc.x - 54},${top - 54} ${sc.x + 54},${top - 54} ${tx},${ty}`;
  } else {
    const dx = tc.x - sc.x;
    const dy = tc.y - sc.y;
    const dist = Math.hypot(dx, dy) || 1;
    const ux = dx / dist;
    const uy = dy / dist;
    const px = -uy;
    const py = ux;
    const curve = 28 * (source < target ? 1 : -1);
    sx = sc.x + ux * RADIUS;
    sy = sc.y + uy * RADIUS;
    tx = tc.x - ux * RADIUS;
    ty = tc.y - uy * RADIUS;
    mx = (sx + tx) / 2 + px * curve;
    my = (sy + ty) / 2 + py * curve;
    path = `M ${sx},${sy} Q ${mx},${my} ${tx},${ty}`;
  }

  if (isEpsilon) {
    return (
      <>
        <path
          d={path}
          fill="none"
          stroke={active ? '#9B6BFF' : 'rgba(155,107,255,0.35)'}
          strokeWidth={active ? 2.5 : 1.5}
          strokeDasharray="3 7"
          style={{ filter: active ? 'drop-shadow(0 0 6px rgba(155,107,255,0.9))' : 'none' }}
        />
        <EdgeLabelRenderer>
          <PortalRing x={sx} y={sy} active={active} />
          <PortalRing x={tx} y={ty} active={active} />
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${mx}px, ${my}px)`,
              pointerEvents: 'none',
            }}
            className={`rounded-md border px-1.5 py-0.5 font-mono text-xs ${
              active
                ? 'border-arc-violet/70 bg-void/90 text-arc-violet'
                : 'border-arc-violet/25 bg-void/70 text-arc-violet/60'
            }`}
          >
            ε
          </div>
        </EdgeLabelRenderer>
      </>
    );
  }

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke: active ? '#9B6BFF' : 'rgba(157,176,206,0.45)',
          strokeWidth: active ? 3 : 2,
          filter: active ? 'drop-shadow(0 0 6px rgba(155,107,255,0.8))' : 'none',
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${mx}px, ${my}px)`,
            pointerEvents: 'none',
          }}
          className={`rounded-md border px-1.5 py-0.5 font-mono text-xs ${
            active
              ? 'border-arc-violet/60 bg-void/90 text-arc-violet'
              : 'border-ink-low/20 bg-void/80 text-ink-mid'
          }`}
        >
          {data?.label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

function PortalRing({ x, y, active }: { x: number; y: number; active: boolean }) {
  return (
    <motion.div
      style={{
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
        pointerEvents: 'none',
        width: 14,
        height: 14,
        borderRadius: '50%',
        border: '2px solid #9B6BFF',
      }}
      animate={active ? { scale: [0.6, 1.4, 0.6], opacity: [0.4, 1, 0.4] } : { opacity: 0.3 }}
      transition={active ? { duration: 1, repeat: Infinity, ease: 'easeInOut' } : {}}
    />
  );
}
