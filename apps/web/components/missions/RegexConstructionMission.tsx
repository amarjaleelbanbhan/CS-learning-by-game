'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  acceptsNFA,
  areEquivalent,
  findDistinguishingString,
  parseRegex,
  subsetConstruction,
  thompson,
  type NFA,
} from '@arc/engine-automata';
import { useGameStore } from '@/components/state/gameStore';
import { useCompanionStore } from '@/components/companion/companionStore';
import { playSfx } from '@/lib/fx/sound';
import { Panel } from '@/components/ui/Panel';
import { HoloButton } from '@/components/ui/HoloButton';
import { GraphView } from '@/components/viz/GraphView';
import { nfaToGraphModel } from '@/components/viz/graph-model';
import { useHasMounted } from '@/components/hud/useHasMounted';
import { VictoryCrest } from '@/components/fx/VictoryCrest';
import { HintPanel, HintTriggerButton } from './HintPanel';
import { ariaBrief, ariaDebrief } from '@/lib/companion/mentorActions';
import {
  REGEX_TIERS,
  regexConstructionQuestion,
  type RegexTier,
} from '@/lib/questions/regex-construction';

const MISSION_ID = regexConstructionQuestion.id;
const VISUALIZATION_HINT_TIER = 4; // index of 'animate-idea' / 'visualization'

function autoLayoutNfa(nfa: NFA): Record<string, { x: number; y: number }> {
  const layout: Record<string, { x: number; y: number }> = {};
  nfa.states.forEach((s, idx) => {
    layout[s] = {
      x: 60 + idx * 110,
      y: 160 + (idx % 2 === 0 ? -35 : 35),
    };
  });
  return layout;
}

