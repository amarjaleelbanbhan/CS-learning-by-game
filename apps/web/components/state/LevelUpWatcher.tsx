'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { levelFromXp, useGameStore } from './gameStore';
import { useHasMounted } from '@/components/hud/useHasMounted';
import { useCompanionStore } from '@/components/companion/companionStore';
import { playSfx } from '@/lib/fx/sound';

/**
 * Watches XP for level-ups and fires a full-screen celebration + companion
 * line + sound. Generic (reads only xp/level), so it keeps working unchanged
 * as new subject plugins add their own missions.
 */
export function LevelUpWatcher() {
  const mounted = useHasMounted();
  const xp = useGameStore((s) => s.xp);
  const say = useCompanionStore((s) => s.say);
  const prevLevel = useRef<number | null>(null);
  const [burstLevel, setBurstLevel] = useState<number | null>(null);

  useEffect(() => {
    if (!mounted) return;
    const { level } = levelFromXp(xp);
    if (prevLevel.current === null) {
      prevLevel.current = level;
      return;
    }
    if (level > prevLevel.current) {
      prevLevel.current = level;
      setBurstLevel(level);
      playSfx('levelup');
      say('level-up');
      const t = setTimeout(() => setBurstLevel(null), 2200);
      return () => clearTimeout(t);
    }
  }, [xp, mounted, say]);

  return (
    <AnimatePresence>
      {burstLevel !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none fixed inset-0 z-[70] grid place-items-center"
        >
          <motion.div
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.1, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 16 }}
            className="flex flex-col items-center"
          >
            <div
              className="h-28 w-28 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(56,225,255,0.5), transparent 70%)',
                filter: 'blur(2px)',
              }}
            />
            <div className="-mt-20 font-display text-5xl font-extrabold text-glow">
              {burstLevel}
            </div>
            <div className="mt-1 font-display text-sm uppercase tracking-[0.3em] text-arc-cyan">
              Level Up
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
