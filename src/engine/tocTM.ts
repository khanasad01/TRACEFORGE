export type TMMove = 'L' | 'R' | 'S';

export interface TMTransition {
  id: string;
  state: string;
  readSymbol: string;
  writeSymbol: string;
  move: TMMove;
  nextState: string;
}

export interface TMDefinition {
  id: string;
  name: string;
  description: string;
  states: string[];
  inputAlphabet: string[];
  tapeAlphabet: string[];
  blankSymbol: string;
  startState: string;
  haltStates: string[];
  transitions: TMTransition[];
}

export interface TMStepTrace {
  step: number;
  transitionId: string;
  stateBefore: string;
  headBefore: number;
  readSymbol: string;
  writeSymbol: string;
  move: TMMove;
  stateAfter: string;
  headAfter: number;
  tapeStart: number;
  tapeSnapshot: string[];
}

export interface TMSimulationResult {
  status: 'halted' | 'stuck' | 'step_limit' | 'invalid_input';
  input: string;
  output: string;
  finalState: string;
  headPosition: number;
  trace: TMStepTrace[];
  error?: string;
}

export const UNARY_INCREMENT_TM: TMDefinition = {
  id: 'toc.tm.unary-increment',
  name: 'Unary Increment',
  description: 'Scans right across unary 1s, writes one additional 1 on the first blank, and halts.',
  states: ['scan', 'halt'],
  inputAlphabet: ['1'],
  tapeAlphabet: ['1', '_'],
  blankSymbol: '_',
  startState: 'scan',
  haltStates: ['halt'],
  transitions: [
    { id: 'scan-right-over-one', state: 'scan', readSymbol: '1', writeSymbol: '1', move: 'R', nextState: 'scan' },
    { id: 'write-increment-and-halt', state: 'scan', readSymbol: '_', writeSymbol: '1', move: 'S', nextState: 'halt' },
  ],
};

function readTape(tape: Map<number, string>, position: number, blank: string): string {
  return tape.get(position) ?? blank;
}

function tapeSnapshot(
  tape: Map<number, string>,
  start: number,
  end: number,
  blank: string,
): string[] {
  const snapshot: string[] = [];
  for (let position = start; position <= end; position++) {
    snapshot.push(readTape(tape, position, blank));
  }
  return snapshot;
}

/**
 * Executes a deterministic single-tape Turing machine with a bounded trace.
 * The returned output is the contiguous nonblank tape contents beginning at cell 0.
 */
export function runTuringMachine(
  machine: TMDefinition,
  input: string,
  maxSteps = 500,
): TMSimulationResult {
  const invalidSymbol = Array.from(input).find((symbol) => !machine.inputAlphabet.includes(symbol));
  const initialResult = {
    input,
    output: '',
    finalState: machine.startState,
    headPosition: 0,
    trace: [] as TMStepTrace[],
  };
  if (invalidSymbol !== undefined) {
    return {
      ...initialResult,
      status: 'invalid_input',
      error: `Input symbol '${invalidSymbol}' is not in the input alphabet {${machine.inputAlphabet.join(', ')}}.`,
    };
  }
  if (input.length > 500) {
    return {
      ...initialResult,
      status: 'step_limit',
      error: 'Input is too long (maximum 500 symbols).',
    };
  }

  const tape = new Map<number, string>();
  Array.from(input).forEach((symbol, index) => tape.set(index, symbol));
  let headPosition = 0;
  let state = machine.startState;
  let minPosition = 0;
  let maxPosition = Math.max(0, input.length - 1);
  const haltStates = new Set(machine.haltStates);
  const trace: TMStepTrace[] = [];

  while (!haltStates.has(state) && trace.length < maxSteps) {
    const readSymbol = readTape(tape, headPosition, machine.blankSymbol);
    const transition = machine.transitions.find(
      (candidate) => candidate.state === state && candidate.readSymbol === readSymbol,
    );
    if (!transition) {
      return {
        status: 'stuck',
        input,
        output: tapeSnapshot(tape, 0, Math.max(0, maxPosition), machine.blankSymbol)
          .join('')
          .split(machine.blankSymbol)[0],
        finalState: state,
        headPosition,
        trace,
        error: `No transition is defined for state '${state}' reading '${readSymbol}'.`,
      };
    }

    const stateBefore = state;
    const headBefore = headPosition;
    tape.set(headPosition, transition.writeSymbol);
    if (transition.move === 'L') headPosition--;
    else if (transition.move === 'R') headPosition++;
    state = transition.nextState;
    minPosition = Math.min(minPosition, headPosition);
    maxPosition = Math.max(maxPosition, headPosition);

    trace.push({
      step: trace.length + 1,
      transitionId: transition.id,
      stateBefore,
      headBefore,
      readSymbol,
      writeSymbol: transition.writeSymbol,
      move: transition.move,
      stateAfter: state,
      headAfter: headPosition,
      tapeStart: minPosition,
      tapeSnapshot: tapeSnapshot(tape, minPosition, maxPosition, machine.blankSymbol),
    });
  }

  const status = haltStates.has(state) ? 'halted' : 'step_limit';
  const output = tapeSnapshot(tape, 0, Math.max(0, maxPosition), machine.blankSymbol)
    .join('')
    .split(machine.blankSymbol)[0];
  return {
    status,
    input,
    output,
    finalState: state,
    headPosition,
    trace,
    error: status === 'step_limit' ? `Step limit reached (${maxSteps}).` : undefined,
  };
}
