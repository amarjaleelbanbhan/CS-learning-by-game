'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { simulateDfa } from '@arc/engine-simulation';
import { useGameStore } from '@/components/state/gameStore';
import { Panel } from '@/components/ui/Panel';
import { HoloButton } from '@/components/ui/HoloButton';
import { AutomatonGraph } from '@/components/viz/AutomatonGraph';
import { SimulationControls } from '@/components/viz/SimulationControls';
import { Tape } from '@/components/viz/Tape';
import { usePlayback } from '@/components/viz/usePlayback';
import { endsIn01View } from '@/lib/automata/examples';

const MISSION_ID = 'toa.dfa-ends-01';
const EXAMPLES = ['101', '0011', '100', '11101', '010'];

export function DfaMission() {
  const view = useMemo(endsIn01View, []);
  const dfa = view.dfa;

  const [input, setInput] = useState('101');
  const [runString, setRunString] = useState('');
  const [hasRun, setHasRun] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  const trace = useMemo(() => simulateDfa(dfa, runString), [dfa, runString]);
  const pb = usePlayback(trace);

  const completed = useGameStore((s) => Boolean(s.completed[MISSION_ID]));
  const completeMission = useGameStore((s) => s.completeMission);

  // Auto-play whenever a fresh run is submitted (skip the initial mount).
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    pb.play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trace]);

  // Award the mission the first time an accepted string finishes animating.
  useEffect(() => {
    if (pb.atEnd && trace.outcome === 'accept' && runString.length > 0 && !completed) {
      completeMission(MISSION_ID, 150, 50);
      setCelebrate(true);
    }
  }, [pb.atEnd, trace.outcome, runString, completed, completeMission]);

  const data = pb.frame?.data;
  const position = data?.position ?? 0;
  const activeStates = data?.currentState ? [data.currentState] : [];
  const prevState = pb.index > 0 ? trace.frames[pb.index - 1]?.data.currentState : null;
  const activeEdgeKey =
    data?.justRead != null && prevState && data.currentState
      ? `${prevState}->${data.currentState}`
      : null;

  const showResult = hasRun && pb.index === pb.total - 1;
  const accepted = trace.outcome === 'accept';

  function run(value: string) {
    const cleaned = value.trim();
    if (!/^[01]*$/.test(cleaned)) {
      setError("This machine's alphabet is {0, 1}. Use only 0 and 1.");
      return;
    }
    setError(null);
    setHasRun(true);
    if (cleaned === runString) {
      pb.restart();
      requestAnimationFrame(() => pb.play());
    } else {
      setRunString(cleaned);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
      {/* Stage / visualization */}
      <Panel className="relative p-4" glow>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-sm uppercase tracking-widest text-ink-mid">
            DFA · Simulation
          </h2>
          <span className="font-mono text-xs text-ink-low">L = strings ending in 01</span>
        </div>

        <AutomatonGraph
          view={view}
          activeStates={activeStates}
          activeEdgeKey={activeEdgeKey}
          height={340}
        />

        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3">
            <span className="font-display text-xs uppercase tracking-wider text-ink-low">Tape</span>
            <Tape input={runString} position={position} />
          </div>
          <p className="min-h-[1.25rem] font-mono text-xs text-ink-mid">{pb.frame?.label}</p>
          <SimulationControls pb={pb} />
        </div>

        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mt-2 flex items-center gap-3 rounded-xl border px-4 py-3 ${
                accepted
                  ? 'border-accept/50 bg-accept/10 text-accept shadow-accept'
                  : 'border-reject/50 bg-reject/10 text-reject shadow-reject'
              }`}
            >
              <span className="text-xl">{accepted ? '✓' : '✕'}</span>
              <div className="leading-tight">
                <div className="font-display text-sm font-bold">
                  {accepted ? 'ACCEPTED' : 'REJECTED'}
                </div>
                <div className="font-mono text-xs opacity-80">
                  &quot;{runString || 'ε'}&quot;{' '}
                  {accepted ? 'ends in 01 — the machine halts in q2.' : 'does not end in 01.'}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Panel>

      {/* Mission brief + controls */}
      <div className="flex flex-col gap-5">
        <Panel className="p-5">
          <div className="mb-1 font-display text-[11px] uppercase tracking-[0.3em] text-arc-cyan/80">
            Mission 01
          </div>
          <h1 className="font-display text-2xl font-bold text-glow">The Memory of a Machine</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-mid">
            A DFA can only <span className="text-ink-hi">remember</span> which state it&apos;s in —
            nothing else. To accept strings ending in{' '}
            <span className="font-mono text-arc-cyan">01</span>, it just needs to track the last one
            or two symbols. Feed it a string and watch it think.
          </p>

          <div className="mt-5">
            <label className="mb-1 block font-display text-xs uppercase tracking-wider text-ink-low">
              Test a string
            </label>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && run(input)}
                spellCheck={false}
                placeholder="e.g. 1101"
                className="w-full rounded-xl border border-ink-low/30 bg-void/60 px-3 py-2 font-mono text-ink-hi outline-none transition-colors focus:border-arc-cyan/60 focus:shadow-glow"
              />
              <HoloButton onClick={() => run(input)}>Run ▶</HoloButton>
            </div>
            {error && <p className="mt-2 text-xs text-reject">{error}</p>}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => {
                    setInput(ex);
                    run(ex);
                  }}
                  className="rounded-lg border border-ink-low/25 px-2 py-1 font-mono text-xs text-ink-mid transition-colors hover:border-arc-cyan/40 hover:text-arc-cyan"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </Panel>

        <Panel className="p-5">
          <div className="font-display text-xs uppercase tracking-wider text-ink-low">
            Objective
          </div>
          <div className="mt-2 flex items-start gap-3">
            <span
              className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border text-xs ${
                completed
                  ? 'border-accept bg-accept/20 text-accept'
                  : 'border-ink-low/40 text-ink-low'
              }`}
            >
              {completed ? '✓' : ''}
            </span>
            <p className="text-sm text-ink-mid">
              Run a string that the machine <span className="text-accept">accepts</span> to complete
              the mission and earn <span className="text-arc-gold">150 XP</span>.
            </p>
          </div>
        </Panel>
      </div>

      {/* Mission complete celebration */}
      <AnimatePresence>
        {celebrate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCelebrate(false)}
            className="fixed inset-0 z-50 grid place-items-center bg-void/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 18 }}
              className="glass rounded-3xl border-accept/40 p-8 text-center shadow-accept"
            >
              <div className="text-5xl">🎉</div>
              <div className="mt-3 font-display text-2xl font-bold text-glow">Mission Complete</div>
              <p className="mt-1 text-sm text-ink-mid">
                +150 XP &nbsp;·&nbsp; <span className="text-arc-gold">+50 ◈</span>
              </p>
              <HoloButton intent="success" className="mt-5" onClick={() => setCelebrate(false)}>
                Continue
              </HoloButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
