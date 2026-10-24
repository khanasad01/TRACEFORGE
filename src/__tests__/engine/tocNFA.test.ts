import { describe, expect, it } from 'vitest';
import { compileRegularExpression, simulateNFA } from '../../engine/tocNFA';

describe('compileRegularExpression and simulateNFA', () => {
  it('simulates union and concatenation from execution-derived state sets', () => {
    const nfa = compileRegularExpression('a|bc');
    const acceptedA = simulateNFA(nfa, 'a');
    const acceptedBC = simulateNFA(nfa, 'bc');

    expect(acceptedA.accepted).toBe(true);
    expect(acceptedBC.accepted).toBe(true);
    expect(simulateNFA(nfa, 'b').accepted).toBe(false);
    expect(acceptedBC.trace.map((step) => step.step)).toEqual([1, 2]);
    expect(acceptedBC.trace[0].activeStatesBefore).toEqual(acceptedBC.initialStates);
    expect(acceptedBC.trace[1].activeStatesBefore).toEqual(acceptedBC.trace[0].activeStatesAfter);
  });

  it('supports Kleene star and accepts zero or more repetitions', () => {
    const nfa = compileRegularExpression('(ab)*');
    expect(simulateNFA(nfa, '').accepted).toBe(true);
    expect(simulateNFA(nfa, 'ab').accepted).toBe(true);
    expect(simulateNFA(nfa, 'abab').accepted).toBe(true);
    expect(simulateNFA(nfa, 'aba').accepted).toBe(false);
  });

  it('supports epsilon as the empty string', () => {
    const nfa = compileRegularExpression('ε|ab');
    const empty = simulateNFA(nfa, '');
    expect(empty.accepted).toBe(true);
    expect(empty.trace).toEqual([]);
    expect(empty.initialStates).toContain(nfa.acceptStates[0]);
    expect(simulateNFA(nfa, 'ab').accepted).toBe(true);
    expect(simulateNFA(nfa, 'a').accepted).toBe(false);
  });

  it('rejects input symbols outside the expression alphabet with partial trace', () => {
    const nfa = compileRegularExpression('(0|1)*01');
    const result = simulateNFA(nfa, '1102');

    expect(result.accepted).toBe(false);
    expect(result.error).toContain("Symbol '2' at index 3");
    expect(result.trace).toHaveLength(3);
  });

  it('rejects malformed and unsupported expressions explicitly', () => {
    expect(() => compileRegularExpression('')).toThrow('use ε for the empty string');
    expect(() => compileRegularExpression('a|')).toThrow("Expected an expression after '|'");
    expect(() => compileRegularExpression('(ab')).toThrow('Unclosed group');
    expect(() => compileRegularExpression('a b')).toThrow('Whitespace is not allowed');
  });

  it('terminates epsilon closure despite epsilon cycles', () => {
    const nfa = compileRegularExpression('(a*)*');
    const result = simulateNFA(nfa, 'aaa');

    expect(result.accepted).toBe(true);
    expect(result.initialStates.length).toBeLessThanOrEqual(nfa.states.length);
    expect(result.trace).toHaveLength(3);
  });
});
