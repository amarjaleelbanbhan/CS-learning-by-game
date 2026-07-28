'use client';

import { useMemo, useState } from 'react';
import { simulateDfa } from '@arc/engine-simulation';
import { compileToDfa, emptyBuilderModel, type BuilderModel } from '@/lib/automata/builder-types';
import { DfaBuilderCanvas } from '@/components/viz/builder/DfaBuilderCanvas';
import { HoloButton } from '@/components/ui/HoloButton';
import type { InteractionProps } from './interactions';

/**
 * Construction interaction — wraps the EXISTING DfaBuilderCanvas rather than
 * reimplementing it. The canvas keeps its states/transitions/undo-redo behaviour exactly
 * as the bespoke missions have it; this adapter only compiles the visual model into a DFA
 * and hands it to whatever grader the task names.
 *
 * That indirection is what lets the same builder serve dfa-equivalence today and
 * nfa-equivalence or a minimality grader tomorrow, with no change here.
 */
export function DfaBuilderInteraction({
  params,
  value,
  onChange,
  onSubmit,
  disabled,
}: InteractionProps) {
  const alphabet = useMemo(() => {
    const raw = params.alphabet;
    return Array.isArray(raw) && raw.every((s) => typeof s === 'string')
      ? (raw as string[])
      : ['0', '1'];
  }, [params.alphabet]);

  const allowRename = params.allowRename === true;

  // The builder model is the editing surface; `value` (the compiled DFA) is what the
  // grader sees. Keeping both means the player's layout survives a failed submission.
  const [model, setModel] = useState<BuilderModel>(emptyBuilderModel);
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);

  function update(next: BuilderModel): void {
    setModel(next);
    onChange(compileToDfa(next, alphabet));
  }

  function runTest(): void {
    const dfa = compileToDfa(model, alphabet);
    const cleaned = testInput.trim();
    const allowed = new Set(alphabet);
    if ([...cleaned].some((ch) => !allowed.has(ch))) {
      setTestResult(
        `Σ = {${alphabet.join(', ')}} — that string uses a symbol the machine has no rule for.`,
      );
      return;
    }
    const trace = simulateDfa(dfa, cleaned);
    setTestResult(
      trace.outcome === 'accept'
        ? `✓ Your machine ACCEPTS "${cleaned || 'ε'}"`
        : `✕ Your machine REJECTS "${cleaned || 'ε'}"`,
    );
  }

  return (
    <div className="space-y-3">
      <DfaBuilderCanvas
        alphabet={alphabet}
        value={model}
        onChange={update}
        height={340}
        allowRename={allowRename}
      />

      {/* Testing before submitting is the intended loop — the player should find their
          own counterexample before the grader hands them one. */}
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex-1">
          <span className="mb-1 block font-display text-xs uppercase tracking-wider text-ink-low">
            Test a string against your machine
          </span>
          <input
            value={testInput}
            spellCheck={false}
            disabled={disabled}
            onChange={(e) => setTestInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runTest()}
            placeholder={`e.g. ${alphabet[0] ?? '0'}${alphabet[1] ?? '1'}${alphabet[0] ?? '0'}`}
            className="w-full rounded-xl border border-ink-low/30 bg-void/60 px-3 py-2 font-mono text-ink-hi outline-none transition-colors focus:border-arc-cyan/60 disabled:opacity-50"
          />
        </label>
        <HoloButton onClick={runTest} disabled={disabled}>
          Test
        </HoloButton>
        <HoloButton intent="success" onClick={onSubmit} disabled={disabled || value === undefined}>
          Submit ▶
        </HoloButton>
      </div>

      {testResult && (
        <p role="status" aria-live="polite" className="font-mono text-xs text-ink-mid">
          {testResult}
        </p>
      )}
    </div>
  );
}
