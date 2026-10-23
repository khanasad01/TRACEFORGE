/**
 * TOC — Deterministic Finite Automaton (DFA) Engine.
 *
 * Implements deterministic finite-state machine simulation:
 * - Finite set of states Q
 * - Input alphabet Σ
 * - Transition function δ: Q × Σ → Q
 * - Start state q0
 * - Set of accept states F
 *
 * Generates an educational, step-by-step transition trace for any input string.
 */

export interface DFATransition {
  fromState: string;
  symbol: string;
  toState: string;
}

export interface DFADefinition {
  id: string;
  name: string;
  description: string;
  states: string[];
  alphabet: string[];
  startState: string;
  acceptStates: string[];
  transitions: DFATransition[];
}

export interface DFAStepTrace {
  step: number;
  fromState: string;
  symbol: string;
  toState: string;
  remainingInput: string;
  acceptedSoFar: boolean;
}

export interface DFASimulationResult {
  accepted: boolean;
  finalState: string;
  inputString: string;
  trace: DFAStepTrace[];
  error?: string;
  explanation: string;
}

/**
 * Validates and simulates a DFA on a given input string.
 */
export function simulateDFA(dfa: DFADefinition, input: string): DFASimulationResult {
  // Build lookup table: `${state}:${symbol}` -> nextState
  const transMap = new Map<string, string>();
  for (const t of dfa.transitions) {
    transMap.set(`${t.fromState}:${t.symbol}`, t.toState);
  }

  const acceptSet = new Set(dfa.acceptStates);
  let currentState = dfa.startState;
  const trace: DFAStepTrace[] = [];

  for (let i = 0; i < input.length; i++) {
    const symbol = input[i];

    if (!dfa.alphabet.includes(symbol)) {
      return {
        accepted: false,
        finalState: currentState,
        inputString: input,
        trace,
        error: `Symbol '${symbol}' at index ${i} is not in alphabet {${dfa.alphabet.join(', ')}}`,
        explanation: `Rejected: input contains invalid symbol '${symbol}'.`,
      };
    }

    const key = `${currentState}:${symbol}`;
    const nextState = transMap.get(key);

    if (!nextState) {
      return {
        accepted: false,
        finalState: currentState,
        inputString: input,
        trace,
        error: `Undefined transition from state '${currentState}' with symbol '${symbol}'`,
        explanation: `Rejected: machine reached a trap or undefined transition.`,
      };
    }

    trace.push({
      step: i + 1,
      fromState: currentState,
      symbol,
      toState: nextState,
      remainingInput: input.slice(i + 1),
      acceptedSoFar: acceptSet.has(nextState),
    });

    currentState = nextState;
  }

  // Handle empty input
  if (input.length === 0) {
    const acceptedEmpty = acceptSet.has(currentState);
    return {
      accepted: acceptedEmpty,
      finalState: currentState,
      inputString: input,
      trace: [],
      error: acceptedEmpty ? undefined : 'Empty string was not accepted by the start state.',
      explanation: acceptedEmpty
        ? `Accepted: the empty string leads to the accept state '${currentState}'.`
        : `Rejected: the empty string is not accepted by this DFA (start state '${currentState}' is not an accept state).`,
    };
  }

  const accepted = acceptSet.has(currentState);
  return {
    accepted,
    finalState: currentState,
    inputString: input,
    trace,
    explanation: accepted
      ? `Accepted: input '${input}' ends in accept state '${currentState}'.`
      : `Rejected: input '${input}' ends in non-accept state '${currentState}'.`,
  };
}

/**
 * DFA 1: Binary strings that end with "01".
 *   q0 --0--> q1 --1--> q2 (accept)
 */
export const binaryEndingIn01DFA: DFADefinition = {
  id: 'toc.dfa.binary-ending-in-01',
  name: 'Binary Strings Ending in "01"',
  description: 'Accepts binary strings whose last two bits are "01".',
  states: ['q0', 'q1', 'q2'],
  alphabet: ['0', '1'],
  startState: 'q0',
  acceptStates: ['q2'],
  transitions: [
    { fromState: 'q0', symbol: '0', toState: 'q1' },
    { fromState: 'q0', symbol: '1', toState: 'q0' },
    { fromState: 'q1', symbol: '0', toState: 'q1' },
    { fromState: 'q1', symbol: '1', toState: 'q2' },
    { fromState: 'q2', symbol: '0', toState: 'q1' },
    { fromState: 'q2', symbol: '1', toState: 'q0' },
  ],
};

/**
 * DFA 2: Even number of 1s in the binary input.
 *   q0 (even, start, accept) --0--> q0, --1--> q1
 *   q1 (odd) --0--> q1, --1--> q0
 */
export const evenOnesDFA: DFADefinition = {
  id: 'toc.dfa.even-ones',
  name: 'Even Number of 1s',
  description: 'Accepts binary strings containing an even number of 1s.',
  states: ['q0', 'q1'],
  alphabet: ['0', '1'],
  startState: 'q0',
  acceptStates: ['q0'],
  transitions: [
    { fromState: 'q0', symbol: '0', toState: 'q0' },
    { fromState: 'q0', symbol: '1', toState: 'q1' },
    { fromState: 'q1', symbol: '0', toState: 'q1' },
    { fromState: 'q1', symbol: '1', toState: 'q0' },
  ],
};

/**
 * DFA 3: Binary strings representing numbers divisible by 3.
 * States represent remainder: q0 (rem 0, accept), q1 (rem 1), q2 (rem 2)
 * Reading a bit b from state q_r transitions to q_{(2*r + b) % 3}
 */
export const divisibleBy3DFA: DFADefinition = {
  id: 'toc.dfa.divisible-by-3',
  name: 'Divisible by 3',
  description: 'Accepts binary strings whose value (read MSB first) is divisible by 3.',
  states: ['q0', 'q1', 'q2'],
  alphabet: ['0', '1'],
  startState: 'q0',
  acceptStates: ['q0'],
  transitions: [
    // From q0 (remainder 0): 0 -> q0 (rem 0), 1 -> q1 (rem 1)
    { fromState: 'q0', symbol: '0', toState: 'q0' },
    { fromState: 'q0', symbol: '1', toState: 'q1' },
    // From q1 (remainder 1): 0 -> q2 (rem 2), 1 -> q0 (rem 0)
    { fromState: 'q1', symbol: '0', toState: 'q2' },
    { fromState: 'q1', symbol: '1', toState: 'q0' },
    // From q2 (remainder 2): 0 -> q1 (rem 1), 1 -> q2 (rem 2)
    { fromState: 'q2', symbol: '0', toState: 'q1' },
    { fromState: 'q2', symbol: '1', toState: 'q2' },
  ],
};

/**
 * Registry of all built-in DFAs for the TOC lab.
 */
export const dfaRegistry: DFADefinition[] = [
  binaryEndingIn01DFA,
  evenOnesDFA,
  divisibleBy3DFA,
];
