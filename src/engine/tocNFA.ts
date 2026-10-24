export interface NFATransition {
  fromState: string;
  /** Null denotes an epsilon transition. */
  symbol: string | null;
  toState: string;
}

export interface NFADefinition {
  id: string;
  name: string;
  description: string;
  states: string[];
  alphabet: string[];
  startState: string;
  acceptStates: string[];
  transitions: NFATransition[];
}

export interface NFAStepTrace {
  step: number;
  symbol: string;
  activeStatesBefore: string[];
  movedStates: string[];
  activeStatesAfter: string[];
  acceptedSoFar: boolean;
}

export interface NFASimulationResult {
  accepted: boolean;
  inputString: string;
  initialStates: string[];
  finalStates: string[];
  trace: NFAStepTrace[];
  error?: string;
}

type RegexNode =
  | { type: 'literal'; symbol: string }
  | { type: 'epsilon' }
  | { type: 'concat'; children: RegexNode[] }
  | { type: 'union'; left: RegexNode; right: RegexNode }
  | { type: 'star'; child: RegexNode };

class RegexParser {
  private position = 0;

  constructor(private readonly source: string) {
    if (source.length === 0) {
      throw new Error('Regular expression cannot be empty; use ε for the empty string.');
    }
    if (source.length > 256) {
      throw new Error('Regular expression is too long (maximum 256 characters).');
    }
  }

  parse(): RegexNode {
    const expression = this.parseUnion();
    if (this.position !== this.source.length) {
      throw new Error(`Unexpected '${this.source[this.position]}' at position ${this.position}.`);
    }
    return expression;
  }

  private parseUnion(): RegexNode {
    let node = this.parseConcatenation();
    while (this.peek() === '|') {
      this.position++;
      if (this.peek() === '|' || this.peek() === ')' || this.peek() === undefined) {
        throw new Error(`Expected an expression after '|' at position ${this.position}.`);
      }
      node = { type: 'union', left: node, right: this.parseConcatenation() };
    }
    return node;
  }

  private parseConcatenation(): RegexNode {
    const children: RegexNode[] = [];
    while (this.peek() !== undefined && this.peek() !== ')' && this.peek() !== '|') {
      children.push(this.parseRepetition());
    }
    if (children.length === 0) {
      throw new Error(`Expected a symbol or '(' at position ${this.position}.`);
    }
    return children.length === 1 ? children[0] : { type: 'concat', children };
  }

  private parseRepetition(): RegexNode {
    let node = this.parseAtom();
    while (this.peek() === '*') {
      this.position++;
      node = { type: 'star', child: node };
    }
    return node;
  }

  private parseAtom(): RegexNode {
    const symbol = this.peek();
    if (symbol === undefined) {
      throw new Error('Expected a symbol or parenthesized expression.');
    }

    if (symbol === '(') {
      this.position++;
      if (this.peek() === ')') {
        throw new Error(`Empty group at position ${this.position - 1}; use ε for the empty string.`);
      }
      const expression = this.parseUnion();
      if (this.peek() !== ')') {
        throw new Error(`Unclosed group starting before position ${this.position}.`);
      }
      this.position++;
      return expression;
    }

    if (symbol === '*' || symbol === ')' || symbol === '|') {
      throw new Error(`Unexpected '${symbol}' at position ${this.position}.`);
    }
    if (/\s/.test(symbol)) {
      throw new Error(`Whitespace is not allowed in the regular expression (position ${this.position}).`);
    }

    this.position++;
    return symbol === 'ε'
      ? { type: 'epsilon' }
      : { type: 'literal', symbol };
  }

  private peek(): string | undefined {
    return this.source[this.position];
  }
}

interface Fragment {
  startState: string;
  acceptState: string;
}

/**
 * Compiles a regular expression subset to an epsilon-NFA using Thompson
 * construction. Supported syntax: one-character literals, implicit
 * concatenation, union (|), Kleene star (*), parentheses, and ε.
 * There are no escape sequences, character classes, or +/? quantifiers.
 */
