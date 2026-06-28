import { describe, expect, it } from 'vitest';
import {
  canRedoHistory,
  canUndoHistory,
  initHistory,
  pushHistory,
  redoHistory,
  undoHistory,
} from './history';

describe('history', () => {
  it('starts with no undo/redo available', () => {
    const h = initHistory(0);
    expect(h.present).toBe(0);
    expect(canUndoHistory(h)).toBe(false);
    expect(canRedoHistory(h)).toBe(false);
  });

  it('push records the present as a new undo point', () => {
    let h = initHistory('a');
    h = pushHistory(h, 'b');
    expect(h.present).toBe('b');
    expect(canUndoHistory(h)).toBe(true);
    expect(canRedoHistory(h)).toBe(false);
  });

  it('undo restores the previous value and enables redo', () => {
    let h = initHistory('a');
    h = pushHistory(h, 'b');
    h = undoHistory(h);
    expect(h.present).toBe('a');
    expect(canUndoHistory(h)).toBe(false);
    expect(canRedoHistory(h)).toBe(true);
  });

  it('redo restores the undone value', () => {
    let h = initHistory('a');
    h = pushHistory(h, 'b');
    h = undoHistory(h);
    h = redoHistory(h);
    expect(h.present).toBe('b');
    expect(canRedoHistory(h)).toBe(false);
  });

  it('undo on empty history is a no-op', () => {
    const h = initHistory('a');
    expect(undoHistory(h)).toBe(h);
  });

  it('redo on empty future is a no-op', () => {
    const h = initHistory('a');
    expect(redoHistory(h)).toBe(h);
  });

  it('pushing after an undo clears the redo stack (standard undo/redo semantics)', () => {
    let h = initHistory('a');
    h = pushHistory(h, 'b');
    h = pushHistory(h, 'c');
    h = undoHistory(h); // present = 'b', redo available -> 'c'
    h = pushHistory(h, 'd'); // new branch
    expect(h.present).toBe('d');
    expect(canRedoHistory(h)).toBe(false);
  });

  it('supports a full sequence of pushes, undos, and redos in order', () => {
    let h = initHistory(0);
    h = pushHistory(h, 1);
    h = pushHistory(h, 2);
    h = pushHistory(h, 3);
    expect(h.present).toBe(3);

    h = undoHistory(h);
    expect(h.present).toBe(2);
    h = undoHistory(h);
    expect(h.present).toBe(1);
    h = redoHistory(h);
    expect(h.present).toBe(2);
    h = redoHistory(h);
    expect(h.present).toBe(3);
    h = redoHistory(h); // nothing left to redo
    expect(h.present).toBe(3);
  });
});
