'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { subsetConstruction } from '@arc/engine-automata';
import { simulateDfa } from '@arc/engine-simulation';
import { analyzeSubsetConstruction, type SubsetAnalysisResult } from '@arc/engine-assessment';
import { useGameStore } from '@/components/state/gameStore';
import { useHasMounted } from '@/components/hud/useHasMounted';
import { playSfx } from '@/lib/fx/sound';
import { Panel } from '@/components/ui/Panel';
import { HoloButton } from '@/components/ui/HoloButton';
import { GraphView } from '@/components/viz/GraphView';
import { nfaToGraphModel } from '@/components/viz/graph-model';
import { DfaBuilderCanvas } from '@/components/viz/builder/DfaBuilderCanvas';
import { useHistory } from '@/components/viz/builder/useHistory';
import {
  compileToDfa,
  emptyBuilderModel,
  validateBuilder,
  type BuilderModel,
} from '@/lib/automata/builder-types';
import { NFA_TIERS, nfaDeterminizeQuestion, type NfaTier } from '@/lib/questions/nfa-determinize';
import { HintPanel, HintTriggerButton } from './HintPanel';
import { MistakeFeedback } from './nfa-determinize/MistakeFeedback';
import { ComparisonView } from './nfa-determinize/ComparisonView';
import { ReplayViewer } from './nfa-determinize/ReplayViewer';
import { SubsetVizBlock } from './nfa-determinize/SubsetVizBlock';
import { ariaBrief, ariaDebrief, ariaMisconceptionCheck } from '@/lib/companion/mentorActions';
import type { SubsetMistakeKind } from '@arc/engine-assessment';
import { boostedRewards } from '@/lib/world/rewards';

/** Mistake kinds that specifically indicate the "subsets are chosen arbitrarily rather
 * than derived by reachability" misconception this mission targets — not every wrong
 * submission reflects it (a stray wrong-accepting flag is a different, simpler slip). */
const MISCONCEPTION_MISTAKE_KINDS: ReadonlySet<SubsetMistakeKind> = new Set([
  'missing-subset',
  'duplicate-subset',
  'wrong-epsilon-closure',
]);
const SUBSET_MISCONCEPTION_ID = 'subset-construction-random-combinations';

const MISSION_ID = nfaDeterminizeQuestion.id;
const VISUALIZATION_HINT_TIER = 5; // index of 'visualization' in HINT_KIND_ORDER
const COMPARISON_REVEAL_TIER = 3; // index of 'highlight-transition'

const TIER_ORDER: readonly NfaTier[] = ['easy', 'hard', 'boss'];

