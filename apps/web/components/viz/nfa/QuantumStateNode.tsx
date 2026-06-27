'use client';

import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';

export type BranchStatus = 'dormant' | 'active' | 'dying' | 'accepted';

export interface QuantumStateNodeData {
  label: string;
  isStart: boolean;
  isAccepting: boolean;
  status: BranchStatus;
}

const RING_COLOR: Record<BranchStatus, string> = {
  dormant: 'rgba(92,110,140,0.5)',
  active: '#9B6BFF',
  dying: '#FF5C7A',
  accepted: '#38E1FF',
};

/**
 * The NFA Lab's signature node: unlike the DFA Lab's single steady glow, a
 * quantum state can be simultaneously "alive" in several places at once. Status
 * communicates through color AND shape/motion (never color alone, NFR-A11Y-2):
 * active = pulsing violet halo with orbiting motes, dying = one-shot dissolve
 * into drifting particles (still leaves a faint red ring after), accepted =
 * a bright cyan detonation that settles into a steady glow.
 */
export function QuantumStateNode({ data }: { data: QuantumStateNodeData }) {
  const { status } = data;
  return (
    <div className="relative grid h-[64px] w-[64px] place-items-center">
      {data.isStart && (
        <div className="absolute -left-8 top-1/2 -translate-y-1/2 select-none text-2xl leading-none text-arc-violet/80">
          ➜
        </div>
      )}

      {status === 'active' && (
        <>
          <motion.span
            className="pointer-events-none absolute h-20 w-20 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(155,107,255,0.35), transparent 70%)',
            }}
            animate={{ scale: [0.9, 1.15, 0.9], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="pointer-events-none absolute h-1.5 w-1.5 rounded-full bg-arc-violet"
              style={{ boxShadow: '0 0 6px 2px rgba(155,107,255,0.8)' }}
              animate={{
                x: [0, Math.cos((i * 2 * Math.PI) / 3) * 38, 0],
                y: [0, Math.sin((i * 2 * Math.PI) / 3) * 38, 0],
                opacity: [0, 1, 0],
              }}
              transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }}
            />
          ))}
        </>
      )}

      {status === 'dying' && (
        <motion.div
          className="pointer-events-none absolute inset-0"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.span
              key={i}
              className="absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-reject"
              initial={{ x: 0, y: 0, opacity: 1 }}
              animate={{
                x: Math.cos((i * Math.PI) / 3) * 30,
                y: Math.sin((i * Math.PI) / 3) * 30,
                opacity: 0,
              }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            />
          ))}
        </motion.div>
      )}

      {status === 'accepted' && (
        <motion.span
          className="pointer-events-none absolute h-24 w-24 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(56,225,255,0.55), transparent 70%)' }}
          initial={{ scale: 0.3, opacity: 1 }}
          animate={{ scale: [0.3, 1.6, 1.1], opacity: [1, 0.5, 0.7] }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      )}

      <motion.div
        animate={{
          scale: status === 'active' || status === 'accepted' ? 1.12 : 1,
          opacity: status === 'dying' ? 0.35 : 1,
        }}
        transition={{ type: 'spring', stiffness: 280, damping: 18 }}
        className="relative grid h-[60px] w-[60px] place-items-center rounded-full border-2 px-1 text-center font-mono text-sm"
        style={{
          borderColor: RING_COLOR[status],
          background: status === 'dormant' ? 'rgba(17,26,46,0.7)' : `${RING_COLOR[status]}22`,
          boxShadow:
            status === 'active'
              ? '0 0 22px rgba(155,107,255,0.55)'
              : status === 'accepted'
                ? '0 0 28px rgba(56,225,255,0.7)'
                : 'none',
          color: status === 'dormant' ? '#EAF2FF' : RING_COLOR[status],
        }}
      >
        {data.isAccepting && (
          <span
            className="pointer-events-none absolute h-[50px] w-[50px] rounded-full border-2 border-dashed"
            style={{ borderColor: RING_COLOR[status] }}
          />
        )}
        {data.label}
      </motion.div>

      <Handle
        type="target"
        position={Position.Top}
        className="!h-1 !w-1 !border-0 !bg-transparent"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-1 !w-1 !border-0 !bg-transparent"
      />
    </div>
  );
}
