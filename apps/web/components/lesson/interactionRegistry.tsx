'use client';

import type { ComponentType } from 'react';
import {
  ChoiceAnswer,
  NumericAnswer,
  OrderingAnswer,
  PredictAcceptReject,
  TextAnswer,
  type InteractionProps,
} from './interactions';
import { DfaBuilderInteraction } from './DfaBuilderInteraction';

/**
 * Interaction registry — task `widgetId` → the component that collects that answer.
 *
 * Separate from `widgetRegistry` (whole-mission widgets) because the two solve different
 * problems: a lesson *widget* is a self-contained mission that owns its own grading, an
 * *interaction* only gathers a raw answer and hands it to TaskRunner. Merging them would
 * force every interaction to fake the mission contract.
 */
export type Interaction = ComponentType<InteractionProps>;

export const INTERACTION_REGISTRY: Readonly<Record<string, Interaction>> = {
  'predict-accept-reject': PredictAcceptReject,
  numeric: NumericAnswer,
  choice: ChoiceAnswer,
  ordering: OrderingAnswer,
  text: TextAnswer,
  'dfa-builder': DfaBuilderInteraction,
};

export function resolveInteraction(widgetId: string): Interaction | undefined {
  return INTERACTION_REGISTRY[widgetId];
}

export function interactionIds(): readonly string[] {
  return Object.keys(INTERACTION_REGISTRY).sort();
}
