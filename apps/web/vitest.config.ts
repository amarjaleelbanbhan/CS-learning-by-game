import { defineConfig } from 'vitest/config';
import path from 'node:path';

/**
 * Scoped to pure logic only — lib/**, plus the small number of non-JSX, no-React
 * `components/**\/*.test.ts` utility files (note: `.test.ts` only, never `.test.tsx` —
 * actual React Flow editor components still need jsdom + Testing Library wiring that
 * isn't set up here yet, and stay out of this glob entirely).
 * Anything that touches the DOM should go through preview-based verification
 * until that's added.
 */
export default defineConfig({
  test: {
    include: ['lib/**/*.test.ts', 'components/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
