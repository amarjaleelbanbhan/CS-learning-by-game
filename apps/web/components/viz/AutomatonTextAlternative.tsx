import type { GraphModel } from './graph-model';

/**
 * Screen-reader alternative for an automaton graph (NFR-A11Y-4).
 *
 * The graphs are the app's core content, and a React Flow canvas conveys essentially
 * nothing to assistive tech — so every automaton also renders as a real transition table
 * plus a one-line summary, visually hidden but fully in the accessibility tree.
 *
 * A table is used rather than prose because it is what the tabular data actually is:
 * screen readers announce row/column headers, so "from state q1, on symbol 0, go to q2"
 * is navigable rather than a wall of sentences.
 */

/** One row per (state, outgoing transition). Pure so it can be unit-tested. */
export interface TransitionRow {
  from: string;
  label: string;
  to: string;
}

export function transitionRows(model: GraphModel): TransitionRow[] {
  return model.edges.map((e) => ({ from: e.from, label: e.label, to: e.to }));
}

/** "3 states. Start state q0. Accepting state q2." — the orienting summary read first. */
export function describeAutomaton(model: GraphModel): string {
  const start = model.nodes.find((n) => n.isStart);
  const accepting = model.nodes.filter((n) => n.isAccepting).map((n) => n.label);

  const parts = [`${model.nodes.length} state${model.nodes.length === 1 ? '' : 's'}.`];
  if (start) parts.push(`Start state ${start.label}.`);
  parts.push(
    accepting.length === 0
      ? 'No accepting states.'
      : `Accepting state${accepting.length === 1 ? '' : 's'} ${accepting.join(', ')}.`,
  );
  parts.push(`${model.edges.length} transition${model.edges.length === 1 ? '' : 's'}.`);
  return parts.join(' ');
}

export function AutomatonTextAlternative({
  model,
  caption = 'Automaton transition table',
}: {
  model: GraphModel;
  caption?: string;
}) {
  const rows = transitionRows(model);

  return (
    <div className="sr-only">
      <p>{describeAutomaton(model)}</p>
      {rows.length > 0 && (
        <table>
          <caption>{caption}</caption>
          <thead>
            <tr>
              <th scope="col">From state</th>
              <th scope="col">On symbol</th>
              <th scope="col">To state</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.from}-${r.to}-${i}`}>
                <th scope="row">{r.from}</th>
                <td>{r.label}</td>
                <td>{r.to}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
