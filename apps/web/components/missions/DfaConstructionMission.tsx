'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { gradeDfaConstruction, unlockedHintTier } from '@arc/engine-assessment';
import { simulateDfa } from '@arc/engine-simulation';
import { useGameStore } from '@/components/state/gameStore';
import { useCompanionStore } from '@/components/companion/companionStore';
import { playSfx } from '@/lib/fx/sound';
import { Panel } from '@/components/ui/Panel';
import { HoloButton } from '@/components/ui/HoloButton';
import { AutomatonGraph } from '@/components/viz/AutomatonGraph';
import { SimulationControls } from '@/components/viz/SimulationControls';
import { usePlayback } from '@/components/viz/usePlayback';
import { DfaBuilderCanvas } from '@/components/viz/builder/DfaBuilderCanvas';
import {
  compileToDfa,
  emptyBuilderModel,
  validateBuilder,
  type BuilderModel,
} from '@/lib/automata/builder-types';
import { dfaSecurityProtocol, referenceView } from '@/lib/questions/dfa-security-protocol';
import { HintPanel, HintTriggerButton } from './HintPanel';

const MISSION_ID = dfaSecurityProtocol.id;

export function DfaConstructionMission() {
  const question = dfaSecurityProtocol;
  const alphabet = question.payload.alphabet;
  const reference = useMemo(referenceView, []);
  const referenceDfa = reference.dfa;

  const [model, setModel] = useState<BuilderModel>(emptyBuilderModel());
  const [testInput, setTestInput] = useState('101');
  const [testResult, setTestResult] = useState<'accept' | 'reject' | null>(null);
  const [structuralError, setStructuralError] = useState<string | null>(null);

  const [failedAttempts, setFailedAttempts] = useState(0);
  const [revealedTier, setRevealedTier] = useState(-1);
  const [counterexample, setCounterexample] = useState<string | null>(null);
  const [hintsOpen, setHintsOpen] = useState(false);

  const completed = useGameStore((s) => Boolean(s.completed[MISSION_ID]));
  const completeMission = useGameStore((s) => s.completeMission);
  const say = useCompanionStore((s) => s.say);
  const [celebrate, setCelebrate] = useState(false);

  const refTrace = useMemo(
    () => simulateDfa(referenceDfa, counterexample || '101'),
    [referenceDfa, counterexample],
  );
  const refPlayback = usePlayback(refTrace);

  // Highlight targets resolve against the PLAYER's own graph, not the hidden
  // reference — the point is to direct attention, not to leak the answer.
  const startState = model.states.find((s) => s.isStart) ?? null;
  const divergentEdgeId = useMemo(() => {
    if (revealedTier < 3 || !counterexample || !startState) return null;
    try {
      const compiled = compileToDfa(model, alphabet);
      const trace = simulateDfa(compiled, counterexample);
      const last = trace.frames.at(-1)?.data;
      const prev = trace.frames.at(-2)?.data;
      if (!prev || prev.currentState === null) return null;
      const to = last?.currentState ?? null;
      return to ? `${prev.currentState}->${to}` : null;
    } catch {
      return null;
    }
  }, [revealedTier, counterexample, startState, model, alphabet]);

  function runTest() {
    const cleaned = testInput.trim();
    if (!/^[01]*$/.test(cleaned)) {
      setStructuralError('Use only 0 and 1.');
      return;
    }
    const validation = validateBuilder(model);
    if (!validation.valid) {
      setStructuralError(validation.error);
      setTestResult(null);
      return;
    }
    setStructuralError(null);
    const compiled = compileToDfa(model, alphabet);
    const trace = simulateDfa(compiled, cleaned);
    setTestResult(trace.outcome === 'accept' ? 'accept' : 'reject');
    playSfx(trace.outcome === 'accept' ? 'success' : 'error');
  }

  function submit() {
    const validation = validateBuilder(model);
    if (!validation.valid) {
      setStructuralError(validation.error);
      return;
    }
    setStructuralError(null);
    const compiled = compileToDfa(model, alphabet);
    const result = gradeDfaConstruction(compiled, referenceDfa);

    if (result.correct) {
      playSfx('reward');
      say('mission-complete');
      if (!completed) {
        completeMission(MISSION_ID, question.xpReward, question.coinsReward);
        setCelebrate(true);
      }
    } else {
      playSfx('error');
      setCounterexample(result.counterexample);
      setFailedAttempts((n) => n + 1);
      say(failedAttempts === 0 ? 'reject' : 'idle');
    }
  }

  const unlocked = unlockedHintTier(failedAttempts);

  return (
    <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
      <Panel className="p-4" glow>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-sm uppercase tracking-widest text-ink-mid">
            Construction Bay
          </h2>
          <span className="rounded-md border border-arc-cyan/20 px-2 py-0.5 font-mono text-[11px] text-arc-cyan">
            Σ = {'{' + alphabet.join(', ') + '}'}
          </span>
        </div>

        <DfaBuilderCanvas
          alphabet={alphabet}
          value={model}
          onChange={setModel}
          height={380}
          highlightStateId={revealedTier >= 2 && startState ? startState.id : null}
          highlightEdgeId={revealedTier >= 3 ? divergentEdgeId : null}
        />

        <div className="mt-4 space-y-2">
          <div className="flex gap-2">
            <input
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runTest()}
              spellCheck={false}
              placeholder="Test a code, e.g. 1101"
              className="w-full rounded-xl border border-ink-low/30 bg-void/60 px-3 py-2 font-mono text-ink-hi outline-none transition-colors focus:border-arc-cyan/60"
            />
            <HoloButton intent="ghost" onClick={runTest}>
              Test
            </HoloButton>
          </div>
          {structuralError && <p className="text-xs text-reject">{structuralError}</p>}
          <AnimatePresence>
            {testResult && !structuralError && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                  testResult === 'accept'
                    ? 'border-accept/40 bg-accept/10 text-accept'
                    : 'border-reject/40 bg-reject/10 text-reject'
                }`}
              >
                <span>{testResult === 'accept' ? '✓' : '✕'}</span>
                <span className="font-mono text-xs">
                  &quot;{testInput || 'ε'}&quot; {testResult === 'accept' ? 'ACCEPTED' : 'REJECTED'}{' '}
                  by your machine
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          <HoloButton intent="success" className="w-full" onClick={submit}>
            Submit Solution ▶
          </HoloButton>
        </div>
      </Panel>

      <div className="flex flex-col gap-5">
        <Panel className="p-5">
          <div className="mb-1 font-display text-[11px] uppercase tracking-[0.3em] text-arc-cyan/80">
            Mission · Perimeter Security
          </div>
          <h1 className="font-display text-2xl font-bold text-glow">{question.prompt}</h1>
          {failedAttempts > 0 && !completed && (
            <p className="mt-3 font-mono text-xs text-ink-low">
              Attempt {failedAttempts} logged. Not quite — the codes your circuit gets wrong don't
              all look the same. Worth testing a few more before trying again.
            </p>
          )}
        </Panel>

        <Panel className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-display text-xs uppercase tracking-wider text-ink-low">
              ARIA's hints
            </div>
            <HintTriggerButton
              failedAttempts={failedAttempts}
              open={hintsOpen}
              onToggle={() => setHintsOpen((v) => !v)}
            />
          </div>
          {hintsOpen && (
            <HintPanel
              hints={question.hints}
              failedAttempts={failedAttempts}
              revealedTier={revealedTier}
              onReveal={(tier) => {
                setRevealedTier(Math.max(revealedTier, tier));
                if (tier <= 1) say('idle');
              }}
            />
          )}
          {revealedTier >= 4 && (
            <div className="mt-3 border-t border-ink-low/10 pt-3">
              <p className="mb-2 text-xs text-ink-mid">
                {revealedTier >= 5
                  ? 'A working circuit for this exact rule:'
                  : 'A different machine, same idea — watch where it lights up:'}
              </p>
              <AutomatonGraph
                view={reference}
                activeStates={
                  refPlayback.frame?.data.currentState ? [refPlayback.frame.data.currentState] : []
                }
                height={220}
              />
              <div className="mt-2">
                <SimulationControls pb={refPlayback} />
              </div>
            </div>
          )}
        </Panel>

        {unlocked >= 0 && counterexample !== null && revealedTier < 2 && (
          <Panel className="p-4">
            <p className="font-mono text-xs text-ink-low">
              💡 Try testing: <span className="text-arc-cyan">{counterexample || 'ε'}</span>
            </p>
          </Panel>
        )}
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
              className="glass rounded-3xl border-accept/40 p-8 text-center shadow-accept"
            >
              <div className="text-5xl">🛡️</div>
              <div className="mt-3 font-display text-2xl font-bold text-glow">
                Perimeter Secured
              </div>
              <p className="mt-1 text-sm text-ink-mid">
                Your circuit correctly recognizes every valid access code.
                <br />+{question.xpReward} XP &nbsp;·&nbsp;{' '}
                <span className="text-arc-gold">+{question.coinsReward} ◈</span>
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
