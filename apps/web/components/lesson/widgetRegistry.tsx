'use client';

import type { ComponentType } from 'react';
import type { JsonValue } from '@arc/engine-lesson';
import { DfaConstructionMission } from '@/components/missions/DfaConstructionMission';
import { DfaMission } from '@/components/missions/DfaMission';

/**
 * Widget registry — the bridge between declarative content and real interactivity
 * (FR-LESSON-4, "embedded interactive widgets by reference").
 *
 * A lesson names a widget by id; this map resolves it to a component. That indirection is
 * what makes the migration additive rather than destructive: the existing hand-built labs
 * keep working exactly as they are and simply become referenceable from content, instead
 * of being rewritten into some generic mega-component.
 */

export interface LessonWidgetProps {
  /** Plain JSON props authored in the lesson content. */
  readonly props: Readonly<Record<string, JsonValue>>;
  /** Called by the widget when the learner has genuinely satisfied it. */
  readonly onComplete: () => void;
  /** True once satisfied, so a widget can render its finished state on revisit. */
  readonly isCompleted: boolean;
}

export type LessonWidget = ComponentType<LessonWidgetProps>;

/**
 * Registered widgets. Entries are added as missions migrate — `validateLessonWidgets`
 * fails the test suite if content references an id that isn't here, so a typo in content
 * is caught in CI rather than rendering a blank panel in production.
 *
 * Each entry adapts an existing mission component to the widget contract. The mission
 * keeps owning its own grading, hints, rewards and ARIA telemetry; the lesson only needs
 * to know *that* it was solved.
 */
export const WIDGET_REGISTRY: Readonly<Record<string, LessonWidget>> = {
  'dfa-construction': ({ onComplete }) => <DfaConstructionMission onSolved={onComplete} />,
  'dfa-simulation': ({ onComplete }) => <DfaMission onSolved={onComplete} />,
};

export function widgetIds(): readonly string[] {
  return Object.keys(WIDGET_REGISTRY);
}

export function resolveWidget(widgetId: string): LessonWidget | undefined {
  return WIDGET_REGISTRY[widgetId];
}
