import { describe, expect, it } from 'vitest';
import { ANBN_PDA, simulatePDA, type PDADefinition } from '../../engine/tocPDA';

describe('simulatePDA', () => {
  it.each(['ab', 'aabb', 'aaabbb'])('accepts %s with matching stack operations', (input) => {
    const result = simulatePDA(ANBN_PDA, input);
    expect(result.status).toBe('accepted');
    expect(result.accepted).toBe(true);
    expect(result.trace[result.trace.length - 1].kind).toBe('accept');
  });

  it.each(['', 'a', 'aabbb', 'abb', 'ba', 'abab'])('rejects %s', (input) => {
    expect(simulatePDA(ANBN_PDA, input).accepted).toBe(false);
  });

  it('trace records enabled transitions and their concrete stack effects', () => {
    const result = simulatePDA(ANBN_PDA, 'ab');
    const pushA = result.trace.find((step) => step.transitionId === 'push-first-a');
    const consumeB = result.trace.find((step) => step.transitionId === 'begin-popping' && step.enabled);

    expect(pushA).toMatchObject({
      kind: 'transition-check',
      enabled: true,
      state: 'push-a',
      inputIndex: 0,
      stackBefore: ['$'],
      nextState: 'push-a',
      nextInputIndex: 1,
      stackAfter: ['$', 'A'],
    });
    expect(consumeB).toMatchObject({
      enabled: true,
      inputIndex: 1,
      stackBefore: ['$', 'A'],
      nextState: 'pop-a',
      stackAfter: ['$'],
    });
  });

  it('reports invalid symbols and bounds input size', () => {
    expect(simulatePDA(ANBN_PDA, 'a1b').error).toContain("Input symbol '1'");
    expect(simulatePDA(ANBN_PDA, 'a'.repeat(201)).status).toBe('limit');
  });

  it('terminates on a repeated epsilon configuration', () => {
    const pda: PDADefinition = {
      ...ANBN_PDA,
      transitions: [
        { id: 'epsilon-self-loop', fromState: 'push-a', inputSymbol: null, stackTop: '$', toState: 'push-a', pushSymbols: ['$'] },
      ],
    };
    const result = simulatePDA(pda, '');

    expect(result.status).toBe('rejected');
    expect(result.trace).toHaveLength(1);
    expect(result.trace[0].alreadyVisited).toBe(true);
  });

  it('stops when configuration expansion exceeds its bound', () => {
    const growingStackPDA: PDADefinition = {
      ...ANBN_PDA,
      transitions: [
        { id: 'grow-stack', fromState: 'push-a', inputSymbol: null, stackTop: '$', toState: 'push-a', pushSymbols: ['$', 'A'] },
        { id: 'grow-a-stack', fromState: 'push-a', inputSymbol: null, stackTop: 'A', toState: 'push-a', pushSymbols: ['A', 'A'] },
      ],
    };
    const result = simulatePDA(growingStackPDA, '', 10);

    expect(result.status).toBe('limit');
    expect(result.error).toContain('Configuration limit reached');
  });
});
