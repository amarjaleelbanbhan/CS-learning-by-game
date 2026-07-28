'use client';

import { useState } from 'react';
import type { JsonValue } from '@arc/engine-lesson';
import { HoloButton } from '@/components/ui/HoloButton';

/**
 * Interaction widgets — the input half of a task.
 *
 * Each one collects a raw answer and hands it upward; none of them knows whether the
 * answer is right. Correctness belongs to the grader, so the same `PredictAcceptReject`
 * serves a DFA mission, an NFA mission and (later) a Turing machine without change.
 */

export interface InteractionProps {
  /** Plain JSON params authored on the task (e.g. which string to predict). */
  readonly params: Readonly<Record<string, JsonValue>>;
  /** Current draft answer, so the widget stays controlled across re-renders. */
  readonly value: unknown;
  readonly onChange: (value: unknown) => void;
  readonly onSubmit: () => void;
  /** Locked after a correct verdict — the player should not be able to un-solve it. */
  readonly disabled: boolean;
}

function str(params: Readonly<Record<string, JsonValue>>, key: string, fallback = ''): string {
  const value = params[key];
  return typeof value === 'string' ? value : fallback;
}

/** Accept / reject prediction. The cheapest way to make an animation a real task. */
export function PredictAcceptReject({
  params,
  value,
  onChange,
  onSubmit,
  disabled,
}: InteractionProps) {
  const input = str(params, 'input');
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="font-display text-xs uppercase tracking-wider text-ink-low">Input</span>
        <code className="rounded-lg border border-ink-low/25 bg-void/60 px-3 py-1 font-mono text-arc-cyan">
          {input || 'ε'}
        </code>
      </div>
      <div role="radiogroup" aria-label="Your prediction" className="flex gap-2">
        {[
          { key: true, label: 'Accept', icon: '✓' },
          { key: false, label: 'Reject', icon: '✕' },
        ].map((option) => {
          const selected = value === option.key;
          return (
            <button
              key={option.label}
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(option.key)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition-colors disabled:opacity-50 ${
                selected
                  ? 'border-arc-cyan bg-arc-cyan/10 text-arc-cyan'
                  : 'border-ink-low/30 text-ink-mid hover:border-arc-cyan/40'
              }`}
            >
              {/* Icon plus label: selection is never signalled by colour alone. */}
              <span aria-hidden="true">{option.icon}</span>
              {option.label}
            </button>
          );
        })}
      </div>
      <HoloButton onClick={onSubmit} disabled={disabled || value === undefined}>
        Lock in prediction
      </HoloButton>
    </div>
  );
}

/** Numeric answer — state counts, pumping lengths, derivation step counts. */
export function NumericAnswer({ params, value, onChange, onSubmit, disabled }: InteractionProps) {
  const label = str(params, 'label', 'Your answer');
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="mb-1 block font-display text-xs uppercase tracking-wider text-ink-low">
          {label}
        </span>
        <input
          type="number"
          inputMode="numeric"
          disabled={disabled}
          value={typeof value === 'string' || typeof value === 'number' ? String(value) : ''}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !disabled && onSubmit()}
          className="w-32 rounded-xl border border-ink-low/30 bg-void/60 px-3 py-2 font-mono text-ink-hi outline-none transition-colors focus:border-arc-cyan/60 disabled:opacity-50"
        />
      </label>
      <HoloButton onClick={onSubmit} disabled={disabled || value === undefined || value === ''}>
        Submit
      </HoloButton>
    </div>
  );
}

function optionList(params: Readonly<Record<string, JsonValue>>): { id: string; label: string }[] {
  const raw = params.options;
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((entry) => {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) return [];
    const record = entry as Record<string, JsonValue>;
    const id = record.id;
    const label = record.label;
    return typeof id === 'string' && typeof label === 'string' ? [{ id, label }] : [];
  });
}

/** Single- or multi-select. `multi: true` in params allows more than one. */
export function ChoiceAnswer({ params, value, onChange, onSubmit, disabled }: InteractionProps) {
  const options = optionList(params);
  const multi = params.multi === true;
  const selected = Array.isArray(value) ? (value as string[]) : [];

  function toggle(id: string): void {
    if (multi) {
      onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
    } else {
      onChange([id]);
    }
  }

  return (
    <div className="space-y-3">
      <div role={multi ? 'group' : 'radiogroup'} aria-label="Options" className="space-y-2">
        {options.map((option) => {
          const isOn = selected.includes(option.id);
          return (
            <button
              key={option.id}
              role={multi ? 'checkbox' : 'radio'}
              aria-checked={isOn}
              disabled={disabled}
              onClick={() => toggle(option.id)}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-left text-sm transition-colors disabled:opacity-50 ${
                isOn
                  ? 'border-arc-cyan bg-arc-cyan/10 text-ink-hi'
                  : 'border-ink-low/30 text-ink-mid hover:border-arc-cyan/40'
              }`}
            >
              <span
                aria-hidden="true"
                className={`grid h-4 w-4 shrink-0 place-items-center rounded-${multi ? 'sm' : 'full'} border text-[10px] ${
                  isOn ? 'border-arc-cyan bg-arc-cyan/20 text-arc-cyan' : 'border-ink-low/40'
                }`}
              >
                {isOn ? '✓' : ''}
              </span>
              {option.label}
            </button>
          );
        })}
      </div>
      <HoloButton onClick={onSubmit} disabled={disabled || selected.length === 0}>
        Submit
      </HoloButton>
    </div>
  );
}

