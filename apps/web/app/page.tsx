import Link from 'next/link';
import { Panel } from '@/components/ui/Panel';

const MODULES = [
  {
    id: 'dfa-ends-01',
    title: 'The Memory of a Machine',
    tag: 'DFA',
    href: '/learn/dfa-ends-01',
    ready: true,
  },
  { id: 'nfa', title: 'Many Paths at Once', tag: 'NFA', href: '#', ready: false },
  { id: 'subset', title: 'NFA → DFA', tag: 'Flagship', href: '#', ready: false },
  { id: 'pumping', title: 'The Pumping Lemma', tag: 'Proofs', href: '#', ready: false },
];

export default function Home() {
  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-3xl border border-arc-cyan/15 bg-gradient-to-b from-arc-blue/10 to-transparent px-6 py-16 text-center sm:py-24">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-arc-cyan/10 blur-3xl" />
        <div className="relative">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-arc-cyan/30 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-arc-cyan/80">
            <span className="h-1.5 w-1.5 rounded-full bg-arc-cyan animate-pulse-ring" />
            Project Arc Reactor
          </div>
          <h1 className="font-display text-4xl font-extrabold leading-tight text-glow sm:text-6xl">
            Theory of Automata,
            <br /> as a living laboratory.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-ink-mid">
            No more static diagrams. Build machines, feed them strings, and watch computation happen
            — step by step, at 60 frames per second.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/learn/dfa-ends-01"
              className="rounded-xl border border-arc-cyan/50 bg-arc-cyan/15 px-6 py-3 font-medium tracking-wide text-arc-cyan shadow-glow transition-all hover:bg-arc-cyan/25"
            >
              Start Mission 01 ▶
            </Link>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-sm uppercase tracking-widest text-ink-mid">
          Laboratory Map
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map((m) => {
            const card = (
              <Panel
                className={`h-full p-5 transition-all ${
                  m.ready ? 'hover:shadow-glow' : 'opacity-60'
                }`}
                glow={m.ready}
              >
                <div className="mb-3 inline-block rounded-md border border-arc-cyan/20 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-arc-cyan/80">
                  {m.tag}
                </div>
                <div className="font-display text-lg font-semibold text-ink-hi">{m.title}</div>
                <div className="mt-3 text-xs text-ink-low">
                  {m.ready ? 'Available now →' : 'Locked · coming soon'}
                </div>
              </Panel>
            );
            return m.ready ? (
              <Link key={m.id} href={m.href}>
                {card}
              </Link>
            ) : (
              <div key={m.id}>{card}</div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
