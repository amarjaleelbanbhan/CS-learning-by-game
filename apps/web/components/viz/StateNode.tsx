'use client';

import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';

export interface StateNodeData {
  label: string;
  isStart: boolean;
  isAccepting: boolean;
  isActive: boolean;
}

export function StateNode({ data }: { data: StateNodeData }) {
  return (
    <div className="relative grid h-[60px] w-[60px] place-items-center">
      {data.isStart && (
        <div className="absolute -left-8 top-1/2 -translate-y-1/2 select-none text-2xl leading-none text-arc-cyan/80">
          ➜
        </div>
      )}

      <motion.div
        animate={{ scale: data.isActive ? 1.1 : 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 18 }}
        className={`relative grid h-[60px] w-[60px] place-items-center rounded-full border-2 px-1 text-center font-mono transition-colors duration-300 ${
          data.isActive
            ? 'border-arc-cyan bg-arc-cyan/15 text-arc-cyan shadow-glow-strong'
            : 'border-ink-low/50 bg-elevated/70 text-ink-hi'
        }`}
      >
        {data.isAccepting && (
          <span
            className={`pointer-events-none absolute h-[50px] w-[50px] rounded-full border-2 ${
              data.isActive ? 'border-arc-cyan' : 'border-ink-low/60'
            }`}
          />
        )}
        <span className={data.label.length > 3 ? 'text-[9px] leading-none' : 'text-sm'}>
          {data.label}
        </span>
      </motion.div>

      {/* Hidden handles satisfy React Flow; floating edges compute their own geometry. */}
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
