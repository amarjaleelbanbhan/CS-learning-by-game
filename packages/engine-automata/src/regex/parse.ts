import { err, ok, type Result } from '@arc/shared';

/**
 * Regular-expression AST.
 * Syntax: `|` union · implicit concatenation · `*` star · `+` plus · `?` optional ·
 * `(` `)` grouping · `ε` empty string · any other character is a literal symbol.
 */
export type Re =
  | { t: 'empty' }
  | { t: 'char'; c: string }
  | { t: 'concat'; a: Re; b: Re }
  | { t: 'alt'; a: Re; b: Re }
  | { t: 'star'; a: Re }
  | { t: 'plus'; a: Re }
  | { t: 'opt'; a: Re };

const POSTFIX = new Set(['*', '+', '?']);
const SPECIAL = new Set(['|', ')', '(', '*', '+', '?']);

/** Recursive-descent parser. Returns a Result so callers handle syntax errors. */
export function parseRegex(src: string): Result<Re, string> {
  const s = src.replace(/\s+/g, '');
  let i = 0;
  const peek = (): string | undefined => s[i];
  const eof = (): boolean => i >= s.length;

  function parseAlt(): Re {
    let left = parseConcat();
    while (peek() === '|') {
      i++;
      left = { t: 'alt', a: left, b: parseConcat() };
    }
    return left;
  }

  function parseConcat(): Re {
    const nodes: Re[] = [];
    while (!eof() && peek() !== '|' && peek() !== ')') {
      nodes.push(parseRep());
    }
    if (nodes.length === 0) return { t: 'empty' };
    return nodes.reduce((a, b) => ({ t: 'concat', a, b }));
  }

  function parseRep(): Re {
    let atom = parseAtom();
    let op = peek();
    while (op !== undefined && POSTFIX.has(op)) {
      i++;
      atom =
        op === '*'
          ? { t: 'star', a: atom }
          : op === '+'
            ? { t: 'plus', a: atom }
            : { t: 'opt', a: atom };
      op = peek();
    }
    return atom;
  }

  function parseAtom(): Re {
    const ch = peek();
    if (ch === '(') {
      i++;
      const inner = parseAlt();
      if (peek() !== ')') throw new Error('Expected ")"');
      i++;
      return inner;
    }
    if (ch === 'ε') {
      i++;
      return { t: 'empty' };
    }
    if (ch === undefined || SPECIAL.has(ch)) {
      throw new Error(`Unexpected token "${ch ?? 'end of input'}"`);
    }
    i++;
    return { t: 'char', c: ch };
  }

  try {
    const re = parseAlt();
    if (!eof()) return err(`Unexpected "${peek()}" at position ${i}`);
    return ok(re);
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Invalid regular expression');
  }
}
