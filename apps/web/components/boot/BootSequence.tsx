'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePrefersReducedMotion } from '@/lib/fx/usePrefersReducedMotion';
import { playSfx } from '@/lib/fx/sound';
import { ReactorCore } from '@/components/fx/ReactorCore';

const LOG_LINES = [
  'INITIALIZING ARC REACTOR CORE...',
  'CALIBRATING AUTOMATA ENGINE...',
  'AI COMPANION — ARIA — ONLINE',
  'IDENTITY SIGNATURE DETECTED',
];

type Stage = 'spark' | 'reactor' | 'log' | 'mission' | 'doors';
const ORDER: Stage[] = ['spark', 'reactor', 'log', 'mission', 'doors'];
const DURATIONS: Record<Stage, number> = {
  spark: 1000,
  reactor: 1500,
  log: 2000,
  mission: 1700,
  doors: 900,
};

/**
 * The "first 30 seconds" cinematic. Plays once per browser (gated by
 * BootGate), is always skippable, and collapses to a near-instant fade for
 * prefers-reduced-motion so it never traps or disorients anyone (NFR-A11Y-1).
 */
export function BootSequence({ onDone }: { onDone: () => void }) {
  const reducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const stage = ORDER[index]!;

  useEffect(() => {
    if (!reducedMotion) return;
    const t = setTimeout(onDone, 250);
    return () => clearTimeout(t);
  }, [reducedMotion, onDone]);

  useEffect(() => {
    if (reducedMotion) return;
    if (stage === 'reactor') playSfx('boot');
    const isLast = index >= ORDER.length - 1;
    const t = setTimeout(() => (isLast ? onDone() : setIndex((i) => i + 1)), DURATIONS[stage]);
    return () => clearTimeout(t);
  }, [index, stage, reducedMotion, onDone]);

  if (reducedMotion) {
    return <div className="fixed inset-0 z-[100] bg-void" aria-hidden="true" />;
  }

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-void">
      <button
        onClick={onDone}
        className="absolute right-5 top-5 z-50 rounded-lg border border-ink-low/30 px-3 py-1.5 font-mono text-xs text-ink-mid transition-colors hover:border-arc-cyan/40 hover:text-ink-hi"
      >
        Skip ▶
      </button>

      <div className="relative grid h-full place-items-center px-6">
        <AnimatePresence mode="wait">
          {stage === 'spark' && (
            <motion.div
              key="spark"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="h-2 w-2 rounded-full bg-arc-cyan"
              style={{ boxShadow: '0 0 30px 10px rgba(56,225,255,0.7)' }}
            />
          )}

          {stage === 'reactor' && (
            <motion.div
              key="reactor"
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6"
            >
              <ReactorCore />
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="font-display text-sm uppercase tracking-[0.4em] text-arc-cyan text-glow"
              >
                Power Restored
              </motion.div>
            </motion.div>
          )}

          {stage === 'log' && (
            <motion.div
              key="log"
              exit={{ opacity: 0 }}
              className="w-[min(90vw,520px)] space-y-2 font-mono text-sm text-arc-cyan/90"
            >
              {LOG_LINES.map((line, i) => (
                <motion.div
                  key={line}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.4 }}
                >
                  <span className="text-ink-low">{'>'}</span> {line}
                </motion.div>
              ))}
            </motion.div>
          )}

          {stage === 'mission' && (
            <motion.div
              key="mission"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div className="font-display text-3xl font-extrabold text-glow sm:text-4xl">
                MISSION ASSIGNED
              </div>
              <div className="mt-3 font-mono text-xs uppercase tracking-[0.3em] text-ink-mid sm:text-sm">
                Theory of Automata Laboratory — Unlocked
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {stage === 'doors' && (
          <>
            <motion.div
              initial={{ x: 0 }}
              animate={{ x: '-100%' }}
              transition={{ duration: 0.8, ease: [0.65, 0, 0.35, 1] }}
              className="absolute inset-y-0 left-0 w-1/2 border-r border-arc-cyan/30 bg-void"
            />
            <motion.div
              initial={{ x: 0 }}
              animate={{ x: '100%' }}
              transition={{ duration: 0.8, ease: [0.65, 0, 0.35, 1] }}
              className="absolute inset-y-0 right-0 w-1/2 border-l border-arc-cyan/30 bg-void"
            />
          </>
        )}
      </div>
    </div>
  );
}
