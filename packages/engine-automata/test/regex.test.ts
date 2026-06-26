import { describe, expect, it } from 'vitest';
import { acceptsNFA, enumerateStrings, parseRegex, regexToNfa } from '../src/index.js';

/** Translate our regex syntax to an anchored JS RegExp oracle (ε -> empty). */
function jsOracle(src: string): RegExp {
  return new RegExp(`^(?:${src.replace(/ε/g, '')})$`);
}

const CASES = [
  '(a|b)*abb',
  'a*',
  'a+',
  'a?b',
  '(ab)+',
  '(a|b)(a|b)',
  '0*1(0|1)*',
  'a(b|c)*d',
  '(0|1|2)*00',
  'ε',
  '(a|ε)b',
];

describe('regexToNfa (Thompson construction)', () => {
  it.each(CASES)('"%s" matches its JS RegExp oracle over all short strings', (src) => {
    const result = regexToNfa(src);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const nfa = result.value;
    const alphabet = nfa.alphabet.length > 0 ? nfa.alphabet : ['a'];
    const oracle = jsOracle(src);
    for (const w of enumerateStrings(alphabet, 5)) {
      expect(acceptsNFA(nfa, w)).toBe(oracle.test(w));
    }
  });
});

describe('parseRegex', () => {
  it('reports syntax errors instead of throwing', () => {
    expect(parseRegex('(a|b').ok).toBe(false);
    expect(parseRegex('*a').ok).toBe(false);
    expect(parseRegex('a)').ok).toBe(false);
    expect(parseRegex('a|b').ok).toBe(true);
  });
});
