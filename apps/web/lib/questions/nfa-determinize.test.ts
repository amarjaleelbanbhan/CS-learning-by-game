import { describe, expect, it } from 'vitest';
import { HINT_KIND_ORDER, analyzeSubsetConstruction } from '@arc/engine-assessment';
import { acceptsNFA, subsetConstruction } from '@arc/engine-automata';
import { NFA_TIERS, nfaDeterminizeQuestion } from './nfa-determinize';

describe('nfaDeterminizeQuestion content', () => {
  it('has exactly one hint per HINT_KIND_ORDER tier, in the same order', () => {
    expect(nfaDeterminizeQuestion.hints).toHaveLength(HINT_KIND_ORDER.length);
    nfaDeterminizeQuestion.hints.forEach((hint, i) => {
      expect(hint.kind).toBe(HINT_KIND_ORDER[i]);
    });
  });

  it('every hint has non-empty guidance text', () => {
    for (const hint of nfaDeterminizeQuestion.hints) {
      expect(hint.text?.trim().length ?? 0).toBeGreaterThan(0);
    }
  });

  it('never reveals the literal answer in any hint', () => {
    for (const hint of nfaDeterminizeQuestion.hints) {
      expect(hint.text?.toLowerCase() ?? '').not.toContain('the answer is');
    }
  });
});

describe('NFA_TIERS content', () => {
  it('every tier resolves to a real, well-formed NFA view', () => {
    for (const tierId of ['easy', 'hard', 'boss'] as const) {
      const view = NFA_TIERS[tierId].view();
      expect(view.nfa.states.length).toBeGreaterThan(0);
      expect(view.nfa.alphabet.length).toBeGreaterThan(0);
      // subsetConstruction must not throw for any tier's NFA.
      expect(() => subsetConstruction(view.nfa)).not.toThrow();
    }
  });

  it('difficulty actually scales: boss has a larger reachable powerset than easy', () => {
    const easyStates = subsetConstruction(NFA_TIERS.easy.view().nfa).dfa.states.length;
    const bossStates = subsetConstruction(NFA_TIERS.boss.view().nfa).dfa.states.length;
    expect(bossStates).toBeGreaterThan(easyStates);
  });

  it('every tier rewards more XP/EC than the one before it (easy < hard < boss)', () => {
    expect(NFA_TIERS.hard.xpReward).toBeGreaterThan(NFA_TIERS.easy.xpReward);
    expect(NFA_TIERS.boss.xpReward).toBeGreaterThan(NFA_TIERS.hard.xpReward);
    expect(NFA_TIERS.hard.coinsReward).toBeGreaterThan(NFA_TIERS.easy.coinsReward);
    expect(NFA_TIERS.boss.coinsReward).toBeGreaterThan(NFA_TIERS.hard.coinsReward);
  });

  it("the analysis engine correctly solves each tier's own subset-construction reference", () => {
    // Sanity check: feeding the reference DFA itself back into the analysis engine for
    // every tier must report a correct, mistake-free result (the analysis engine and the
    // tier content agree with each other).
    for (const tierId of ['easy', 'hard', 'boss'] as const) {
      const nfa = NFA_TIERS[tierId].view().nfa;
      const reference = subsetConstruction(nfa).dfa;
      const result = analyzeSubsetConstruction(reference, nfa);
      expect(result.correct, tierId).toBe(true);
      expect(result.mistakes, tierId).toEqual([]);
    }
  });

  it('every tier NFA accepts at least one known string (not a trivially-empty language)', () => {
    const knownAccepted: Record<'easy' | 'hard' | 'boss', string> = {
      easy: '01',
      hard: 'aa',
      boss: '101',
    };
    for (const tierId of ['easy', 'hard', 'boss'] as const) {
      const { nfa } = NFA_TIERS[tierId].view();
      expect(acceptsNFA(nfa, knownAccepted[tierId]), tierId).toBe(true);
    }
  });
});
