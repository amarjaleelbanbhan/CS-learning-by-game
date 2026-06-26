import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { tokens } from '../src/tokens.js';

// The Tailwind preset is CommonJS (loaded by Tailwind without a build step).
const require = createRequire(import.meta.url);
const preset = require('../tailwind-preset.cjs') as {
  theme: { extend: { colors: Record<string, unknown>; boxShadow: Record<string, string> } };
};

describe('design tokens ↔ tailwind preset are in sync', () => {
  const colors = preset.theme.extend.colors as {
    void: string;
    panel: string;
    elevated: string;
    arc: { cyan: string; blue: string; gold: string; violet: string };
    accept: string;
    reject: string;
    ink: { hi: string; mid: string; low: string };
  };

  it('color values match', () => {
    expect(colors.void).toBe(tokens.color.void);
    expect(colors.panel).toBe(tokens.color.panel);
    expect(colors.elevated).toBe(tokens.color.elevated);
    expect(colors.arc.cyan).toBe(tokens.color.arcCyan);
    expect(colors.arc.blue).toBe(tokens.color.arcBlue);
    expect(colors.arc.gold).toBe(tokens.color.arcGold);
    expect(colors.arc.violet).toBe(tokens.color.arcViolet);
    expect(colors.accept).toBe(tokens.color.accept);
    expect(colors.reject).toBe(tokens.color.reject);
    expect(colors.ink.hi).toBe(tokens.color.inkHi);
    expect(colors.ink.mid).toBe(tokens.color.inkMid);
    expect(colors.ink.low).toBe(tokens.color.inkLow);
  });

  it('shadow values match', () => {
    const shadow = preset.theme.extend.boxShadow;
    expect(shadow.glow).toBe(tokens.shadow.glow);
    expect(shadow['glow-strong']).toBe(tokens.shadow.glowStrong);
    expect(shadow.accept).toBe(tokens.shadow.accept);
    expect(shadow.reject).toBe(tokens.shadow.reject);
  });
});
