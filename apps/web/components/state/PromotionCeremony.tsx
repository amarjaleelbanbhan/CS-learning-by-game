'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { milestonesForRank } from '@arc/engine-progress';
import { CAREER_MILESTONES } from '@arc/plugin-automata';
import { useEffect } from 'react';
import { useCompanionStore } from '@/components/companion/companionStore';
import { playSfx } from '@/lib/fx/sound';
import { useCareerStore } from './careerStore';

/**
 * Full-screen promotion ceremony — fires whenever careerStore.pendingPromotion is set
 * (see CareerSyncWatcher). Mirrors LevelUpWatcher's celebration pattern but for rank,
 * not XP level, and additionally announces any milestones the new rank unlocked.
 */
export function PromotionCeremony() {
  const pending = useCareerStore((s) => s.pendingPromotion);
  const acknowledge = useCareerStore((s) => s.acknowledgePromotion);
  const say = useCompanionStore((s) => s.say);

  useEffect(() => {
    if (!pending) return;
    playSfx('levelup');
    say('promotion', `Promoted to ${pending.title}`);
  }, [pending, say]);

  const milestones = pending ? milestonesForRank(CAREER_MILESTONES, pending.id) : [];

  return (
    <AnimatePresence>
      {pending && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] grid place-items-center bg-void/80 backdrop-blur-sm"
          onClick={acknowledge}
          role="dialog"
          aria-label="Promotion ceremony"
        >
          <motion.div
            initial={{ scale: 0.6, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            className="glass relative flex max-w-md flex-col items-center gap-4 rounded-2xl border border-arc-gold/40 px-10 py-12 text-center shadow-glow"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="absolute inset-0 -z-10 rounded-2xl"
              style={{
                background:
                  'radial-gradient(circle at 50% 0%, rgba(255,196,77,0.25), transparent 70%)',
              }}
            />
            <div className="text-[11px] uppercase tracking-[0.35em] text-arc-gold">Promotion</div>
            <div className="font-display text-3xl font-extrabold text-glow">{pending.title}</div>
            {milestones.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm text-ink-mid">
                {milestones.map((m) => (
                  <li key={m.id}>✦ {m.title}</li>
                ))}
              </ul>
            )}
            <button
              onClick={acknowledge}
              className="mt-4 rounded-xl border border-arc-gold/50 bg-arc-gold/10 px-5 py-2 text-sm font-medium text-arc-gold transition-colors hover:bg-arc-gold/20"
            >
              Continue
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
