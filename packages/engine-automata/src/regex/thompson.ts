import { err, ok, stateId, type Result, type StateId } from '@arc/shared';
import { EPSILON, type NFA } from '../models/nfa.js';
import { parseRegex, type Re } from './parse.js';

interface Fragment {
  start: StateId;
  accept: StateId;
}

/**
 * Thompson's construction: builds an ε-NFA from a regex AST. Every sub-expression
 * yields a fragment with a single start and single accept state, wired with
 * ε-transitions. The structure is intentionally verbose (lots of ε) because it
 * mirrors the textbook diagram the Regex Studio will animate.
 */
export function thompson(re: Re): NFA {
  let counter = 0;
  const newState = (): StateId => stateId(`n${counter++}`);
  const delta = new Map<StateId, Map<string, Set<StateId>>>();
  const alphabet = new Set<string>();

  const addEdge = (from: StateId, sym: string, to: StateId): void => {
    let row = delta.get(from);
    if (!row) {
      row = new Map();
      delta.set(from, row);
    }
    let set = row.get(sym);
    if (!set) {
      set = new Set();
      row.set(sym, set);
    }
    set.add(to);
  };

  function build(node: Re): Fragment {
    switch (node.t) {
      case 'empty': {
        const s = newState();
        const a = newState();
        addEdge(s, EPSILON, a);
        return { start: s, accept: a };
      }
      case 'char': {
        const s = newState();
        const a = newState();
        addEdge(s, node.c, a);
        alphabet.add(node.c);
        return { start: s, accept: a };
      }
      case 'concat': {
        const f1 = build(node.a);
        const f2 = build(node.b);
        addEdge(f1.accept, EPSILON, f2.start);
        return { start: f1.start, accept: f2.accept };
      }
      case 'alt': {
        const s = newState();
        const a = newState();
        const f1 = build(node.a);
        const f2 = build(node.b);
        addEdge(s, EPSILON, f1.start);
        addEdge(s, EPSILON, f2.start);
        addEdge(f1.accept, EPSILON, a);
        addEdge(f2.accept, EPSILON, a);
        return { start: s, accept: a };
      }
      case 'star': {
        const s = newState();
        const a = newState();
        const f = build(node.a);
        addEdge(s, EPSILON, f.start);
        addEdge(s, EPSILON, a);
        addEdge(f.accept, EPSILON, f.start);
        addEdge(f.accept, EPSILON, a);
        return { start: s, accept: a };
      }
      case 'plus': {
        const s = newState();
        const a = newState();
        const f = build(node.a);
        addEdge(s, EPSILON, f.start);
        addEdge(f.accept, EPSILON, f.start);
        addEdge(f.accept, EPSILON, a);
        return { start: s, accept: a };
      }
      case 'opt': {
        const s = newState();
        const a = newState();
        const f = build(node.a);
        addEdge(s, EPSILON, f.start);
        addEdge(s, EPSILON, a);
        addEdge(f.accept, EPSILON, a);
        return { start: s, accept: a };
      }
    }
  }

  const frag = build(re);

  const states = new Set<StateId>([frag.start, frag.accept]);
  for (const [from, row] of delta) {
    states.add(from);
    for (const set of row.values()) for (const t of set) states.add(t);
  }

  return {
    alphabet: [...alphabet],
    states: [...states],
    start: frag.start,
    accepting: new Set([frag.accept]),
    delta,
  };
}

/** Parse a regex string and build its ε-NFA in one step. */
export function regexToNfa(src: string): Result<NFA, string> {
  const parsed = parseRegex(src);
  return parsed.ok ? ok(thompson(parsed.value)) : err(parsed.error);
}