/**
 * Ordering puzzle. Uses explicit move-up/move-down buttons rather than pointer dragging:
 * a drag-only control is unusable by keyboard and by screen reader, and the ordering here
 * is the pedagogy (derivation steps, algorithm stages), not a dexterity test.
 */
export function OrderingAnswer({ params, value, onChange, onSubmit, disabled }: InteractionProps) {
  const options = optionList(params);
  const order =
    Array.isArray(value) && value.length > 0 ? (value as string[]) : options.map((o) => o.id);
  const labelOf = (id: string): string => options.find((o) => o.id === id)?.label ?? id;

  function move(index: number, delta: number): void {
    const target = index + delta;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target]!, next[index]!];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <ol className="space-y-2">
        {order.map((id, i) => (
          <li
            key={id}
            className="flex items-center gap-2 rounded-xl border border-ink-low/30 bg-void/40 px-3 py-2"
          >
            <span className="font-mono text-xs text-ink-low">{i + 1}</span>
            <span className="flex-1 text-sm text-ink-mid">{labelOf(id)}</span>
            <button
              aria-label={`Move ${labelOf(id)} up`}
              disabled={disabled || i === 0}
              onClick={() => move(i, -1)}
              className="rounded-lg border border-ink-low/30 px-2 py-0.5 text-xs text-ink-mid disabled:opacity-30"
            >
              ↑
            </button>
            <button
              aria-label={`Move ${labelOf(id)} down`}
              disabled={disabled || i === order.length - 1}
              onClick={() => move(i, 1)}
              className="rounded-lg border border-ink-low/30 px-2 py-0.5 text-xs text-ink-mid disabled:opacity-30"
            >
              ↓
            </button>
          </li>
        ))}
      </ol>
      <HoloButton onClick={onSubmit} disabled={disabled}>
        Submit order
      </HoloButton>
    </div>
  );
}

/** Free-text answer — regex patterns, grammar productions, language descriptions. */
export function TextAnswer({ params, value, onChange, onSubmit, disabled }: InteractionProps) {
  const label = str(params, 'label', 'Your answer');
  const placeholder = str(params, 'placeholder');
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="mb-1 block font-display text-xs uppercase tracking-wider text-ink-low">
          {label}
        </span>
        <input
          spellCheck={false}
          disabled={disabled}
          placeholder={placeholder}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !disabled && onSubmit()}
          className="w-full rounded-xl border border-ink-low/30 bg-void/60 px-3 py-2 font-mono text-ink-hi outline-none transition-colors focus:border-arc-cyan/60 disabled:opacity-50"
        />
      </label>
      <HoloButton onClick={onSubmit} disabled={disabled || !value}>
        Submit
      </HoloButton>
    </div>
  );
}

/** Local draft state for widgets that need it outside a controlled parent. */
export function useDraft<T>(initial: T): [T, (value: T) => void] {
  const [draft, setDraft] = useState<T>(initial);
  return [draft, setDraft];
}
