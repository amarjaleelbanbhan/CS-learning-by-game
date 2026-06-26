/**
 * Project ARC Reactor — canonical design tokens ("Arc Lab HUD").
 *
 * This file is the SINGLE SOURCE OF TRUTH for the visual identity. The Tailwind
 * preset (tailwind-preset.cjs) mirrors these values for class generation; a test
 * (test/tokens.test.ts) fails CI if the two ever drift apart.
 *
 * Never hard-code colors/shadows/timings in components — import from here (or use
 * the Tailwind classes the preset generates from these values).
 */
export const tokens = {
  color: {
    void: '#05070D',
    panel: 'rgba(11,18,32,0.72)',
    elevated: '#111A2E',
    arcCyan: '#38E1FF',
    arcBlue: '#2D7BFF',
    arcGold: '#FFC24B',
    arcViolet: '#9B6BFF',
    accept: '#36F2A6',
    reject: '#FF5C7A',
    inkHi: '#EAF2FF',
    inkMid: '#9DB0CE',
    inkLow: '#5C6E8C',
  },
  shadow: {
    glow: '0 0 0 1px rgba(56,225,255,0.18), 0 0 24px rgba(56,225,255,0.12)',
    glowStrong: '0 0 0 1px rgba(56,225,255,0.4), 0 0 40px rgba(56,225,255,0.3)',
    accept: '0 0 0 2px rgba(54,242,166,0.6), 0 0 36px rgba(54,242,166,0.4)',
    reject: '0 0 0 2px rgba(255,92,122,0.6), 0 0 36px rgba(255,92,122,0.4)',
  },
  /** Motion durations are in milliseconds; easings are CSS cubic-beziers. */
  motion: {
    durFast: 120,
    durBase: 240,
    durSlow: 480,
    durCine: 900,
    easeOut: 'cubic-bezier(.16,1,.3,1)',
    easeInOut: 'cubic-bezier(.65,0,.35,1)',
    easeEnergy: 'cubic-bezier(.34,1.56,.64,1)',
  },
} as const;

export type Tokens = typeof tokens;