export function RegexConstructionMission() {
  const mounted = useHasMounted();
  const [tier, setTier] = useState<RegexTier>('easy');
  const tierContent = REGEX_TIERS[tier];

  const [regexInput, setRegexInput] = useState('1(0|1)*');
  const [testInput, setTestInput] = useState('101');
  const [testResult, setTestResult] = useState<'accept' | 'reject' | null>(null);
  const [syntaxError, setSyntaxError] = useState<string | null>(null);
  const [gradeError, setGradeError] = useState<string | null>(null);

  const [failedAttempts, setFailedAttempts] = useState(0);
  const [revealedTier, setRevealedTier] = useState(-1);
  const [hintsOpen, setHintsOpen] = useState(false);
  const [counterexample, setCounterexample] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  const completed = useGameStore((s) => Boolean(s.completed[MISSION_ID]));
  const completeMission = useGameStore((s) => s.completeMission);
  const claimOnce = useGameStore((s) => s.claimOnce);
  const say = useCompanionStore((s) => s.say);

  const startedAt = useRef(Date.now());
  const briefed = useRef(false);

  useEffect(() => {
    if (!mounted || briefed.current || completed) return;
    briefed.current = true;
    const t = setTimeout(() => ariaBrief(MISSION_ID), 600);
    return () => clearTimeout(t);
  }, [mounted, completed]);

  // Handle tier changes
  function switchTier(next: RegexTier) {
    setTier(next);
    const nextContent = REGEX_TIERS[next];
    setRegexInput(nextContent.referenceRegex.startsWith('1') ? '1(0|1)*' : '(0|1)*');
    setTestInput('101');
    setTestResult(null);
    setSyntaxError(null);
    setGradeError(null);
    setFailedAttempts(0);
    setRevealedTier(-1);
    setCounterexample(null);
    setCelebrate(false);
    startedAt.current = Date.now();
  }

  // Parse regex input to NFA and graph model in real-time
  const parsedResult = useMemo(() => parseRegex(regexInput), [regexInput]);

  const nfaModel = useMemo(() => {
    if (!parsedResult.ok) return null;
    try {
      const nfa = thompson(parsedResult.value);
      const layout = autoLayoutNfa(nfa);
      return nfaToGraphModel(nfa, layout);
    } catch {
      return null;
    }
  }, [parsedResult]);

  // sandbox string test
  function runTest() {
    const cleaned = testInput.trim();
    if (!/^[01]*$/.test(cleaned)) {
      setSyntaxError('The alphabet is binary: use only 0 and 1 (or empty string).');
      return;
    }
    if (!parsedResult.ok) {
      setSyntaxError(`Regex Parse Error: ${parsedResult.error}`);
      setTestResult(null);
      return;
    }
    setSyntaxError(null);
    try {
      const nfa = thompson(parsedResult.value);
      const accepted = acceptsNFA(nfa, cleaned);
      setTestResult(accepted ? 'accept' : 'reject');
      playSfx(accepted ? 'success' : 'error');
    } catch (e) {
      setSyntaxError(e instanceof Error ? e.message : 'Invalid NFA simulation.');
      setTestResult(null);
    }
  }

  // insert helper characters
  function insertSymbol(sym: string) {
    setRegexInput((prev) => prev + sym);
  }

  // submit and grade regex
  function submit() {
    if (!parsedResult.ok) {
      setSyntaxError(`Correct the regex syntax errors first: ${parsedResult.error}`);
      return;
    }
    setSyntaxError(null);
    setGradeError(null);

    try {
      const playerNfa = thompson(parsedResult.value);
      const refParsed = parseRegex(tierContent.referenceRegex);
      if (!refParsed.ok) {
        setGradeError(`Reference parsing error: ${refParsed.error}`);
        return;
      }
      const refNfa = thompson(refParsed.value);

      // Determinize and check equivalence
      const playerDfa = subsetConstruction(playerNfa).dfa;
      const refDfa = subsetConstruction(refNfa).dfa;

      const equivalent = areEquivalent(playerDfa, refDfa);

      if (equivalent) {
        playSfx('reward');
        if (!completed) {
          completeMission(
            MISSION_ID,
            regexConstructionQuestion.xpReward,
            regexConstructionQuestion.coinsReward,
          );
          setCelebrate(true);
        }
        claimOnce(
          `regex-construct-tier-${tier}`,
          Math.round(tierContent.xpReward * 0.25),
          Math.round(tierContent.coinsReward * 0.25),
        );
        ariaDebrief({
          missionId: MISSION_ID,
          missionTitle: `Pattern Forge: ${tierContent.label}`,
          conceptId: 'regular-expressions',
          correct: true,
          hintsUsed: Math.max(0, revealedTier + 1),
          attempts: failedAttempts + 1,
          // The Thompson NFA preview is always on in this mission, so visualization was
          // genuinely used regardless of hint tier — reported honestly, never assumed false.
          usedVisualization: true,
          timeMs: Date.now() - startedAt.current,
          discoveredOwnMistake: failedAttempts > 0 && revealedTier < VISUALIZATION_HINT_TIER,
          improvedReasoning: false,
        });
      } else {
        playSfx('error');
        const diff = findDistinguishingString(playerDfa, refDfa);
        setCounterexample(diff);
        setFailedAttempts((n) => n + 1);
        say(failedAttempts === 0 ? 'reject' : 'idle');
      }
    } catch (e) {
      setGradeError(e instanceof Error ? e.message : 'An error occurred during grading.');
    }
  }

  return (
    <div className="space-y-5">
      {/* Tier selector */}
      <Panel className="p-5" glow>
        <div className="mb-1 font-display text-[11px] uppercase tracking-[0.3em] text-arc-cyan/80">
          Regex Workshop · Academy Lab
        </div>
        <h1 className="font-display text-2xl font-bold text-glow">Pattern Forge</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-mid">{regexConstructionQuestion.prompt}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {(Object.keys(REGEX_TIERS) as RegexTier[]).map((t) => (
            <button
              key={t}
              onClick={() => switchTier(t)}
              className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                tier === t
                  ? 'border-arc-cyan/50 bg-arc-cyan/10 text-arc-cyan'
                  : 'border-ink-low/20 text-ink-mid hover:border-arc-cyan/30 hover:text-ink-hi'
              }`}
            >
              {REGEX_TIERS[t].label}
            </button>
          ))}
        </div>
        <p className="mt-2 font-mono text-xs text-ink-low">{tierContent.description}</p>
      </Panel>

      {/* Target prompt */}
      <Panel className="border-arc-cyan/25 bg-arc-cyan/5 p-4">
        <h3 className="font-display text-xs uppercase tracking-widest text-arc-cyan font-semibold">
          Target Language Description
        </h3>
        <p className="mt-2 text-sm text-ink-hi font-medium leading-relaxed">{tierContent.prompt}</p>
      </Panel>

      {/* Interactive layout */}
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          {/* Main workspace */}
          <Panel className="p-5 relative" glow>
            <h2 className="mb-3 font-display text-sm uppercase tracking-widest text-ink-mid">
              Expression Sandbox
            </h2>

            <div className="space-y-4">
              {/* Regex Input Field */}
              <div>
                <label className="mb-1.5 block font-display text-xs uppercase tracking-wider text-ink-low">
                  Enter Regular Expression (Alphabet is {'{0, 1}'})
                </label>
                <div className="flex flex-col gap-2">
                  <input
                    value={regexInput}
                    onChange={(e) => setRegexInput(e.target.value)}
                    spellCheck={false}
                    className="w-full rounded-xl border border-ink-low/30 bg-void/60 px-4 py-3 font-mono text-lg text-ink-hi outline-none transition-colors focus:border-arc-cyan/60 focus:shadow-glow-strong"
                  />
                  {/* Symbol insertion toolbar */}
                  <div className="flex flex-wrap gap-1.5">
                    {['(', ')', '|', '*', '+', '?', 'ε'].map((sym) => (
                      <button
                        key={sym}
                        onClick={() => insertSymbol(sym)}
                        className="rounded-lg border border-ink-low/20 bg-void/30 px-3 py-1 font-mono text-sm text-ink-mid transition-colors hover:border-arc-cyan/40 hover:text-arc-cyan"
                      >
                        {sym}
                      </button>
                    ))}
                  </div>
                </div>
                {parsedResult.ok === false && (
                  <p className="mt-2 text-xs text-reject font-mono">
                    ⚠️ Syntax Error: {parsedResult.error}
                  </p>
                )}
                {syntaxError && <p className="mt-2 text-xs text-reject font-mono">{syntaxError}</p>}
                {gradeError && <p className="mt-2 text-xs text-reject font-mono">{gradeError}</p>}
              </div>

              {/* Sandbox tester */}
              <div className="border-t border-ink-low/10 pt-4">
                <label className="mb-1 block font-display text-xs uppercase tracking-wider text-ink-low">
                  Sandbox String Testing
                </label>
                <div className="flex gap-2">
                  <input
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && runTest()}
                    spellCheck={false}
                    placeholder="e.g. 1010"
                    className="w-full rounded-xl border border-ink-low/30 bg-void/40 px-3 py-2 font-mono text-sm text-ink-hi outline-none focus:border-arc-cyan/50"
                  />
                  <HoloButton intent="ghost" onClick={runTest}>
                    Simulate
                  </HoloButton>
                </div>
                <AnimatePresence>
                  {testResult !== null && !syntaxError && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`mt-2 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-mono ${
                        testResult === 'accept'
                          ? 'border-accept/40 bg-accept/10 text-accept'
                          : 'border-reject/40 bg-reject/10 text-reject'
                      }`}
                    >
                      <span>{testResult === 'accept' ? '✓' : '✕'}</span>
                      <span>
                        &quot;{testInput || 'ε'}&quot; is{' '}
                        {testResult === 'accept' ? 'ACCEPTED' : 'REJECTED'} by your expression
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <HoloButton intent="success" className="w-full py-3" onClick={submit}>
                Compile and Submit Solution ▶
              </HoloButton>
            </div>
          </Panel>

          {/* Real-time Compiler Graph Preview */}
          {nfaModel && (
            <Panel className="p-4 relative">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-display text-xs uppercase tracking-widest text-ink-mid">
                  Thompson NFA Compiler Preview
                </h3>
                <span className="font-mono text-[10px] text-ink-low">
                  Auto-updating NFA representation
                </span>
              </div>
              <GraphView model={nfaModel} height={240} fitViewKey={regexInput} />
            </Panel>
          )}
        </div>

        {/* Sidebar for Hints & Counterexamples */}
        <div className="flex flex-col gap-5">
          {/* Hints ladder */}
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
                hints={regexConstructionQuestion.hints}
                failedAttempts={failedAttempts}
                revealedTier={revealedTier}
                onReveal={(t) => setRevealedTier(Math.max(revealedTier, t))}
              />
            )}
          </Panel>

          {/* Counterexamples & Failure explanations */}
          {counterexample !== null && (
            <Panel className="border-reject/30 bg-reject/5 p-5 animate-[pulse-ring_2s_infinite]">
              <div className="flex items-center gap-2 text-reject mb-2 font-display text-xs uppercase tracking-widest font-bold">
                <span>✕</span>
                <span>Language Mismatch Detected</span>
              </div>
              <p className="text-xs text-ink-mid leading-relaxed">
                Your regular expression does not match the target language.
              </p>
              <div className="mt-3 rounded-lg bg-void/50 border border-reject/20 p-3">
                <span className="font-display text-[9px] uppercase tracking-wider text-reject/80">
                  Divergent Counterexample String
                </span>
                <p className="mt-1 font-mono text-sm text-ink-hi">
                  &quot;{counterexample || 'ε'}&quot;
                </p>
                <p className="mt-2 font-mono text-[10px] text-ink-low">
                  The target machine and your compiled machine disagree on whether this sequence
                  should be accepted. Trace this sequence on paper!
                </p>
              </div>
            </Panel>
          )}
        </div>
      </div>

      {/* Completion Modal */}
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
                Pattern Forged Successfully!
              </div>
              <p className="mt-1 text-sm text-ink-mid">
                Your regular expression is mathematically equivalent to the target language rules!
                <br />+{regexConstructionQuestion.xpReward} XP &nbsp;·&nbsp;{' '}
                <span className="text-arc-gold">+{regexConstructionQuestion.coinsReward} ◈</span>
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
