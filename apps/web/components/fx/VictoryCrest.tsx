'use client';

import { motion } from 'framer-motion';

export function VictoryCrest({ icon = 'checkmark' }: { icon?: 'checkmark' | 'shield' }) {
  return (
    <div className="relative flex items-center justify-center h-28 w-28 mx-auto mb-4">
      {/* Glow aura */}
      <div className="absolute inset-0 rounded-full bg-accept/10 blur-xl animate-pulse" />

      {/* Outer rotating gear */}
      <motion.svg
        className="absolute inset-0 text-accept/30 pointer-events-none"
        viewBox="0 0 100 100"
        animate={{ rotate: 360 }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
      >
        <circle
          cx="50"
          cy="50"
          r="44"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="6, 8"
          fill="none"
        />
        <circle
          cx="50"
          cy="50"
          r="48"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="3, 14"
          fill="none"
        />
      </motion.svg>

      {/* Inner counter-rotating ring */}
      <motion.svg
        className="absolute inset-2 text-accept/50 pointer-events-none"
        viewBox="0 0 100 100"
        animate={{ rotate: -360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      >
        <circle
          cx="50"
          cy="50"
          r="40"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="15, 10, 5, 10"
          fill="none"
        />
      </motion.svg>

      {/* Core ring */}
      <div className="absolute inset-4 rounded-full border border-accept/60 bg-void/90 flex items-center justify-center shadow-[0_0_24px_rgba(54,242,166,0.3)] z-10">
        {icon === 'shield' ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#36F2A6"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8 drop-shadow-[0_0_6px_rgba(54,242,166,0.6)]"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#36F2A6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8 drop-shadow-[0_0_6px_rgba(54,242,166,0.6)]"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>

      {/* Tiny floating particle dots */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {[...Array(6)].map((_, idx) => {
          const angle = (idx * 360) / 6;
          const rad = (angle * Math.PI) / 180;
          const tx = Math.cos(rad) * 46;
          const ty = Math.sin(rad) * 46;
          return (
            <motion.div
              key={idx}
              className="absolute h-1.5 w-1.5 rounded-full bg-accept"
              initial={{ x: 0, y: 0, opacity: 0.8, scale: 0.5 }}
              animate={{ x: tx, y: ty, opacity: 0, scale: 1 }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                delay: idx * 0.3,
                ease: 'easeOut',
              }}
              style={{
                left: 'calc(50% - 3px)',
                top: 'calc(50% - 3px)',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
