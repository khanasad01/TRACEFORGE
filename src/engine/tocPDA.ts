export interface PDATransition {
  id: string;
  fromState: string;
  /** Null consumes no input. */
  inputSymbol: string | null;
  stackTop: string;
  toState: string;
  /** Symbols are pushed left-to-right, with the final symbol becoming stack top. */
  pushSymbols: string[];
}

export interface PDADefinition {
  id: string;
  name: string;
  description: string;
  states: string[];
  inputAlphabet: string[];
  stackAlphabet: string[];
  startState: string;
  startStackSymbol: string;
  acceptStates: string[];
  transitions: PDATransition[];
}

export interface PDATraceStep {
  step: number;
  kind: 'transition-check' | 'dead-end' | 'accept';
  transitionId?: string;
  state: string;
  inputIndex: number;
  inputSymbol: string | null;
  stackBefore: string[];
  enabled?: boolean;
  nextState?: string;
  nextInputIndex?: number;
  stackAfter?: string[];
  alreadyVisited?: boolean;
}

export interface PDASimulationResult {
  status: 'accepted' | 'rejected' | 'limit';
  accepted: boolean;
  input: string;
  trace: PDATraceStep[];
  error?: string;
}

interface Configuration {
  state: string;
  inputIndex: number;
  stack: string[];
}

export const ANBN_PDA: PDADefinition = {
  id: 'toc.pda.anbn',
  name: 'Equal a-prefix and b-suffix (aⁿbⁿ)',
  description: 'Nondeterministic stack automaton accepts aⁿbⁿ for n ≥ 1.',
  states: ['push-a', 'pop-a', 'accept'],
  inputAlphabet: ['a', 'b'],
  stackAlphabet: ['$', 'A'],
  startState: 'push-a',
  startStackSymbol: '$',
  acceptStates: ['accept'],
  transitions: [
    { id: 'push-first-a', fromState: 'push-a', inputSymbol: 'a', stackTop: '$', toState: 'push-a', pushSymbols: ['$', 'A'] },
    { id: 'push-next-a', fromState: 'push-a', inputSymbol: 'a', stackTop: 'A', toState: 'push-a', pushSymbols: ['A', 'A'] },
    { id: 'begin-popping', fromState: 'push-a', inputSymbol: 'b', stackTop: 'A', toState: 'pop-a', pushSymbols: [] },
    { id: 'pop-matching-a', fromState: 'pop-a', inputSymbol: 'b', stackTop: 'A', toState: 'pop-a', pushSymbols: [] },
    { id: 'accept-empty-stack', fromState: 'pop-a', inputSymbol: null, stackTop: '$', toState: 'accept', pushSymbols: ['$'] },
  ],
};

function configurationKey(configuration: Configuration): string {
  return JSON.stringify([
    configuration.state,
    configuration.inputIndex,
    configuration.stack,
  ]);
}

/**
 * Simulates a nondeterministic PDA by breadth-first search over configurations.
 * Acceptance is by a designated final state after consuming all input.
 */
export function simulatePDA(
  pda: PDADefinition,
  input: string,
  maxConfigurations = 10000,
): PDASimulationResult {
  if (input.length > 200) {
    return {
      status: 'limit',
      accepted: false,
      input,
      trace: [],
      error: 'Input is too long (maximum 200 symbols).',
    };
  }
  const invalidSymbol = Array.from(input).find((symbol) => !pda.inputAlphabet.includes(symbol));
  if (invalidSymbol !== undefined) {
    return {
      status: 'rejected',
      accepted: false,
      input,
      trace: [],
      error: `Input symbol '${invalidSymbol}' is not in alphabet {${pda.inputAlphabet.join(', ')}}.`,
    };
  }

  const queue: Configuration[] = [{
    state: pda.startState,
    inputIndex: 0,
    stack: [pda.startStackSymbol],
  }];
  const seen = new Set([configurationKey(queue[0])]);
  const acceptStates = new Set(pda.acceptStates);
  const trace: PDATraceStep[] = [];
  let cursor = 0;

  while (cursor < queue.length) {
    if (seen.size > maxConfigurations) {
      return {
        status: 'limit',
        accepted: false,
        input,
        trace,
        error: `Configuration limit reached (${maxConfigurations}).`,
      };
    }

    const configuration = queue[cursor++];
    if (configuration.inputIndex === input.length && acceptStates.has(configuration.state)) {
      trace.push({
        step: trace.length + 1,
        kind: 'accept',
        state: configuration.state,
        inputIndex: configuration.inputIndex,
        inputSymbol: null,
        stackBefore: [...configuration.stack],
      });
      return { status: 'accepted', accepted: true, input, trace };
    }

    const transitions = pda.transitions.filter(
      (transition) => transition.fromState === configuration.state,
    );
    let enabledCount = 0;
    for (const transition of transitions) {
      const inputSymbol = input[configuration.inputIndex] ?? null;
      const inputMatches = transition.inputSymbol === null
        || transition.inputSymbol === inputSymbol;
      const stackTop = configuration.stack[configuration.stack.length - 1];
      const enabled = inputMatches && stackTop === transition.stackTop;
      let nextConfiguration: Configuration | undefined;
      let alreadyVisited = false;

      if (enabled) {
        const nextStack = configuration.stack.slice(0, -1).concat(transition.pushSymbols);
        nextConfiguration = {
          state: transition.toState,
          inputIndex: configuration.inputIndex + (transition.inputSymbol === null ? 0 : 1),
          stack: nextStack,
        };
        const key = configurationKey(nextConfiguration);
        alreadyVisited = seen.has(key);
        if (!alreadyVisited) {
          seen.add(key);
          queue.push(nextConfiguration);
        }
        enabledCount++;
      }

      trace.push({
        step: trace.length + 1,
        kind: 'transition-check',
        transitionId: transition.id,
        state: configuration.state,
        inputIndex: configuration.inputIndex,
        inputSymbol,
        stackBefore: [...configuration.stack],
        enabled,
        nextState: nextConfiguration?.state,
        nextInputIndex: nextConfiguration?.inputIndex,
        stackAfter: nextConfiguration ? [...nextConfiguration.stack] : undefined,
        alreadyVisited: enabled ? alreadyVisited : undefined,
      });
    }

    if (transitions.length === 0 || enabledCount === 0) {
      trace.push({
        step: trace.length + 1,
        kind: 'dead-end',
        state: configuration.state,
        inputIndex: configuration.inputIndex,
        inputSymbol: input[configuration.inputIndex] ?? null,
        stackBefore: [...configuration.stack],
      });
    }
  }

  return { status: 'rejected', accepted: false, input, trace };
}
