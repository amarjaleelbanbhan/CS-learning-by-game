import { EPSILON, type DFA, type NFA } from '@arc/engine-automata';

/** Renderer-neutral graph model. Both DFA and NFA adapt into this shape so a
 * single <GraphView> can draw any automaton (and future course graphs). */
export interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  isStart: boolean;
  isAccepting: boolean;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  label: string;
}

export interface GraphModel {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export type Layout = Record<string, { x: number; y: number }>;

/** Subset labels ("q0,q1") render as "{q0,q1}"; the empty set as "∅". */
export function displayLabel(label: string): string {
  if (label === '') return '∅';
  return label.includes(',') ? `{${label}}` : label;
}

function mergeEdges(raw: Array<{ from: string; to: string; sym: string }>): GraphEdge[] {
  const groups = new Map<string, { from: string; to: string; syms: string[] }>();
  for (const { from, to, sym } of raw) {
    const key = `${from}->${to}`;
    const g = groups.get(key) ?? { from, to, syms: [] };
    g.syms.push(sym);
    groups.set(key, g);
  }
  return [...groups.values()].map((g) => ({
    id: `${g.from}->${g.to}`,
    from: g.from,
    to: g.to,
    label: [...g.syms].sort().join(', '),
  }));
}

export function dfaToGraphModel(dfa: DFA, layout: Layout): GraphModel {
  const nodes: GraphNode[] = dfa.states.map((s) => ({
    id: s,
    label: displayLabel(s),
    x: layout[s]?.x ?? 0,
    y: layout[s]?.y ?? 0,
    isStart: s === dfa.start,
    isAccepting: dfa.accepting.has(s),
  }));
  const raw: Array<{ from: string; to: string; sym: string }> = [];
  for (const [from, row] of dfa.delta) {
    for (const [sym, to] of row) raw.push({ from, to, sym });
  }
  return { nodes, edges: mergeEdges(raw) };
}

export function nfaToGraphModel(nfa: NFA, layout: Layout): GraphModel {
  const nodes: GraphNode[] = nfa.states.map((s) => ({
    id: s,
    label: displayLabel(s),
    x: layout[s]?.x ?? 0,
    y: layout[s]?.y ?? 0,
    isStart: s === nfa.start,
    isAccepting: nfa.accepting.has(s),
  }));
  const raw: Array<{ from: string; to: string; sym: string }> = [];
  for (const [from, row] of nfa.delta) {
    for (const [sym, set] of row) {
      for (const to of set) raw.push({ from, to, sym: sym === EPSILON ? 'ε' : sym });
    }
  }
  return { nodes, edges: mergeEdges(raw) };
}
