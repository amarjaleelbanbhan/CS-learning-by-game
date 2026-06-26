import { describe, expect, it } from 'vitest';
import {
  err,
  expect as expectResult,
  isErr,
  isOk,
  mapResult,
  ok,
  unwrapOr,
} from '../src/result.js';

describe('Result', () => {
  it('constructs ok and err', () => {
    expect(isOk(ok(1))).toBe(true);
    expect(isErr(err('boom'))).toBe(true);
  });

  it('maps only over ok', () => {
    expect(mapResult(ok(2), (n) => n * 3)).toEqual(ok(6));
    expect(mapResult(err<string>('e'), (n: number) => n * 3)).toEqual(err('e'));
  });

  it('unwrapOr falls back on err', () => {
    expect(unwrapOr(ok(5), 0)).toBe(5);
    expect(unwrapOr(err('e'), 0)).toBe(0);
  });

  it('expect throws on err', () => {
    expect(() => expectResult(err('nope'), 'failed')).toThrow(/failed: nope/);
  });
});
