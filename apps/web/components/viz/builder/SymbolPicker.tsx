'use client';

import { motion } from 'framer-motion';
import { Panel } from '@/components/ui/Panel';

export interface SymbolPickerProps {
  alphabet: readonly string[];
  from: string;
  to: string;
  /** symbol -> the OTHER target it already commits to (disables that symbol). */
  conflicts: Map<string, string>;
  /** symbols already on THIS exact (from,to) edge — shown as checked/active. */
  active: Set<string>;
  onPick: (symbol: string) => void;
  onClose: () => void;
}

/** Confirms which symbol(s) drive a just-drawn transition. Conflicting
 * symbols (already committed elsewhere from the same state) are disabled —
 * a DFA can only go one place per symbol, so the editor refuses to create
 * the contradiction rather than catching it later. */
export function SymbolPicker({
  alphabet,
  from,
  to,
  conflicts,
  active,
  onPick,
  onClose,
}: SymbolPickerProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 grid place-items-center bg-void/70 backdrop-blur-sm"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.92 }}
        animate={{ scale: 1 }}
      >
        <Panel className="w-[min(90vw,360px)] p-5" glow>
          <div className="font-display text-xs uppercase tracking-wider text-ink-low">
            Transition {from} → {to}
          </div>
          <div className="mt-1 mb-4 text-sm text-ink-mid">Which symbol triggers this?</div>
          <div className="flex flex-wrap gap-2">
            {alphabet.map((sym) => {
              const conflictTarget = conflicts.get(sym);
              const isConflict = conflictTarget !== undefined && conflictTarget !== to;
              const isActive = active.has(sym);
              return (
                <button
                  key={sym}
                  disabled={isConflict}
                  onClick={() => onPick(sym)}
                  title={
                    isConflict ? `${from} already goes to ${conflictTarget} on '${sym}'` : undefined
                  }
                  className={`rounded-xl border px-4 py-2 font-mono text-lg transition-colors ${
                    isConflict
                      ? 'cursor-not-allowed border-ink-low/15 text-ink-low/40'
                      : isActive
                        ? 'border-arc-cyan/60 bg-arc-cyan/15 text-arc-cyan'
                        : 'border-ink-low/30 text-ink-hi hover:border-arc-cyan/50 hover:text-arc-cyan'
                  }`}
                >
                  {sym}
                  {isConflict && <span className="ml-1 text-[10px]">↛</span>}
                </button>
              );
            })}
          </div>
          <button
            onClick={onClose}
            className="mt-4 font-mono text-xs text-ink-low hover:text-ink-mid"
          >
            Cancel
          </button>
        </Panel>
      </motion.div>
    </motion.div>
  );
}
