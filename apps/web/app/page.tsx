'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Panel } from '@/components/ui/Panel';
import { ReactorCore } from '@/components/fx/ReactorCore';
import { useUiStore } from '@/components/state/uiStore';

const MODULES = [
  {
    id: 'dfa-ends-01',
    title: 'The Memory of a Machine',
    tag: 'DFA',
    icon: '🔷',
    href: '/learn/dfa-ends-01',
    ready: true,
  },
  { id: 'nfa', title: 'Many Paths at Once', tag: 'NFA', icon: '🌿', href: '#', ready: false },
  {
    id: 'subset',
    title: 'NFA → DFA',
    tag: 'Flagship',
    icon: '🌀',
    href: '/learn/nfa-to-dfa',
    ready: true,
  },
  { id: 'pumping', title: 'The Pumping Lemma', tag: 'Proofs', icon: '⚗️', href: '#', ready: false },
];

export default function Home() {
  const replayBoot = useUiStore((s) => s.replayBoot);

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-3xl border border-arc-cyan/15 bg-gradient-to-b from-arc-blue/10 to-transparent px-6 py-16 text-center sm:py-24">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-arc-cyan/10 blur-3xl" />

        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative mx-auto mb-6 flex justify-center"
        >
          <ReactorCore size={96} animate={false} />
        </motion.div>

        <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-arc-cyan/30 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-arc-cyan/80"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-arc-cyan animate-pulse-ring" />
            Project Arc Reactor
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl font-extrabold leading-tight text-glow sm:text-6xl"
          >
            Theory of Automata,
            <br /> as a living laboratory.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-5 max-w-xl text-ink-mid"
          >
            No more static diagrams. Build machines, feed them strings, and watch computation happen
            — step by step, at 60 frames per second.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex justify-center gap-3"
          >
            <Link
              href="/learn/dfa-ends-01"
              className="rounded-xl border border-arc-cyan/50 bg-arc-cyan/15 px-6 py-3 font-medium tracking-wide text-arc-cyan shadow-glow transition-all hover:bg-arc-cyan/25"
            >
              Start Mission 01 ▶
            </Link>
          </motion.div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-sm uppercase tracking-widest text-ink-mid">
          Laboratory Map
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map((m, i) => {
            const card = (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={m.ready ? { y: -6, scale: 1.02 } : undefined}
                className="h-full"
              >
                <Panel
                  className={`relative h-full overflow-hidden p-5 transition-shadow ${
                    m.ready ? 'hover:shadow-glow-strong' : 'opacity-60'
                  }`}
                  glow={m.ready}
                >
                  {m.ready && (
                    <motion.div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-arc-cyan/10 to-transparent"
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{
                        duration: 2.6,
                        repeat: Infinity,
                        repeatDelay: 3,
                        ease: 'easeInOut',
                      }}
                    />
                  )}
                  <div className="relative">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="rounded-md border border-arc-cyan/20 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-arc-cyan/80">
                        {m.tag}
                      </span>
                      <span className="text-lg">{m.icon}</span>
                    </div>
                    <div className="font-display text-lg font-semibold text-ink-hi">{m.title}</div>
                    <div className="mt-3 text-xs text-ink-low">
                      {m.ready ? 'Available now →' : 'Locked · coming soon'}
                    </div>
                  </div>
                </Panel>
              </motion.div>
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

      <footer className="text-center">
        <button
          onClick={replayBoot}
          className="font-mono text-xs text-ink-low underline-offset-4 transition-colors hover:text-arc-cyan hover:underline"
        >
          ↻ Replay Intro Sequence
        </button>
      </footer>
    </div>
  );
}
