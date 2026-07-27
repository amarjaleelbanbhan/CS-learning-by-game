/**
 * Declarative lesson content blocks (FR-LESSON-2, FR-LESSON-4).
 *
 * Everything here must be JSON-serialisable: `docs/02-ARCHITECTURE.md` stores lesson
 * content as `missions.content jsonb`, so a block may never contain a function, a class
 * instance, or a React element. That constraint is what makes lessons authorable as data
 * and validatable in CI rather than being code.
 *
 * Interactivity is expressed *by reference* — a `widget` block names a widget id and
 * plain props, and the host app resolves that id to a real component. This is what lets
 * the existing hand-built labs (DFA builder, subset-construction canvas, …) be reused
 * from declarative content instead of being rewritten or thrown away.
 */

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

export type CalloutTone = 'info' | 'warning' | 'success' | 'danger';

/** Prose paragraph. Plain text — no HTML, so content can never inject markup. */
export interface ProseBlock {
  readonly kind: 'prose';
  readonly text: string;
}

/** Highlighted aside. `tone` carries meaning, never colour alone (NFR-A11Y-2). */
export interface CalloutBlock {
  readonly kind: 'callout';
  readonly tone: CalloutTone;
  readonly title?: string;
  readonly text: string;
}

/** KaTeX math (FR-LESSON-4). `display` renders as a centred block rather than inline. */
export interface MathBlock {
  readonly kind: 'math';
  readonly latex: string;
  /**
   * How the formula should be SPOKEN. Required, because a screen reader given raw LaTeX
   * reads "backslash delta backslash times" — technically labelled, actually useless.
   */
  readonly alt: string;
  readonly display?: boolean;
}

export interface ListBlock {
  readonly kind: 'list';
  readonly ordered?: boolean;
  readonly items: readonly string[];
}

/**
 * An interactive widget resolved by id at render time (FR-LESSON-4).
 * `alt` is required: it is the textual description assistive tech receives when the
 * widget itself cannot be represented, so a lesson can never ship an unlabelled canvas.
 */
export interface WidgetBlock {
  readonly kind: 'widget';
  readonly widgetId: string;
  readonly alt: string;
  readonly props?: Readonly<Record<string, JsonValue>>;
}

export type ContentBlock = ProseBlock | CalloutBlock | MathBlock | ListBlock | WidgetBlock;

export const CALLOUT_TONES: readonly CalloutTone[] = ['info', 'warning', 'success', 'danger'];

/** Every widget id referenced anywhere in a set of blocks (for registry validation). */
export function referencedWidgetIds(blocks: readonly ContentBlock[]): readonly string[] {
  return blocks.filter((b): b is WidgetBlock => b.kind === 'widget').map((b) => b.widgetId);
}

/** Per-block validation. Returns human-readable errors; empty means valid. */
export function validateContentBlock(block: ContentBlock, where: string): string[] {
  const errors: string[] = [];
  const nonEmpty = (value: string | undefined, field: string): void => {
    if (!value || value.trim().length === 0) errors.push(`${where}: ${field} must not be empty`);
  };

  switch (block.kind) {
    case 'prose':
      nonEmpty(block.text, 'prose text');
      break;
    case 'callout':
      nonEmpty(block.text, 'callout text');
      if (!CALLOUT_TONES.includes(block.tone)) {
        errors.push(`${where}: unknown callout tone "${block.tone}"`);
      }
      break;
    case 'math':
      nonEmpty(block.latex, 'math latex');
      nonEmpty(block.alt, 'math alt text');
      break;
    case 'list':
      if (block.items.length === 0) errors.push(`${where}: list must have at least one item`);
      block.items.forEach((item, i) => nonEmpty(item, `list item ${i}`));
      break;
    case 'widget':
      nonEmpty(block.widgetId, 'widget id');
      // Enforced, not advisory: an unlabelled interactive widget is an a11y defect that
      // would otherwise reach production silently (NFR-A11Y-4).
      nonEmpty(block.alt, 'widget alt text');
      break;
    default: {
      const exhaustive: never = block;
      errors.push(`${where}: unknown block kind ${JSON.stringify(exhaustive)}`);
    }
  }
  return errors;
}
