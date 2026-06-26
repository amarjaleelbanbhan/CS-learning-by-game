'use client';

import { motion } from 'framer-motion';

export function Tape({ input, position }: { input: string; position: number }) {
  const chars = [...input];
  if (chars.length === 0) {
    return <div className="font-mono text-sm text-ink-low">ε (empty string)</div>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {chars.map((ch, i) => {
        const consumed = i < position;
        const justRead = i === position - 1;
        return (
          <motion.div
            key={i}
            animate={{
              scale: justRead ? 1.12 : 1,
              borderColor: justRead
                ? 'rgba(56,225,255,0.9)'
                : consumed
                  ? 'rgba(54,242,166,0.4)'
                  : 'rgba(92,110,140,0.35)',
            }}
            className={`grid h-10 w-9 place-items-center rounded-lg border-2 font-mono text-lg ${
              justRead
                ? 'bg-arc-cyan/15 text-arc-cyan shadow-glow'
                : consumed
                  ? 'bg-accept/5 text-accept/80'
                  : 'bg-elevated/40 text-ink-mid'
            }`}
          >
            {ch}
          </motion.div>
        );
      })}
    </div>
  );
}
