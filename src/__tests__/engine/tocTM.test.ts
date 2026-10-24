import { describe, expect, it } from 'vitest';
import {
  runTuringMachine,
  UNARY_INCREMENT_TM,
  type TMDefinition,
} from '../../engine/tocTM';

describe('runTuringMachine', () => {
  it.each([
    ['1', '11'],
    ['111', '1111'],
    ['', '1'],
  ])('increments unary input %s to %s', (input, output) => {
    const result = runTuringMachine(UNARY_INCREMENT_TM, input);

    expect(result.status).toBe('halted');
    expect(result.output).toBe(output);
    expect(result.finalState).toBe('halt');
    expect(result.trace.length).toBe(input.length + 1);
  });

  it('records real read/write/move/state and tape evidence for each step', () => {
    const result = runTuringMachine(UNARY_INCREMENT_TM, '11');

    expect(result.trace[0]).toMatchObject({
      step: 1,
      transitionId: 'scan-right-over-one',
      stateBefore: 'scan',
      headBefore: 0,
      readSymbol: '1',
      writeSymbol: '1',
      move: 'R',
      stateAfter: 'scan',
      headAfter: 1,
      tapeSnapshot: ['1', '1'],
    });
    expect(result.trace[result.trace.length - 1]).toMatchObject({
      transitionId: 'write-increment-and-halt',
      readSymbol: '_',
      writeSymbol: '1',
      stateAfter: 'halt',
      tapeSnapshot: ['1', '1', '1'],
    });
  });

  it('rejects symbols outside the input alphabet', () => {
    const result = runTuringMachine(UNARY_INCREMENT_TM, '101');
    expect(result.status).toBe('invalid_input');
    expect(result.error).toContain("Input symbol '0'");
  });

  it('reports an undefined transition as stuck', () => {
    const machine: TMDefinition = {
      ...UNARY_INCREMENT_TM,
      transitions: [],
    };
    const result = runTuringMachine(machine, '1');

    expect(result.status).toBe('stuck');
    expect(result.trace).toEqual([]);
    expect(result.error).toContain("No transition is defined for state 'scan'");
  });

  it('terminates with an explicit step-limit status', () => {
    const result = runTuringMachine(UNARY_INCREMENT_TM, '111', 2);

    expect(result.status).toBe('step_limit');
    expect(result.trace).toHaveLength(2);
    expect(result.error).toContain('Step limit reached (2)');
  });
});
