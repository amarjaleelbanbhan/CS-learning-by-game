'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { areEquivalent, findDistinguishingString, minimizeDfa } from '@arc/engine-automata';
import { useGameStore } from '@/components/state/gameStore';
import { useCompanionStore } from '@/components/companion/companionStore';
import { playSfx } from '@/lib/fx/sound';
import { Panel } from '@/components/ui/Panel';
import { HoloButton } from '@/components/ui/HoloButton';
import { GraphView } from '@/components/viz/GraphView';
import { dfaToGraphModel } from '@/components/viz/graph-model';
import { DfaBuilderCanvas } from '@/components/viz/builder/DfaBuilderCanvas';
import { useHasMounted } from '@/components/hud/useHasMounted';
import { VictoryCrest } from '@/components/fx/VictoryCrest';
import {
  compileToDfa,
  emptyBuilderModel,
  validateBuilder,
  type BuilderModel,
} from '@/lib/automata/builder-types';
import { simulateDfa } from '@arc/engine-simulation';
import { HintPanel, HintTriggerButton } from './HintPanel';
import { ariaBrief, ariaDebrief } from '@/lib/companion/mentorActions';
import { dfaMinimizationQuestion, redundantDfaView } from '@/lib/questions/dfa-minimization';

const MISSION_ID = dfaMinimizationQuestion.id;
const VISUALIZATION_HINT_TIER = 5;

