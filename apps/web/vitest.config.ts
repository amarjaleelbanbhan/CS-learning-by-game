import { defineConfig } from 'vitest/config';
import path from 'node:path';

/**
 * Scoped to pure logic only (lib/**), not components — testing React Flow
 * editors needs jsdom + Testing Library wiring that isn't set up here yet.
 * Anything that touches the DOM should go through preview-based verification
 * until that's added.
 */
export default defineConfig({
  test: {
    include: ['lib/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
