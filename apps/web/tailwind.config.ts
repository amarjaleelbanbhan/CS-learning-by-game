import type { Config } from 'tailwindcss';

/**
 * Arc Lab HUD design tokens (see docs/03-DESIGN-SYSTEM.md). These mirror the CSS
 * variables in globals.css; using rgb(var(--x)) keeps a single source of truth
 * and lets us theme per-subject later.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#05070D',
        panel: 'rgba(11,18,32,0.72)',
        elevated: '#111A2E',
        arc: {
          cyan: '#38E1FF',
          blue: '#2D7BFF',
          gold: '#FFC24B',
          violet: '#9B6BFF',
        },
        accept: '#36F2A6',
        reject: '#FF5C7A',
        ink: {
          hi: '#EAF2FF',
          mid: '#9DB0CE',
          low: '#5C6E8C',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(56,225,255,0.18), 0 0 24px rgba(56,225,255,0.12)',
        'glow-strong': '0 0 0 1px rgba(56,225,255,0.4), 0 0 40px rgba(56,225,255,0.3)',
        accept: '0 0 0 2px rgba(54,242,166,0.6), 0 0 36px rgba(54,242,166,0.4)',
        reject: '0 0 0 2px rgba(255,92,122,0.6), 0 0 36px rgba(255,92,122,0.4)',
      },
      keyframes: {
        'pulse-ring': {
          '0%,100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.06)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 2.4s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
};

export default config;
