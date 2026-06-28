import { stateId, type StateId } from '@arc/shared';
import type { DFA, Sym } from '@arc/engine-automata';

/** Editor-native model for a player-built DFA — plain strings/positions, not
 * yet validated or branded. `compileToDfa` turns this into the engine's DFA
 * type once the player tests or submits. */
export interface BuilderStateModel {
  id: string;
  x: number;
  y: number;
  isStart: boolean;
  isAccepting: boolean;
}

export interface BuilderEdgeModel {
  id: string;
  from: string;
  to: string;
  symbols: string[];
}

export interface BuilderModel {
  states: BuilderStateModel[];
  edges: BuilderEdgeModel[];
}

export const emptyBuilderModel = (): BuilderModel => ({ states: [], edges: [] });

/** Which symbol, if any, state `from` already commits elsewhere — used by the
 * symbol picker to forbid creating a second, conflicting transition (a DFA
 * may only go one place per symbol from a given state). */
export function usedSymbolTargets(
  edges: readonly BuilderEdgeModel[],
  from: string,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const e of edges) {
    if (e.from !== from) continue;
    for (const sym of e.symbols) map.set(sym, e.to);
  }
  return map;
}

export interface BuilderValidation {
  valid: boolean;
  error: string | null;
}

/** Structural checks before testing/grading — NOT language correctness. */
export function validateBuilder(model: BuilderModel): BuilderValidation {
  if (model.states.length === 0) {
    return { valid: false, error: 'Add at least one state to begin.' };
  }
  const starts = model.states.filter((s) => s.isStart);
  if (starts.length === 0) {
    return { valid: false, error: 'Mark one state as the start state (★).' };
  }
  if (starts.length > 1) {
    return { valid: false, error: 'Only one state can be the start state.' };
  }
  return { valid: true, error: null };
}

/** Compiles a validated builder model into the engine's DFA type. Missing
 * transitions are left undefined — `engine-simulation`/`accepts` already
 * treat that as an implicit dead state, exactly standard DFA semantics. */
export function compileToDfa(model: BuilderModel, alphabet: readonly Sym[]): DFA {
  const start = model.states.find((s) => s.isStart);
  if (!start) throw new Error('compileToDfa called without a validated start state');

  const delta = new Map<StateId, Map<Sym, StateId>>();
  for (const s of model.states) {
    const row = new Map<Sym, StateId>();
    for (const e of model.edges) {
      if (e.from !== s.id) continue;
      for (const sym of e.symbols) row.set(sym, stateId(e.to));
    }
    delta.set(stateId(s.id), row);
  }

  return {
    alphabet: [...alphabet],
    states: model.states.map((s) => stateId(s.id)),
    start: stateId(start.id),
    accepting: new Set(model.states.filter((s) => s.isAccepting).map((s) => stateId(s.id))),
    delta,
  };
}

/** Lowest unused q0, q1, q2, ... label — reuses gaps left by deleted states
 * rather than only ever counting up, so labels stay small and tidy. */
export function nextStateLabel(existing: readonly BuilderStateModel[]): string {
  let n = 0;
  while (existing.some((s) => s.id === `q${n}`)) n++;
  return `q${n}`;
}

/**
 * Pure model-mutation functions. The editor component calls these instead of
 * mutating state inline, so the actual editing RULES (exactly one start
 * state, deleting a state also deletes its edges, ...) are unit-testable
 * without touching React Flow or the DOM at all.
 */

export function addState(model: BuilderModel): BuilderModel {
  const id = nextStateLabel(model.states);
  const col = model.states.length % 4;
  const row = Math.floor(model.states.length / 4);
  const newState: BuilderStateModel = {
    id,
    x: 60 + col * 150,
    y: 60 + row * 150,
    isStart: model.states.length === 0,
    isAccepting: false,
  };
  return { ...model, states: [...model.states, newState] };
}

/** Setting a state as start unsets any other — at most one start, always. */
export function setStart(model: BuilderModel, id: string): BuilderModel {
  return { ...model, states: model.states.map((s) => ({ ...s, isStart: s.id === id })) };
}

export function toggleAccepting(model: BuilderModel, id: string): BuilderModel {
  return {
    ...model,
    states: model.states.map((s) => (s.id === id ? { ...s, isAccepting: !s.isAccepting } : s)),
  };
}

/** Deleting a state also removes every edge touching it — no dangling edges. */
export function deleteState(model: BuilderModel, id: string): BuilderModel {
  return {
    states: model.states.filter((s) => s.id !== id),
    edges: model.edges.filter((e) => e.from !== id && e.to !== id),
  };
}

export function deleteEdge(model: BuilderModel, id: string): BuilderModel {
  return { ...model, edges: model.edges.filter((e) => e.id !== id) };
}

/** Adds a transition, or extends an existing (from,to) edge with one more
 * symbol. Idempotent: re-picking a symbol already on the edge is a no-op. */
export function addOrExtendEdge(
  model: BuilderModel,
  from: string,
  to: string,
  symbol: string,
): BuilderModel {
  const id = `${from}->${to}`;
  const existing = model.edges.find((e) => e.id === id);
  if (existing) {
    if (existing.symbols.includes(symbol)) return model;
    return {
      ...model,
      edges: model.edges.map((e) => (e.id === id ? { ...e, symbols: [...e.symbols, symbol] } : e)),
    };
  }
  return { ...model, edges: [...model.edges, { id, from, to, symbols: [symbol] }] };
}

export function moveState(model: BuilderModel, id: string, x: number, y: number): BuilderModel {
  return { ...model, states: model.states.map((s) => (s.id === id ? { ...s, x, y } : s)) };
}

export interface RenameResult {
  model: BuilderModel;
  error: string | null;
}

/**
 * Renames a state, rewriting every edge endpoint that referenced it. Needed for
 * subset-construction missions where the player labels DFA states as subsets of NFA
 * states (e.g. "q0,q1") rather than accepting the default q0/q1/q2 labels. The
 * uniqueness check above guarantees `newId` doesn't collide with any OTHER existing
 * state, so the rewritten edges' (from, to) pairs stay unique too — no merge logic needed.
 */
export function renameState(model: BuilderModel, oldId: string, newId: string): RenameResult {
  const trimmed = newId.trim();
  if (trimmed.length === 0) {
    return { model, error: 'State name cannot be empty.' };
  }
  if (trimmed !== oldId && model.states.some((s) => s.id === trimmed)) {
    return { model, error: `A state named "${trimmed}" already exists.` };
  }
  if (trimmed === oldId) {
    return { model, error: null };
  }

  const states = model.states.map((s) => (s.id === oldId ? { ...s, id: trimmed } : s));
  const edges = model.edges.map((e) => {
    const from = e.from === oldId ? trimmed : e.from;
    const to = e.to === oldId ? trimmed : e.to;
    return from === e.from && to === e.to
      ? e
      : { id: `${from}->${to}`, from, to, symbols: e.symbols };
  });

  return { model: { states, edges }, error: null };
}
