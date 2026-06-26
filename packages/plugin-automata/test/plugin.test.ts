import { describe, expect, it } from 'vitest';
import { PluginRegistry, validatePlugin } from '@arc/plugin-sdk';
import { automataPlugin } from '../src/index.js';

describe('automataPlugin', () => {
  it('is structurally valid and registers cleanly', () => {
    expect(validatePlugin(automataPlugin).ok).toBe(true);
    const reg = new PluginRegistry();
    expect(() => reg.register(automataPlugin)).not.toThrow();
  });

  it('generates deterministic problems from (difficulty, seed)', () => {
    const gen = automataPlugin.problemGenerators[0]!;
    const a = gen.generate({ difficulty: 3, seed: 'abc' });
    const b = gen.generate({ difficulty: 3, seed: 'abc' });
    const c = gen.generate({ difficulty: 3, seed: 'xyz' });
    expect(a).toEqual(b);
    expect(a.prompt).not.toEqual(c.prompt);
  });
});
