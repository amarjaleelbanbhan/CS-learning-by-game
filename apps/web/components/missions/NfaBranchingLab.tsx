'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { simulateNfa } from '@arc/engine-simulation';
import { useGameStore } from '@/components/state/gameStore';
import { useCompanionStore } from '@/components/companion/companionStore';
import { playSfx } from '@/lib/fx/sound';
import { Panel } from '@/components/ui/Panel';
import { HoloButton } from '@/components/ui/HoloButton';
import { BranchGraph } from '@/components/viz/nfa/BranchGraph';
import { QuantumBackdrop } from '@/components/viz/nfa/QuantumBackdrop';
import { SimulationControls } from '@/components/viz/SimulationControls';
import { Tape } from '@/components/viz/Tape';
import { usePlayback } from '@/components/viz/usePlayback';
import { containsAaView } from '@/lib/automata/examples';

const MISSION_ID = 'toa.nfa-branching';
const EXAMPLES = ['aab', 'aaab', 'aba', 'b', 'baaab'];

export function NfaBranchingLab() {
  const view = useMemo(containsAaView, []);
  const nfa = view.nfa;

  const [input, setInput] = useState('aab');
  const [runString, setRunString] = useState('');
  const [hasRun, setHasRun] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  const trace = useMemo(() => simulateNfa(nfa, runString), [nfa, runString]);
  const pb = usePlayback(trace);

  const completed = useGameStore((s) => Boolean(s.completed[MISSION_ID]));
  const completeMission = useGameStore((s) => s.completeMission);
  const say = useCompanionStore((s) => s.say);

  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    pb.play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trace]);

  const frame = pb.frame?.data;
  const prevFrame = pb.index > 0 ? trace.frames[pb.index - 1]?.data : undefined;
  const activeNodes = frame?.activeStates ?? [];
  const diedNodes = frame?.diedStates ?? [];
  const prevActiveNodes = prevFrame?.activeStates ?? [];
  const acceptBurst = pb.atEnd && trace.outcome === 'accept';

  // ARIA narrates each *kind* of event once per run, right as it first
  // happens — never on every frame (would be noise during autoplay/fast scrub).
  // Guarded against re-processing the same index twice (React 18 StrictMode
  // double-invokes effects in dev; without this guard that second call would
  // fall through the chain below and silently "use up" the next category
  // before the user ever sees it).
  const spokenRef = useRef<Set<string>>(new Set());
  const lastIndexRef = useRef<number>(-1);
  useEffect(() => {
    if (!frame || lastIndexRef.current === pb.index) return;
    lastIndexRef.current = pb.index;
    const spoken = spokenRef.current;
    const epsilonActiveNow =
      activeNodes.includes(nfa.start) && activeNodes.some((id) => id !== nfa.start);
    if (!spoken.has('epsilon') && pb.index === 0 && epsilonActiveNow) {
      spoken.add('epsilon');
      say('epsilon-used');
    } else if (!spoken.has('branch') && activeNodes.length >= 2) {
      spoken.add('branch');
      say('branch-spawn');
    } else if (!spoken.has('death') && diedNodes.length > 0) {
      spoken.add('death');
      say('branch-died');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pb.index, runString]);

  useEffect(() => {
    if (acceptBurst && runString.length > 0) {
      say('nfa-accept');
      playSfx('reward');
      if (!completed) {
        completeMission(MISSION_ID, 180, 60);
        setCelebrate(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acceptBurst]);

  const showResult = hasRun && pb.index === pb.total - 1;
  const accepted = trace.outcome === 'accept';

  function run(value: string) {
    const cleaned = value.trim();
    if (!/^[ab]*$/.test(cleaned)) {
      setError("This machine's alphabet is {a, b}. Use only a and b.");
      return;
    }
    setError(null);
    setHasRun(true);
    spokenRef.current.clear();
    lastIndexRef.current = -1;
    if (cleaned === runString) {
      pb.restart();
      requestAnimationFrame(() => pb.play());
    } else {
      setRunString(cleaned);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
      <Panel className="relative overflow-hidden p-4" glow>
        <QuantumBackdrop />
        <div className="relative mb-3 flex items-center justify-between">
          <h2 className="font-display text-sm uppercase tracking-widest text-ink-mid">
            NFA · Quantum Branching
          </h2>
          <span className="font-mono text-xs text-ink-low">L = contains &quot;aa&quot;</span>
        </div>

        <div className="relative">
          <BranchGraph
            nfa={nfa}
            layout={view.layout}
            activeNodes={activeNodes}
            diedNodes={diedNodes}
            prevActiveNodes={prevActiveNodes}
            acceptBurst={acceptBurst}
            height={340}
          />
        </div>

        <div className="relative mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-display text-xs uppercase tracking-wider text-ink-low">Tape</span>
            <Tape input={runString} position={frame?.position ?? 0} />
            <span className="ml-auto rounded-md border border-arc-violet/30 bg-arc-violet/10 px-2 py-0.5 font-mono text-[11px] text-arc-violet">
              {activeNodes.length} active branch{activeNodes.length === 1 ? '' : 'es'}
            </span>
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
              className={`relative mt-2 flex items-center gap-3 rounded-xl border px-4 py-3 ${
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
                  {accepted
                    ? 'contains "aa" — at least one branch survived to an accepting state.'
                    : 'never contains "aa" — every branch died or fell short.'}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Panel>

      <div className="flex flex-col gap-5">
        <Panel className="p-5">
          <div className="mb-1 font-display text-[11px] uppercase tracking-[0.3em] text-arc-violet/90">
            Mission · NFA Lab
          </div>
          <h1 className="font-display text-2xl font-bold text-glow">Many Paths at Once</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-mid">
            What if a machine could try <span className="text-arc-violet">every possibility</span>{' '}
            at the same time? Watch the start state fork every time it reads an{' '}
            <span className="font-mono text-arc-violet">a</span> — one thread keeps searching, the
            other bets this is the start of <span className="font-mono text-arc-violet">aa</span>.
            Only one thread has to survive for the machine to accept.
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
                placeholder="e.g. aab"
                className="w-full rounded-xl border border-ink-low/30 bg-void/60 px-3 py-2 font-mono text-ink-hi outline-none transition-colors focus:border-arc-violet/60"
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
                  className="rounded-lg border border-ink-low/25 px-2 py-1 font-mono text-xs text-ink-mid transition-colors hover:border-arc-violet/40 hover:text-arc-violet"
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
              Run a string the machine <span className="text-accept">accepts</span> to complete the
              mission and earn <span className="text-arc-gold">180 XP</span>.
            </p>
          </div>
        </Panel>

        <Panel className="p-5">
          <div className="font-display text-xs uppercase tracking-wider text-ink-low">
            Field guide
          </div>
          <ul className="mt-2 space-y-2 text-xs text-ink-mid">
            <li>
              <span className="text-arc-violet">Violet halo</span> — a branch that is currently
              alive.
            </li>
            <li>
              <span className="text-reject">Red dissolve</span> — a branch with nowhere to go; it
              dies, but the others keep computing.
            </li>
            <li>
              <span className="text-arc-violet">Dashed ε edge</span> — a teleport. No input is
              consumed when it fires.
            </li>
            <li>
              <span className="text-arc-cyan">Cyan burst</span> — acceptance. One surviving branch
              is all it takes.
            </li>
          </ul>
        </Panel>
      </div>

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
              className="glass rounded-3xl border-arc-violet/40 p-8 text-center"
              style={{ boxShadow: '0 0 40px rgba(155,107,255,0.4)' }}
            >
              <div className="text-5xl">🌀</div>
              <div className="mt-3 font-display text-2xl font-bold text-glow">
                Nondeterminism, Understood
              </div>
              <p className="mt-1 text-sm text-ink-mid">
                +180 XP &nbsp;·&nbsp; <span className="text-arc-gold">+60 ◈</span>
              </p>
              <HoloButton className="mt-5" onClick={() => setCelebrate(false)}>
                Continue
              </HoloButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
