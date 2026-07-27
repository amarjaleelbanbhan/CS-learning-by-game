'use client';

import type { CalloutTone, ContentBlock } from '@arc/engine-lesson';
import { Panel } from '@/components/ui/Panel';
import { resolveWidget } from './widgetRegistry';

/**
 * Renders declarative content blocks. This is the ONLY place block kinds map to markup —
 * a new lesson never touches this file, and a new block kind is a single case here plus a
 * type in the engine.
 */

/** Tone carries an icon and a label, never colour alone (NFR-A11Y-2). */
const TONE: Record<CalloutTone, { className: string; icon: string; label: string }> = {
  info: { className: 'border-arc-cyan/30 bg-arc-cyan/5', icon: 'ℹ', label: 'Note' },
  warning: { className: 'border-arc-gold/30 bg-arc-gold/5', icon: '⚠', label: 'Careful' },
  success: { className: 'border-accept/30 bg-accept/5', icon: '✓', label: 'Good' },
  danger: { className: 'border-reject/30 bg-reject/5', icon: '✕', label: 'Watch out' },
};

function BlockView({
  block,
  onWidgetComplete,
  completedWidgets,
}: {
  block: ContentBlock;
  onWidgetComplete: (widgetId: string) => void;
  completedWidgets: ReadonlySet<string>;
}) {
  switch (block.kind) {
    case 'prose':
      return <p className="text-sm leading-relaxed text-ink-mid">{block.text}</p>;

    case 'callout': {
      const tone = TONE[block.tone];
      return (
        <div className={`rounded-xl border p-3.5 ${tone.className}`}>
          <div className="mb-1 flex items-center gap-1.5 font-display text-[10px] uppercase tracking-wider text-ink-low">
            <span aria-hidden="true">{tone.icon}</span>
            <span>{block.title ?? tone.label}</span>
          </div>
          <p className="text-sm leading-relaxed text-ink-hi">{block.text}</p>
        </div>
      );
    }

    case 'math':
      // KaTeX is a "SHOULD" (FR-LESSON-4) and is not installed. The automata curriculum's
      // notation (q₀, δ, Σ, ε) is expressible directly, so the LaTeX source is shown in a
      // math-tagged monospace run rather than pulling in a ~300KB renderer that nothing
      // currently needs. Swap this one branch for KaTeX when content actually demands it.
      return (
        <p
          role="math"
          aria-label={block.latex}
          className={`font-mono text-arc-cyan ${block.display ? 'my-2 text-center text-base' : 'text-sm'}`}
        >
          {block.latex}
        </p>
      );

    case 'list': {
      const items = block.items.map((item, i) => (
        <li key={i} className="text-sm leading-relaxed text-ink-mid">
          {item}
        </li>
      ));
      return block.ordered ? (
        <ol className="list-decimal space-y-1 pl-5 marker:text-arc-cyan">{items}</ol>
      ) : (
        <ul className="list-disc space-y-1 pl-5 marker:text-arc-cyan">{items}</ul>
      );
    }

    case 'widget': {
      const Widget = resolveWidget(block.widgetId);
      if (!Widget) {
        // Content validation catches this in CI; if it ever reaches a user, say so plainly
        // rather than rendering an empty box they cannot act on.
        return (
          <Panel className="border-reject/30 bg-reject/5 p-4">
            <p className="text-sm text-reject">
              Interactive content unavailable ({block.widgetId}).
            </p>
            <p className="mt-1 text-xs text-ink-mid">{block.alt}</p>
          </Panel>
        );
      }
      return (
        <div role="group" aria-label={block.alt}>
          <Widget
            props={block.props ?? {}}
            isCompleted={completedWidgets.has(block.widgetId)}
            onComplete={() => onWidgetComplete(block.widgetId)}
          />
        </div>
      );
    }

    default: {
      const exhaustive: never = block;
      void exhaustive;
      return null;
    }
  }
}

export function ContentBlocks({
  blocks,
  onWidgetComplete,
  completedWidgets,
}: {
  blocks: readonly ContentBlock[];
  onWidgetComplete: (widgetId: string) => void;
  completedWidgets: ReadonlySet<string>;
}) {
  return (
    <div className="space-y-4">
      {blocks.map((block, i) => (
        <BlockView
          key={i}
          block={block}
          onWidgetComplete={onWidgetComplete}
          completedWidgets={completedWidgets}
        />
      ))}
    </div>
  );
}