export function NfaDeterminizeMission() {
  const mounted = useHasMounted();
  const [tier, setTier] = useState<NfaTier>('easy');
  const nfaView = useMemo(() => NFA_TIERS[tier].view(), [tier]);
  const alphabet = nfaView.nfa.alphabet;
  const nfaModel = useMemo(() => nfaToGraphModel(nfaView.nfa, nfaView.layout), [nfaView]);
  const referenceStateCount = useMemo(
    () => subsetConstruction(nfaView.nfa).dfa.states.length,
    [nfaView],
  );

  const history = useHistory<BuilderModel>(emptyBuilderModel());
  const model = history.value;

  const [prediction, setPrediction] = useState('');
  const [predictionLocked, setPredictionLocked] = useState(false);

  const [testInput, setTestInput] = useState('101');
  const [testResult, setTestResult] = useState<'accept' | 'reject' | null>(null);
  const [structuralError, setStructuralError] = useState<string | null>(null);

  const [failedAttempts, setFailedAttempts] = useState(0);
  const [revealedTier, setRevealedTier] = useState(-1);
  const [hintsOpen, setHintsOpen] = useState(false);
  const [analysis, setAnalysis] = useState<SubsetAnalysisResult | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [showReplay, setShowReplay] = useState(false);
  const [showRewardViz, setShowRewardViz] = useState(false);
  const [completedSnapshots, setCompletedSnapshots] = useState<readonly BuilderModel[] | null>(
    null,
  );

  const completed = useGameStore((s) => Boolean(s.completed[MISSION_ID]));
  const completeMission = useGameStore((s) => s.completeMission);
  const claimOnce = useGameStore((s) => s.claimOnce);

  const startedAt = useRef(Date.now());
  const viewedVisualizationRef = useRef(false);
  const briefed = useRef(false);

  useEffect(() => {
    if (!mounted || briefed.current) return;
    briefed.current = true;
    const t = setTimeout(() => ariaBrief(MISSION_ID), 600);
    return () => clearTimeout(t);
  }, [mounted]);

  function switchTier(next: NfaTier) {
    setTier(next);
    history.reset(emptyBuilderModel());
    setPrediction('');
    setPredictionLocked(false);
    setTestResult(null);
    setStructuralError(null);
    setFailedAttempts(0);
    setRevealedTier(-1);
    setAnalysis(null);
    setCelebrate(false);
    setShowReplay(false);
    setShowRewardViz(false);
    setCompletedSnapshots(null);
    startedAt.current = Date.now();
    viewedVisualizationRef.current = false;
  }

  function runTest() {
    const validation = validateBuilder(model);
    if (!validation.valid) {
      setStructuralError(validation.error);
      return;
    }
    setStructuralError(null);
    const compiled = compileToDfa(model, alphabet);
    const trace = simulateDfa(compiled, testInput.trim());
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
    setPredictionLocked(true);

    const compiled = compileToDfa(model, alphabet);
    const result = analyzeSubsetConstruction(compiled, nfaView.nfa);
    setAnalysis(result);

    const usedVisualization =
      revealedTier >= VISUALIZATION_HINT_TIER || viewedVisualizationRef.current;

    if (result.correct) {
      playSfx('reward');
      const tierContent = NFA_TIERS[tier];
      if (!completed) {
        completeMission(
          MISSION_ID,
          ...boostedRewards(MISSION_ID, tierContent.xpReward, tierContent.coinsReward),
        );
        setCelebrate(true);
      }
      claimOnce(
        `nfa-determinize-tier-${tier}`,
        Math.round(tierContent.xpReward * 0.2),
        Math.round(tierContent.coinsReward * 0.2),
      );
      setCompletedSnapshots(history.snapshots);
      ariaDebrief({
        missionId: MISSION_ID,
        missionTitle: nfaDeterminizeQuestion.prompt,
        conceptId: nfaDeterminizeQuestion.concept,
        correct: true,
        hintsUsed: revealedTier + 1,
        attempts: failedAttempts + 1,
        usedVisualization,
        timeMs: Date.now() - startedAt.current,
        discoveredOwnMistake: failedAttempts > 0 && revealedTier < VISUALIZATION_HINT_TIER,
        improvedReasoning: false,
      });
    } else {
      playSfx('error');
      const nextFailedAttempts = failedAttempts + 1;
      setFailedAttempts(nextFailedAttempts);

      const hasTargetedMistake = result.mistakes.some((m) =>
        MISCONCEPTION_MISTAKE_KINDS.has(m.kind),
      );
      if (hasTargetedMistake) {
        const struggleLevel =
          nextFailedAttempts >= 4 ? 'stuck' : nextFailedAttempts >= 2 ? 'significant' : 'mild';
        ariaMisconceptionCheck(SUBSET_MISCONCEPTION_ID, struggleLevel);
      }
    }
  }

  const predictionDelta =
    predictionLocked && prediction !== '' ? Number(prediction) - referenceStateCount : null;

  return (
    <div className="space-y-5">
      <Panel className="p-5" glow>
        <div className="mb-1 font-display text-[11px] uppercase tracking-[0.3em] text-arc-cyan/80">
          Quantum Research Lab · Flagship
        </div>
        <h1 className="font-display text-2xl font-bold text-glow">Collapse the Superposition</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-mid">{nfaDeterminizeQuestion.prompt}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {TIER_ORDER.map((t) => (
            <button
              key={t}
              onClick={() => switchTier(t)}
              className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                tier === t
                  ? 'border-arc-cyan/50 bg-arc-cyan/10 text-arc-cyan'
                  : 'border-ink-low/20 text-ink-mid hover:border-arc-cyan/30 hover:text-ink-hi'
              }`}
            >
              {NFA_TIERS[t].label}
            </button>
          ))}
        </div>
        <p className="mt-2 font-mono text-xs text-ink-low">{NFA_TIERS[tier].description}</p>
      </Panel>

      <Panel className="p-4">
        <h2 className="mb-2 font-display text-sm uppercase tracking-widest text-ink-mid">
          Source NFA
        </h2>
        <GraphView model={nfaModel} height={260} fitViewKey={tier} />
      </Panel>

      {!predictionLocked && (
        <Panel className="border-arc-violet/25 bg-arc-violet/5 p-4">
          <h3 className="font-display text-xs uppercase tracking-widest text-arc-violet">
            Predict before you build
          </h3>
          <p className="mt-1 text-xs text-ink-mid">
            How many reachable DFA states do you think this NFA collapses into?
          </p>
          <div className="mt-2 flex gap-2">
            <input
              type="number"
              min={1}
              value={prediction}
              onChange={(e) => setPrediction(e.target.value)}
              className="w-24 rounded-lg border border-ink-low/25 bg-void/60 px-2 py-1 font-mono text-sm text-ink-hi outline-none focus:border-arc-violet/50"
            />
            <HoloButton intent="ghost" onClick={() => setPredictionLocked(true)}>
              Lock in prediction
            </HoloButton>
          </div>
        </Panel>
      )}
      {predictionLocked && prediction !== '' && predictionDelta !== null && analysis && (
        <p className="text-xs text-ink-low">
          You predicted {prediction} — the reference has {referenceStateCount}.{' '}
          {predictionDelta === 0
            ? 'Exact.'
            : predictionDelta > 0
              ? 'You overestimated.'
              : 'You underestimated.'}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Panel className="p-4" glow>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm uppercase tracking-widest text-ink-mid">
              Your DFA — label states as subsets, e.g. q0,q1
            </h2>
            <div className="flex gap-1.5">
              <button
                onClick={history.undo}
                disabled={!history.canUndo}
                className="rounded-md border border-ink-low/25 px-2 py-1 text-xs text-ink-mid disabled:opacity-30"
              >
                ↶ Undo
              </button>
              <button
                onClick={history.redo}
                disabled={!history.canRedo}
                className="rounded-md border border-ink-low/25 px-2 py-1 text-xs text-ink-mid disabled:opacity-30"
              >
                ↷ Redo
              </button>
            </div>
          </div>

          <DfaBuilderCanvas
            alphabet={alphabet}
            value={model}
            onChange={history.set}
            height={380}
            allowRename
          />

          <div className="mt-4 space-y-2">
            <div className="flex gap-2">
              <input
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runTest()}
                spellCheck={false}
                placeholder={`Test a string, e.g. ${alphabet.join('')}`}
                className="w-full rounded-xl border border-ink-low/30 bg-void/60 px-3 py-2 font-mono text-ink-hi outline-none transition-colors focus:border-arc-cyan/60"
              />
              <HoloButton intent="ghost" onClick={runTest}>
                Test
              </HoloButton>
            </div>
            {structuralError && <p className="text-xs text-reject">{structuralError}</p>}
            {testResult && !structuralError && (
              <div
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
              </div>
            )}
            <HoloButton intent="success" className="w-full" onClick={submit}>
              Submit Solution ▶
            </HoloButton>
          </div>
        </Panel>

        <div className="flex flex-col gap-5">
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
                hints={nfaDeterminizeQuestion.hints}
                failedAttempts={failedAttempts}
                revealedTier={revealedTier}
                onReveal={(t) => {
                  setRevealedTier(Math.max(revealedTier, t));
                  if (t >= VISUALIZATION_HINT_TIER) viewedVisualizationRef.current = true;
                }}
              />
            )}
          </Panel>

          {revealedTier >= VISUALIZATION_HINT_TIER && <SubsetVizBlock nfa={nfaView.nfa} />}

          {analysis && !analysis.correct && (
            <>
              <MistakeFeedback
                mistakes={analysis.mistakes}
                counterexample={analysis.counterexample}
              />
              {analysis.counterexample !== null && (
                <ComparisonView
                  playerModel={model}
                  alphabet={alphabet}
                  nfa={nfaView.nfa}
                  counterexample={analysis.counterexample}
                  revealReference={revealedTier >= COMPARISON_REVEAL_TIER}
                />
              )}
            </>
          )}
        </div>
      </div>

      {completed && completedSnapshots && (
        <div className="flex flex-wrap gap-2">
          <HoloButton intent="ghost" onClick={() => setShowReplay((v) => !v)}>
            {showReplay ? 'Hide replay' : 'Replay your build'}
          </HoloButton>
          <HoloButton
            intent="ghost"
            onClick={() => {
              viewedVisualizationRef.current = true;
              setShowRewardViz((v) => !v);
            }}
          >
            {showRewardViz ? 'Hide confirmation' : 'Watch it confirmed'}
          </HoloButton>
        </div>
      )}
      {showReplay && completedSnapshots && <ReplayViewer snapshots={completedSnapshots} />}
      {showRewardViz && <SubsetVizBlock nfa={nfaView.nfa} />}

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
              className="glass rounded-3xl border-arc-cyan/40 p-8 text-center shadow-glow-strong"
            >
              <div className="text-5xl">⚡</div>
              <div className="mt-3 font-display text-2xl font-bold text-glow">
                Superposition Collapsed
              </div>
              <p className="mt-1 text-sm text-ink-mid">
                Your DFA is language-equivalent to the reference.
                <br />+{NFA_TIERS[tier].xpReward} XP &nbsp;·&nbsp;{' '}
                <span className="text-arc-gold">+{NFA_TIERS[tier].coinsReward} ◈</span>
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
