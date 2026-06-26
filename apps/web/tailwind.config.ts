import type { Config } from 'tailwindcss';
import arcPreset from '@arc/design-system/tailwind-preset';

/**
 * The Arc Lab HUD theme lives in @arc/design-system (single source of truth).
 * This config only declares what to scan; all tokens come from the preset.
 */
const config: Config = {
  presets: [arcPreset as Config],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
};

export default config;
