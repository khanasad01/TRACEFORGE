import { describe, expect, it } from 'vitest';
import { ANBN_GRAMMAR, parseCFG, type CFGDefinition } from '../../engine/tocCFG';

describe('parseCFG — CYK parser', () => {
  it.each(['ab', 'aabb', 'aaabbb', 'aaaaabbbbb'])('accepts %s in the a^n b^n language', (input) => {
    const result = parseCFG(ANBN_GRAMMAR, input);
    expect(result.accepted).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.parseTree?.symbol).toBe(ANBN_GRAMMAR.startSymbol);
    expect(result.parseTree?.span).toEqual([0, input.length]);
  });

  it.each(['', 'a', 'abb', 'aabbb', 'ba', 'aba'])('rejects %s from the a^n b^n language', (input) => {
    expect(parseCFG(ANBN_GRAMMAR, input).accepted).toBe(false);
  });

  it('records actual terminal and production checks and derivations', () => {
    const result = parseCFG(ANBN_GRAMMAR, 'aabb');
    expect(result.accepted).toBe(true);
    expect(result.trace.length).toBeGreaterThan(0);
    expect(result.trace.map((step) => step.step)).toEqual(
      result.trace.map((_, index) => index + 1),
    );
    expect(result.trace.some((step) => step.kind === 'terminal-check')).toBe(true);
    expect(result.trace.some((step) => step.kind === 'derive' && step.addedToChart)).toBe(true);
    expect(result.trace.every((step) => step.production.rhs.length === 1 || step.split !== undefined)).toBe(true);
  });

  it('produces a tree whose terminal leaves reconstruct the input', () => {
    const result = parseCFG(ANBN_GRAMMAR, 'aaabbb');
    const leaves: string[] = [];
    const visit = (node: NonNullable<typeof result.parseTree>) => {
      if (node.children.length === 0) {
        leaves.push(node.symbol);
      } else {
        node.children.forEach(visit);
      }
    };
    if (result.parseTree) visit(result.parseTree);
    expect(leaves.join('')).toBe('aaabbb');
  });

  it('reports input symbols outside the grammar alphabet', () => {
    const result = parseCFG(ANBN_GRAMMAR, 'a1b');
    expect(result.accepted).toBe(false);
    expect(result.error).toContain("Input symbol '1'");
    expect(result.trace).toEqual([]);
  });

  it('rejects grammars not in the documented CNF subset', () => {
    const invalidGrammar: CFGDefinition = {
      ...ANBN_GRAMMAR,
      productions: [{ lhs: 'S', rhs: ['A', 'X', 'B'] }],
    };
    expect(parseCFG(invalidGrammar, 'ab').error).toContain('not in Chomsky Normal Form');
  });

  it('bounds input length before chart allocation', () => {
    const result = parseCFG(ANBN_GRAMMAR, 'a'.repeat(31));
    expect(result.accepted).toBe(false);
    expect(result.error).toContain('maximum 30');
    expect(result.trace).toEqual([]);
  });
});
