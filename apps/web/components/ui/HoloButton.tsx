'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';

type Intent = 'primary' | 'ghost' | 'danger' | 'success';

const intents: Record<Intent, string> = {
  primary: 'border-arc-cyan/50 bg-arc-cyan/10 text-arc-cyan hover:bg-arc-cyan/20 hover:shadow-glow',
  ghost: 'border-ink-low/30 bg-white/0 text-ink-mid hover:border-arc-cyan/40 hover:text-ink-hi',
  danger: 'border-reject/50 bg-reject/10 text-reject hover:bg-reject/20',
  success: 'border-accept/50 bg-accept/10 text-accept hover:bg-accept/20',
};

type NativeButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd'
>;

interface HoloButtonProps extends NativeButtonProps {
  intent?: Intent;
  children: ReactNode;
}

export function HoloButton({
  intent = 'primary',
  className = '',
  children,
  ...rest
}: HoloButtonProps) {
  return (
    <motion.button
      {...rest}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.95, y: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 24 }}
      className={`inline-flex select-none items-center justify-center gap-2 rounded-xl border px-4 py-2 font-medium tracking-wide transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-cyan/60 disabled:cursor-not-allowed disabled:opacity-40 ${intents[intent]} ${className}`}
    >
      {children}
    </motion.button>
  );
}