export function DfaMinimizationMission() {
  const question = dfaMinimizationQuestion;
  const alphabet = question.payload.alphabet;

  const redundantView = useMemo(() => redundantDfaView(), []);
  const redundantDfa = redundantView.dfa;

  // Pre-calculate the minimal state count
  const minimalDfa = useMemo(() => minimizeDfa(redundantDfa), [redundantDfa]);
  const minimalStateCount = minimalDfa.states.length; // 2

  const redundantModel = useMemo(
    () => dfaToGraphModel(redundantDfa, redundantView.layout),
    [redundantDfa, redundantView.layout],
  );

  const [model, setModel] = useState<BuilderModel>(emptyBuilderModel());
  const [testInput, setTestInput] = useState('101');
  const [testResult, setTestResult] = useState<'accept' | 'reject' | null>(null);
  const [structuralError, setStructuralError] = useState<string | null>(null);

  const [failedAttempts, setFailedAttempts] = useState(0);
  const [revealedTier, setRevealedTier] = useState(-1);
  const [counterexample, setCounterexample] = useState<string | null>(null);
  const [nonMinimalWarning, setNonMinimalWarning] = useState<boolean>(false);
  const [hintsOpen, setHintsOpen] = useState(false);

  const completed = useGameStore((s) => Boolean(s.completed[MISSION_ID]));
  const completeMission = useGameStore((s) => s.completeMission);
  const say = useCompanionStore((s) => s.say);
  const [celebrate, setCelebrate] = useState(false);

  const startedAt = useRef(Date.now());
  const mounted = useHasMounted();
  const briefed = useRef(false);

  useEffect(() => {
    if (!mounted || briefed.current || completed) return;
    briefed.current = true;
    const t = setTimeout(() => ariaBrief(MISSION_ID), 600);
    return () => clearTimeout(t);
  }, [mounted, completed]);

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
    setNonMinimalWarning(false);
    setCounterexample(null);

    const compiled = compileToDfa(model, alphabet);

    // 1. Language Equivalence Check
    const equivalent = areEquivalent(compiled, redundantDfa);

    if (!equivalent) {
      playSfx('error');
      const diff = findDistinguishingString(compiled, redundantDfa);
      setCounterexample(diff);
      setFailedAttempts((n) => n + 1);
      say(failedAttempts === 0 ? 'reject' : 'idle');
      return;
    }

    // 2. Minimality Check
    const isMinimal = compiled.states.length <= minimalStateCount;
    if (!isMinimal) {
      playSfx('error');
      setNonMinimalWarning(true);
      setFailedAttempts((n) => n + 1);
      say('idle');
      return;
    }

    // Success!
    playSfx('reward');
    if (!completed) {
      completeMission(MISSION_ID, question.xpReward, question.coinsReward);
      setCelebrate(true);
    }
    ariaDebrief({
      missionId: MISSION_ID,
      missionTitle: question.prompt,
      conceptId: 'dfa-minimization',
      correct: true,
      hintsUsed: Math.max(0, revealedTier + 1),
      attempts: failedAttempts + 1,
      usedVisualization: revealedTier >= VISUALIZATION_HINT_TIER,
      timeMs: Date.now() - startedAt.current,
      discoveredOwnMistake: failedAttempts > 0 && revealedTier < VISUALIZATION_HINT_TIER,
      improvedReasoning: false,
    });
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_1.1fr]">
      {/* Side-by-side panels: Left is Redundant DFA, Right is Workspace */}
      <div className="space-y-5">
        <Panel className="p-5" glow>
          <div className="mb-1 font-display text-[11px] uppercase tracking-[0.3em] text-arc-cyan/80">
            Security District · Optimization
          </div>
          <h1 className="font-display text-2xl font-bold text-glow">Trim the Fat</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-mid">{question.prompt}</p>
        </Panel>

        <Panel className="p-4 relative">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xs uppercase tracking-widest text-ink-mid font-semibold">
              Redundant 7-State Circuit (Ends in 0)
            </h2>
            <span className="font-mono text-[10px] text-ink-low">Read-Only Reference Graph</span>
          </div>
          <GraphView model={redundantModel} height={320} fitViewKey="redundant" />
        </Panel>

        {/* Hints panel */}
        <Panel className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-display text-xs uppercase tracking-wider text-ink-low">
              ARIA&apos;s hints
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
        </Panel>
      </div>

      {/* Editor canvas and grader */}
      <div className="space-y-5">
        <Panel className="p-4" glow>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm uppercase tracking-widest text-ink-mid font-bold">
              Minimized DFA Construction Canvas
            </h2>
            <span className="rounded-md border border-arc-cyan/20 px-2 py-0.5 font-mono text-[11px] text-arc-cyan">
              Σ = {'{' + alphabet.join(', ') + '}'}
            </span>
          </div>

          <DfaBuilderCanvas alphabet={alphabet} value={model} onChange={setModel} height={380} />

          <div className="mt-4 space-y-3">
            <div className="flex gap-2">
              <input
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runTest()}
                spellCheck={false}
                placeholder="Test a sequence, e.g. 1010"
                className="w-full rounded-xl border border-ink-low/30 bg-void/60 px-3 py-2 font-mono text-ink-hi outline-none transition-colors focus:border-arc-cyan/60"
              />
              <HoloButton intent="ghost" onClick={runTest}>
                Test
              </HoloButton>
            </div>
            {structuralError && (
              <p className="text-xs text-reject font-mono">⚠️ {structuralError}</p>
            )}

            <AnimatePresence>
              {testResult && !structuralError && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-mono ${
                    testResult === 'accept'
                      ? 'border-accept/40 bg-accept/10 text-accept'
                      : 'border-reject/40 bg-reject/10 text-reject'
                  }`}
                >
                  <span>{testResult === 'accept' ? '✓' : '✕'}</span>
                  <span>
                    &quot;{testInput || 'ε'}&quot;{' '}
                    {testResult === 'accept' ? 'ACCEPTED' : 'REJECTED'} by your machine
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <HoloButton intent="success" className="w-full py-3" onClick={submit}>
              Submit Optimized Circuit ▶
            </HoloButton>
          </div>
        </Panel>

        {/* Custom Grader Feedback Panel */}
        <AnimatePresence>
          {counterexample !== null && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Panel className="border-reject/30 bg-reject/5 p-4">
                <div className="flex items-center gap-2 text-reject font-display text-xs uppercase tracking-widest font-bold">
                  <span>✕</span>
                  <span>Equivalence Check Failed</span>
                </div>
                <p className="mt-1 text-xs text-ink-mid">
                  Your machine is not equivalent to the reference circuit. It behaves differently on
                  the following input:
                </p>
                <div className="mt-2 rounded-lg bg-void/50 border border-reject/20 p-3">
                  <span className="font-display text-[9px] uppercase tracking-wider text-reject/80">
                    Divergent Test Code
                  </span>
                  <p className="mt-0.5 font-mono text-sm text-ink-hi">
                    &quot;{counterexample || 'ε'}&quot;
                  </p>
                </div>
              </Panel>
            </motion.div>
          )}

          {nonMinimalWarning && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Panel className="border-arc-violet/30 bg-arc-violet/5 p-4">
                <div className="flex items-center gap-2 text-arc-violet font-display text-xs uppercase tracking-widest font-bold">
                  <span>⚠️</span>
                  <span>DFA is Not Minimal</span>
                </div>
                <p className="mt-1 text-xs text-ink-mid">
                  Your DFA is language-equivalent and correct, but it is not minimal! It contains{' '}
                  {model.states.length} states, while the minimal DFA only needs {minimalStateCount}{' '}
                  states. Merge equivalent states to optimize.
                </p>
              </Panel>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Celebration overlay */}
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
              className="glass rounded-3xl border-accept/40 p-8 text-center shadow-glow-strong"
            >
              <VictoryCrest icon="checkmark" />
              <div className="mt-3 font-display text-2xl font-bold text-glow">
                Optimization Achieved
              </div>
              <p className="mt-1 text-sm text-ink-mid">
                The redundant states were collapsed successfully!
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
