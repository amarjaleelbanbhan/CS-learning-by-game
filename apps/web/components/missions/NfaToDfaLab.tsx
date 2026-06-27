'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '@/components/state/gameStore';
import { useCompanionStore } from '@/components/companion/companionStore';
import { playSfx } from '@/lib/fx/sound';
import { Panel } from '@/components/ui/Panel';
import { HoloButton } from '@/components/ui/HoloButton';
import { GraphView } from '@/components/viz/GraphView';
import { SimulationControls } from '@/components/viz/SimulationControls';
import { usePlayback } from '@/components/viz/usePlayback';
import { displayLabel, nfaToGraphModel, type GraphModel } from '@/components/viz/graph-model';
import { nfaEndsIn01View } from '@/lib/automata/examples';
import { buildSubsetViz } from '@/lib/automata/subset-frames';

const MISSION_ID = 'toa.nfa-to-dfa';

export function NfaToDfaLab() {
  const nfaView = useMemo(nfaEndsIn01View, []);
  const viz = useMemo(() => buildSubsetViz(nfaView.nfa), [nfaView]);
  const pb = usePlayback(viz.trace);
  const frame = pb.frame?.data;

  const nfaModel = useMemo(() => nfaToGraphModel(nfaView.nfa, nfaView.layout), [nfaView]);
  const acceptingLabels = useMemo(() => new Set<string>(viz.dfa.accepting), [viz]);

  const dfaModel: GraphModel = useMemo(() => {
    if (!frame) return { nodes: [], edges: [] };
    return {
      nodes: frame.dfaNodeIds.map((id) => ({
        id,
        label: displayLabel(id),
        x: viz.dfaLayout[id]?.x ?? 0,
        y: viz.dfaLayout[id]?.y ?? 0,
        isStart: id === viz.dfa.start,
        isAccepting: acceptingLabels.has(id),
      })),
      edges: frame.dfaEdges,
    };
  }, [frame, viz, acceptingLabels]);

  const completed = useGameStore((s) => Boolean(s.completed[MISSION_ID]));
  const completeMission = useGameStore((s) => s.completeMission);
  const say = useCompanionStore((s) => s.say);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    if (pb.atEnd && !completed) {
      completeMission(MISSION_ID, 250, 75);
      setCelebrate(true);
      playSfx('reward');
      say('flagship-complete');
    }
  }, [pb.atEnd, completed, completeMission, say]);

  const dfaActiveNodes = frame
    ? [frame.currentDfaNode, ...(frame.resultDfaNode ? [frame.resultDfaNode] : [])]
    : [];

  return (
    <div className="space-y-5">
      <Panel className="p-5" glow>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="mb-1 font-display text-[11px] uppercase tracking-[0.3em] text-arc-cyan/80">
              Flagship Lab
            </div>
            <h1 className="font-display text-2xl font-bold text-glow">NFA → DFA, made visible</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-mid">
              Every DFA state is just a <span className="text-arc-cyan">set</span> of NFA states the
              machine could be in. Step through the subset construction and watch each set become a
              single state — the nondeterminism dissolving in front of you.
            </p>
          </div>
          <div className="rounded-xl border border-arc-cyan/20 bg-void/50 px-4 py-3 text-center">
            <div className="font-mono text-2xl text-arc-cyan">{viz.dfa.states.length}</div>
            <div className="text-[10px] uppercase tracking-wider text-ink-low">DFA states</div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm uppercase tracking-widest text-ink-mid">
              Source NFA
            </h2>
            <span className="font-mono text-xs text-ink-low">nondeterministic</span>
          </div>
          <GraphView model={nfaModel} activeNodes={frame?.activeSubset ?? []} height={320} />
          <p className="mt-3 font-mono text-xs text-ink-low">
            Highlighted = the subset{' '}
            <span className="text-arc-cyan">
              {frame ? `{${frame.activeSubset.join(', ')}}` : ''}
            </span>{' '}
            currently being expanded.
          </p>
        </Panel>

        <Panel className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm uppercase tracking-widest text-ink-mid">
              Constructed DFA
            </h2>
            <span className="font-mono text-xs text-ink-low">deterministic</span>
          </div>
          <GraphView
            model={dfaModel}
            activeNodes={dfaActiveNodes}
            activeEdgeKey={frame?.activeDfaEdgeKey ?? null}
            height={320}
            fitViewKey={frame?.dfaNodeIds.length ?? 0}
          />
          <p className="mt-3 font-mono text-xs text-ink-low">
            Each node is a set of NFA states. Accepting iff it contains an NFA accepting state.
          </p>
        </Panel>
      </div>

      <Panel className="p-4">
        <div className="mb-3 flex min-h-[1.5rem] items-center gap-2">
          <span className="rounded-md border border-arc-cyan/30 bg-arc-cyan/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-arc-cyan">
            Step {pb.index + 1}
          </span>
          <span className="font-mono text-sm text-ink-hi">{pb.frame?.label}</span>
        </div>
        <SimulationControls pb={pb} />
      </Panel>

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
                Subset Construction Mastered
              </div>
              <p className="mt-1 text-sm text-ink-mid">
                You turned a nondeterministic machine into a deterministic one.
                <br />
                +250 XP &nbsp;·&nbsp; <span className="text-arc-gold">+75 ◈</span>
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
