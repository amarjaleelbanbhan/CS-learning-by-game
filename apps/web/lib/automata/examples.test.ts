import { describe, expect, it } from 'vitest';
import { acceptsNFA, subsetConstruction } from '@arc/engine-automata';
import { containsAaView, containsSubstring101View, nfaEndsIn01View } from './examples';

describe('containsSubstring101View', () => {
  it('accepts strings that contain "101" as a substring', () => {
    const { nfa } = containsSubstring101View();
    expect(acceptsNFA(nfa, '101')).toBe(true);
    expect(acceptsNFA(nfa, '0101')).toBe(true);
    expect(acceptsNFA(nfa, '1101')).toBe(true);
    expect(acceptsNFA(nfa, '11010')).toBe(true);
    expect(acceptsNFA(nfa, '00101011')).toBe(true);
  });

  it('rejects strings that never contain "101"', () => {
    const { nfa } = containsSubstring101View();
    expect(acceptsNFA(nfa, '')).toBe(false);
    expect(acceptsNFA(nfa, '0')).toBe(false);
    expect(acceptsNFA(nfa, '1')).toBe(false);
    expect(acceptsNFA(nfa, '000')).toBe(false);
    expect(acceptsNFA(nfa, '110011')).toBe(false);
    expect(acceptsNFA(nfa, '01100110')).toBe(false);
  });

  it('produces a meaningfully larger reachable powerset than the easier examples (boss-sized)', () => {
    const bossStates = subsetConstruction(containsSubstring101View().nfa).dfa.states.length;
    const easyStates = subsetConstruction(nfaEndsIn01View().nfa).dfa.states.length;
    const midStates = subsetConstruction(containsAaView().nfa).dfa.states.length;
    expect(bossStates).toBeGreaterThan(easyStates);
    expect(bossStates).toBeGreaterThan(midStates);
  });
});