export function compileRegularExpression(expression: string): NFADefinition {
  const syntaxTree = new RegexParser(expression).parse();
  const states: string[] = [];
  const transitions: NFATransition[] = [];
  const alphabet = new Set<string>();
  let nextState = 0;

  const createState = (): string => {
    const state = `q${nextState++}`;
    states.push(state);
    return state;
  };

  const addEpsilon = (fromState: string, toState: string) => {
    transitions.push({ fromState, symbol: null, toState });
  };

  const build = (node: RegexNode): Fragment => {
    if (node.type === 'literal') {
      const startState = createState();
      const acceptState = createState();
      alphabet.add(node.symbol);
      transitions.push({ fromState: startState, symbol: node.symbol, toState: acceptState });
      return { startState, acceptState };
    }

    if (node.type === 'epsilon') {
      const startState = createState();
      const acceptState = createState();
      addEpsilon(startState, acceptState);
      return { startState, acceptState };
    }

    if (node.type === 'concat') {
      const fragments = node.children.map(build);
      for (let index = 0; index < fragments.length - 1; index++) {
        addEpsilon(fragments[index].acceptState, fragments[index + 1].startState);
      }
      return {
        startState: fragments[0].startState,
        acceptState: fragments[fragments.length - 1].acceptState,
      };
    }

    if (node.type === 'union') {
      const startState = createState();
      const acceptState = createState();
      const left = build(node.left);
      const right = build(node.right);
      addEpsilon(startState, left.startState);
      addEpsilon(startState, right.startState);
      addEpsilon(left.acceptState, acceptState);
      addEpsilon(right.acceptState, acceptState);
      return { startState, acceptState };
    }

    const startState = createState();
    const acceptState = createState();
    const child = build(node.child);
    addEpsilon(startState, child.startState);
    addEpsilon(startState, acceptState);
    addEpsilon(child.acceptState, child.startState);
    addEpsilon(child.acceptState, acceptState);
    return { startState, acceptState };
  };

  const fragment = build(syntaxTree);
  return {
    id: 'toc.nfa.regex',
    name: `Regex: ${expression}`,
    description: 'Thompson epsilon-NFA compiled from the supported regular-expression subset.',
    states,
    alphabet: [...alphabet],
    startState: fragment.startState,
    acceptStates: [fragment.acceptState],
    transitions,
  };
}

function epsilonClosure(nfa: NFADefinition, seedStates: Iterable<string>): Set<string> {
  const closure = new Set(seedStates);
  const pending = [...closure];

  while (pending.length > 0) {
    const state = pending.pop()!;
    for (const transition of nfa.transitions) {
      if (
        transition.fromState === state &&
        transition.symbol === null &&
        !closure.has(transition.toState)
      ) {
        closure.add(transition.toState);
        pending.push(transition.toState);
      }
    }
  }
  return closure;
}

/** Simulates an NFA over one-character input symbols and records each subset transition. */
export function simulateNFA(nfa: NFADefinition, input: string): NFASimulationResult {
  const acceptStates = new Set(nfa.acceptStates);
  let activeStates = epsilonClosure(nfa, [nfa.startState]);
  const initialStates = [...activeStates];
  const trace: NFAStepTrace[] = [];

  if (input.length > 5000) {
    return {
      accepted: false,
      inputString: input,
      initialStates,
      finalStates: [...activeStates],
      trace,
      error: 'Input is too long (maximum 5000 symbols).',
    };
  }

  for (let index = 0; index < input.length; index++) {
    const symbol = input[index];
    if (!nfa.alphabet.includes(symbol)) {
      return {
        accepted: false,
        inputString: input,
        initialStates,
        finalStates: [...activeStates],
        trace,
        error: `Symbol '${symbol}' at index ${index} is not in alphabet {${nfa.alphabet.join(', ')}}.`,
      };
    }

    const before = [...activeStates];
    const movedStates = new Set<string>();
    for (const state of activeStates) {
      for (const transition of nfa.transitions) {
        if (transition.fromState === state && transition.symbol === symbol) {
          movedStates.add(transition.toState);
        }
      }
    }
    activeStates = epsilonClosure(nfa, movedStates);

    trace.push({
      step: index + 1,
      symbol,
      activeStatesBefore: before,
      movedStates: [...movedStates],
      activeStatesAfter: [...activeStates],
      acceptedSoFar: [...activeStates].some((state) => acceptStates.has(state)),
    });
  }

  return {
    accepted: [...activeStates].some((state) => acceptStates.has(state)),
    inputString: input,
    initialStates,
    finalStates: [...activeStates],
    trace,
  };
}
