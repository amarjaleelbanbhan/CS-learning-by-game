'use client';

import { motion } from 'framer-motion';

/** The arc-reactor glyph — shared by the boot cinematic and the landing hero. */
export function ReactorCore({ size = 140, animate = true }: { size?: number; animate?: boolean }) {
  const c = size / 2;
  const rings = [size * 0.41, size * 0.31, size * 0.21];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="presentation">
      {rings.map((r, i) => (
        <motion.circle
          key={r}
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke="#38E1FF"
          strokeWidth={2}
          strokeDasharray={2 * Math.PI * r}
          initial={animate ? { strokeDashoffset: 2 * Math.PI * r, opacity: 0 } : false}
          animate={
            animate ? { strokeDashoffset: 0, opacity: 0.8 - i * 0.15 } : { opacity: 0.8 - i * 0.15 }
          }
          transition={{ duration: 0.9, delay: i * 0.15, ease: 'easeOut' }}
          style={{ filter: 'drop-shadow(0 0 6px rgba(56,225,255,0.7))' }}
        />
      ))}
      <motion.circle
        cx={c}
        cy={c}
        r={size * 0.1}
        fill="#38E1FF"
        initial={animate ? { opacity: 0, scale: 0.3 } : false}
        animate={
          animate ? { opacity: 1, scale: [0.3, 1.3, 1] } : { opacity: 1, scale: [1, 1.08, 1] }
        }
        transition={
          animate
            ? { duration: 0.8, delay: 0.5 }
            : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
        }
        style={{ filter: 'drop-shadow(0 0 20px rgba(56,225,255,0.9))' }}
      />
    </svg>
  );
}
