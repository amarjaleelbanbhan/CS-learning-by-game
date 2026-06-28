'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCompanionStore } from './companionStore';
import { useHasMounted } from '@/components/hud/useHasMounted';
import { ariaIdle } from '@/lib/companion/mentorActions';

/**
 * ARIA — the AI companion presence. Not a chatbot window: a persistent,
 * idle-animating orb in the corner that occasionally speaks. Real AI Tutor
 * conversation (Phase 11) will live in its own dock; this is the "character"
 * layer that gives the platform a sense of being alive even before that ships.
 */
export function Companion() {
  const mounted = useHasMounted();
  const { message, visible, dismiss } = useCompanionStore();

  if (!mounted) return null;

  return (
    <div className="fixed bottom-5 right-5 z-30 flex flex-col items-end gap-3">
      <AnimatePresence>
        {visible && message && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            className="glass relative max-w-[260px] rounded-2xl border-arc-violet/30 px-4 py-3 text-sm text-ink-hi shadow-glow"
            style={{ borderColor: 'rgba(155,107,255,0.35)' }}
          >
            <div className="mb-1 font-display text-[10px] uppercase tracking-[0.2em] text-arc-violet">
              ARIA
            </div>
            {message}
            <button
              onClick={dismiss}
              aria-label="Dismiss"
              className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full border border-ink-low/30 bg-void text-[10px] text-ink-low hover:text-ink-hi"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        aria-label="ARIA, your AI companion"
        onClick={() => ariaIdle()}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="relative grid h-14 w-14 place-items-center rounded-full border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-violet/60"
        style={{
          borderColor: 'rgba(155,107,255,0.5)',
          background:
            'radial-gradient(circle at 35% 30%, rgba(155,107,255,0.35), rgba(11,18,32,0.9))',
          boxShadow: '0 0 24px rgba(155,107,255,0.35), inset 0 0 12px rgba(155,107,255,0.25)',
        }}
      >
        <motion.span
          className="h-4 w-4 rounded-full"
          style={{ background: '#9B6BFF', boxShadow: '0 0 14px 4px rgba(155,107,255,0.8)' }}
          animate={{ scale: [1, 1.25, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <span className="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full bg-accept shadow-[0_0_6px_2px_rgba(54,242,166,0.7)]" />
      </motion.button>
    </div>
  );
}
