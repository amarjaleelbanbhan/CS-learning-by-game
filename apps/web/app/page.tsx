'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ReactorCore } from '@/components/fx/ReactorCore';
import { useUiStore } from '@/components/state/uiStore';
import { AcademyMap } from '@/components/campaign/AcademyMap';

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
            Automata Academy
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl font-extrabold leading-tight text-glow sm:text-6xl"
          >
            You&apos;re not a student here.
            <br /> You&apos;re an engineer.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-5 max-w-xl text-ink-mid"
          >
            No lectures. No definitions up front. Every district hands you a broken system and a
            blank canvas — the theory only shows up after you&apos;ve earned it.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex justify-center gap-3"
          >
            <Link
              href="/learn/build-dfa-security"
              className="rounded-xl border border-arc-cyan/50 bg-arc-cyan/15 px-6 py-3 font-medium tracking-wide text-arc-cyan shadow-glow transition-all hover:bg-arc-cyan/25"
            >
              Enter the Academy ▶
            </Link>
          </motion.div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-sm uppercase tracking-widest text-ink-mid">
          Academy Districts
        </h2>
        <AcademyMap />
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
