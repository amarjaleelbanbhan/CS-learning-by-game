'use client';

import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '@/lib/fx/usePrefersReducedMotion';

/**
 * The NFA Lab's atmosphere: violet quantum fog + slow light beams, distinct
 * from the DFA Lab's clean blue/mechanical stillness and the global ambient
 * ParticleField. Deliberately cheap (a handful of blurred gradients animated
 * with CSS transforms, no canvas loop) since it sits behind an already-busy
 * graph that needs the frame budget. Purely decorative; never intercepts input.
 */
export function QuantumBackdrop() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-3xl"
    >
      <motion.div
        className="absolute -left-20 -top-32 h-96 w-96 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(155,107,255,0.18), transparent 70%)' }}
        animate={reducedMotion ? undefined : { x: [0, 40, 0], y: [0, 20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-24 right-0 h-80 w-80 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(56,225,255,0.14), transparent 70%)' }}
        animate={reducedMotion ? undefined : { x: [0, -30, 0], y: [0, -16, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />
      {!reducedMotion &&
        [0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute h-px w-1/2"
            style={{
              top: `${20 + i * 28}%`,
              left: i % 2 === 0 ? '-10%' : '60%',
              background: 'linear-gradient(90deg, transparent, rgba(155,107,255,0.5), transparent)',
            }}
            animate={{ opacity: [0, 0.7, 0], x: [0, 80, 160] }}
            transition={{ duration: 5 + i, repeat: Infinity, delay: i * 1.6, ease: 'easeInOut' }}
          />
        ))}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(5,7,13,0.6)_100%)]" />
    </div>
  );
}
