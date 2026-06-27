'use client';

import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';

export interface BuilderStateNodeData {
  label: string;
  isStart: boolean;
  isAccepting: boolean;
  isSelected: boolean;
}

/** Editable counterpart to the read-only StateNode: a dashed cyan ring marks
 * the currently-selected state so the side panel's actions are unambiguous. */
export function BuilderStateNode({ data }: { data: BuilderStateNodeData }) {
  return (
    <div className="relative grid h-[64px] w-[64px] cursor-pointer place-items-center">
      {data.isStart && (
        <div className="absolute -left-8 top-1/2 -translate-y-1/2 select-none text-2xl leading-none text-arc-cyan/80">
          ➜
        </div>
      )}

      {data.isSelected && (
        <motion.span
          className="pointer-events-none absolute h-[72px] w-[72px] rounded-full border-2 border-dashed border-arc-cyan"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />
      )}

      <div
        className={`relative grid h-[60px] w-[60px] place-items-center rounded-full border-2 font-mono text-sm transition-colors ${
          data.isSelected
            ? 'border-arc-cyan bg-arc-cyan/15 text-arc-cyan shadow-glow'
            : 'border-ink-low/50 bg-elevated/70 text-ink-hi hover:border-arc-cyan/40'
        }`}
      >
        {data.isAccepting && (
          <span className="pointer-events-none absolute h-[50px] w-[50px] rounded-full border-2 border-ink-low/60" />
        )}
        {data.label}
      </div>

      <Handle
        type="target"
        position={Position.Top}
        className="!h-2 !w-2 !border-arc-cyan !bg-void"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !border-arc-cyan !bg-void"
      />
    </div>
  );
}
