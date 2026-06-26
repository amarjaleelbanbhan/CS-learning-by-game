import { subsetConstruction, subsetLabel, type DFA, type NFA } from '@arc/engine-automata';
import { buildTrace, type Trace } from '@arc/engine-core';
import type { Layout } from './examples';

/** One step of the subset-construction story: the partial DFA built so far plus
 * which NFA states / DFA node / edge to highlight on this beat. */
export interface SubsetFrame {
  /** DFA state labels discovered so far (cumulative). */
  dfaNodeIds: string[];
  /** DFA transitions discovered so far (cumulative, merged by endpoints). */
  dfaEdges: Array<{ id: string; from: string; to: string; label: string }>;
  /** NFA state ids to highlight (the subset currently being expanded). */
  activeSubset: string[];
  /** DFA node being expanded. */
  currentDfaNode: string;
  /** DFA node produced by this transition (null on the very first frame). */
  resultDfaNode: string | null;
  /** DFA edge to highlight this frame. */
  activeDfaEdgeKey: string | null;
}

export interface SubsetConstructionViz {
  trace: Trace<SubsetFrame>;
  dfa: DFA;
  dfaLayout: Layout;
}

/** Replays `subsetConstruction`'s recorded steps into an animatable trace. */
export function buildSubsetViz(nfa: NFA): SubsetConstructionViz {
  const { dfa, steps } = subsetConstruction(nfa);

  const dfaLayout: Layout = {};
  dfa.states.forEach((s, i) => {
    dfaLayout[s] = { x: (i % 3) * 210, y: Math.floor(i / 3) * 150 };
  });

  const startLabel = dfa.start;
  const startSubset = startLabel.split(',').filter(Boolean);
  const discovered = new Set<string>([startLabel]);
  const edgeMap = new Map<string, { from: string; to: string; syms: string[] }>();

  const snapshotEdges = (): SubsetFrame['dfaEdges'] =>
    [...edgeMap.values()].map((e) => ({
      id: `${e.from}->${e.to}`,
      from: e.from,
      to: e.to,
      label: [...e.syms].sort().join(', '),
    }));

  const frames: Array<{ label: string; data: SubsetFrame }> = [
    {
      label: `Start DFA state = ε-closure({${startSubset.join(', ')}}) = {${startSubset.join(', ')}}`,
      data: {
        dfaNodeIds: [...discovered],
        dfaEdges: [],
        activeSubset: startSubset,
        currentDfaNode: startLabel,
        resultDfaNode: null,
        activeDfaEdgeKey: null,
      },
    },
  ];

  for (const step of steps) {
    const fromLabel = subsetLabel(step.from);
    const toLabel = subsetLabel(step.to);
    const fromSubset = [...step.from].sort();
    const toSubset = [...step.to].sort();
    const isNew = !discovered.has(toLabel);
    discovered.add(toLabel);

    const ek = `${fromLabel}->${toLabel}`;
    const edge = edgeMap.get(ek) ?? { from: fromLabel, to: toLabel, syms: [] };
    if (!edge.syms.includes(step.symbol)) edge.syms.push(step.symbol);
    edgeMap.set(ek, edge);

    const toText = toSubset.length > 0 ? `{${toSubset.join(', ')}}` : '∅';
    frames.push({
      label: `move({${fromSubset.join(', ')}}, ${step.symbol}) → ${toText}${isNew ? '   ✦ new DFA state' : '   ↩ already built — merge'}`,
      data: {
        dfaNodeIds: [...discovered],
        dfaEdges: snapshotEdges(),
        activeSubset: fromSubset,
        currentDfaNode: fromLabel,
        resultDfaNode: toLabel,
        activeDfaEdgeKey: ek,
      },
    });
  }

  return { trace: buildTrace(frames, 'accept'), dfa, dfaLayout };
}
