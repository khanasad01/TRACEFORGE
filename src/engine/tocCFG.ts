export interface CFGProduction {
  lhs: string;
  rhs: string[];
}

export interface CFGDefinition {
  id: string;
  name: string;
  description: string;
  startSymbol: string;
  nonTerminals: string[];
  terminals: string[];
  productions: CFGProduction[];
}

export interface CFGParseTree {
  symbol: string;
  children: CFGParseTree[];
  span: [number, number];
}

export interface CFGTraceStep {
  step: number;
  kind: 'terminal-check' | 'production-check' | 'derive';
  span: [number, number];
  split?: number;
  production: CFGProduction;
  matching: boolean;
  addedToChart: boolean;
}

export interface CFGParseResult {
  accepted: boolean;
  input: string;
  tokens: string[];
  parseTree: CFGParseTree | null;
  trace: CFGTraceStep[];
  error?: string;
}

/**
 * Curated CNF grammar for a^n b^n, n >= 1.
 * S -> A X | A B; X -> S B; A -> a; B -> b.
 */
export const ANBN_GRAMMAR: CFGDefinition = {
  id: 'toc.cfg.anbn',
  name: 'Equal a-prefix and b-suffix (aⁿbⁿ)',
  description: 'Recognizes one or more a symbols followed by the same number of b symbols.',
  startSymbol: 'S',
  nonTerminals: ['S', 'X', 'A', 'B'],
  terminals: ['a', 'b'],
  productions: [
    { lhs: 'S', rhs: ['A', 'X'] },
    { lhs: 'S', rhs: ['A', 'B'] },
    { lhs: 'X', rhs: ['S', 'B'] },
    { lhs: 'A', rhs: ['a'] },
    { lhs: 'B', rhs: ['b'] },
  ],
};

function validateGrammar(grammar: CFGDefinition): string | null {
  const nonTerminals = new Set(grammar.nonTerminals);
  const terminals = new Set(grammar.terminals);
  if (!nonTerminals.has(grammar.startSymbol)) {
    return `Start symbol '${grammar.startSymbol}' is not a declared nonterminal.`;
  }
  if (grammar.terminals.some((terminal) => terminal.length !== 1)) {
    return 'This parser accepts grammars with single-character terminals only.';
  }
  if (grammar.nonTerminals.some((symbol) => terminals.has(symbol))) {
    return 'A symbol cannot be both a terminal and a nonterminal.';
  }
  for (const production of grammar.productions) {
    if (!nonTerminals.has(production.lhs)) {
      return `Production left side '${production.lhs}' is not a declared nonterminal.`;
    }
    const validTerminalProduction =
      production.rhs.length === 1 && terminals.has(production.rhs[0]);
    const validBinaryProduction =
      production.rhs.length === 2 &&
      production.rhs.every((symbol) => nonTerminals.has(symbol));
    if (!validTerminalProduction && !validBinaryProduction) {
      return `Production ${production.lhs} → ${production.rhs.join(' ')} is not in Chomsky Normal Form.`;
    }
  }
  return null;
}

/**
 * CYK parser for Chomsky Normal Form grammars with one-character terminals.
 * Input is capped at 30 symbols to keep the educational chart and trace bounded.
 */
export function parseCFG(grammar: CFGDefinition, input: string): CFGParseResult {
  const grammarError = validateGrammar(grammar);
  const tokens = Array.from(input);
  const trace: CFGTraceStep[] = [];
  if (grammarError) {
    return { accepted: false, input, tokens, parseTree: null, trace, error: grammarError };
  }
  if (tokens.length > 30) {
    return {
      accepted: false,
      input,
      tokens,
      parseTree: null,
      trace,
      error: 'Input is too long (maximum 30 terminal symbols).',
    };
  }
  const invalidToken = tokens.find((token) => !grammar.terminals.includes(token));
  if (invalidToken !== undefined) {
    return {
      accepted: false,
      input,
      tokens,
      parseTree: null,
      trace,
      error: `Input symbol '${invalidToken}' is not in the grammar terminal set {${grammar.terminals.join(', ')}}.`,
    };
  }

  const chart: Map<string, CFGParseTree>[][] = Array.from(
    { length: tokens.length },
    () => Array.from({ length: tokens.length + 1 }, () => new Map()),
  );
  let step = 0;

  for (let index = 0; index < tokens.length; index++) {
    for (const production of grammar.productions) {
      if (production.rhs.length !== 1) continue;
      const matching = production.rhs[0] === tokens[index];
      const cell = chart[index][index + 1];
      const addedToChart = matching && !cell.has(production.lhs);
      if (addedToChart) {
        cell.set(production.lhs, {
          symbol: production.lhs,
          children: [{ symbol: tokens[index], children: [], span: [index, index + 1] }],
          span: [index, index + 1],
        });
      }
      trace.push({
        step: ++step,
        kind: matching ? 'derive' : 'terminal-check',
        span: [index, index + 1],
        production: { lhs: production.lhs, rhs: [...production.rhs] },
        matching,
        addedToChart,
      });
    }
  }

  for (let length = 2; length <= tokens.length; length++) {
    for (let start = 0; start + length <= tokens.length; start++) {
      const end = start + length;
      const cell = chart[start][end];
      for (let split = start + 1; split < end; split++) {
        for (const production of grammar.productions) {
          if (production.rhs.length !== 2) continue;
          const [leftSymbol, rightSymbol] = production.rhs;
          const matching =
            chart[start][split].has(leftSymbol) &&
            chart[split][end].has(rightSymbol);
          const addedToChart = matching && !cell.has(production.lhs);
          if (addedToChart) {
            cell.set(production.lhs, {
              symbol: production.lhs,
              children: [
                chart[start][split].get(leftSymbol)!,
                chart[split][end].get(rightSymbol)!,
              ],
              span: [start, end],
            });
          }
          trace.push({
            step: ++step,
            kind: addedToChart ? 'derive' : 'production-check',
            span: [start, end],
            split,
            production: { lhs: production.lhs, rhs: [...production.rhs] },
            matching,
            addedToChart,
          });
        }
      }
    }
  }

  const parseTree = tokens.length > 0
    ? chart[0][tokens.length].get(grammar.startSymbol) ?? null
    : null;
  return {
    accepted: parseTree !== null,
    input,
    tokens,
    parseTree,
    trace,
  };
}
