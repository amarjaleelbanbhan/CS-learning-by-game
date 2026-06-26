'use client';

import { useMemo } from 'react';
import type { AutomatonView } from '@/lib/automata/examples';
import { GraphView } from './GraphView';
import { dfaToGraphModel } from './graph-model';

export interface AutomatonGraphProps {
  view: AutomatonView;
  activeStates?: readonly string[];
  activeEdgeKey?: string | null;
  height?: number;
}

/** Thin adapter: renders a DFA view through the shared <GraphView>. */
export function AutomatonGraph({
  view,
  activeStates = [],
  activeEdgeKey = null,
  height = 340,
}: AutomatonGraphProps) {
  const model = useMemo(() => dfaToGraphModel(view.dfa, view.layout), [view]);
  return (
    <GraphView
      model={model}
      activeNodes={activeStates}
      activeEdgeKey={activeEdgeKey}
      height={height}
    />
  );
}
