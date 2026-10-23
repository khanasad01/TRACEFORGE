import { describe, it, expect } from 'vitest';
import { interpretBinarySearchWithTrace, validateBinarySearchSource } from '../../engine/safeInterpreter';
import { BUGGY_STARTER, REFERENCE_CODE } from '../../challenges/binarySearch/challenge';

describe('validateBinarySearchSource', () => {
  it('validates correct code', () => {
    const res = validateBinarySearchSource(REFERENCE_CODE);
    expect(res.valid).toBe(true);
  });

  it('rejects invalid syntax', () => {
    const res = validateBinarySearchSource('function binarySearch(array, target) { return }}}}');
    expect(res.valid).toBe(false);
    expect(res.error).toContain('Syntax error');
  });

  it('rejects missing binarySearch function', () => {
    const res = validateBinarySearchSource('function otherFunc(a, b) { return -1; }');
    expect(res.valid).toBe(false);
    expect(res.error).toContain('must define a function named binarySearch');
  });
});

describe('interpretBinarySearchWithTrace', () => {
  it('evaluates empty array correctly', () => {
    const res = interpretBinarySearchWithTrace(BUGGY_STARTER, [], 5, 'test-empty');
    expect(res.result).toBe(-1);
    expect(res.trace.length).toBeGreaterThan(0);
    expect(res.trace[0].event).toBe('init');
    expect(res.trace[res.trace.length - 1].event).toBe('not_found');
    expect(res.trace.every((e) => e.evidenceRef === 'test-empty')).toBe(true);
  });

  it('buggy starter fails target-at-right-boundary and reflects buggy trace', () => {
    const array = [1, 3, 5, 7, 9];
    const target = 9;
    const res = interpretBinarySearchWithTrace(BUGGY_STARTER, array, target, 'test-right');
    expect(res.result).toBe(-1); // Buggy code returned -1
    // The trace ends with not_found, never finding index 4
    expect(res.trace[res.trace.length - 1].event).toBe('not_found');
    // Notice loop condition for low=4, high=4 was 4 < 4 which evaluated to false!
    const lastLoopCond = [...res.trace].reverse().find((e) => e.event === 'loop_condition');
    expect(lastLoopCond?.variables.condition).toBe(false);
    expect(lastLoopCond?.variables.low).toBe(4);
    expect(lastLoopCond?.variables.high).toBe(4);
  });

  it('reference code finds target-at-right-boundary with found trace event', () => {
    const array = [1, 3, 5, 7, 9];
    const target = 9;
    const res = interpretBinarySearchWithTrace(REFERENCE_CODE, array, target, 'test-right-ref');
    expect(res.result).toBe(4);
    const foundEvent = res.trace.find((e) => e.event === 'found');
    expect(foundEvent).toBeDefined();
    expect(foundEvent?.variables.result).toBe(4);
  });

  it('detects infinite loop and throws execution limit error', () => {
    const infiniteCode = `
      function binarySearch(array, target) {
        let low = 0;
        let high = array.length - 1;
        while (true) {
          const mid = 0;
        }
        return -1;
      }
    `;
    expect(() => interpretBinarySearchWithTrace(infiniteCode, [1, 2, 3], 2, 'test-loop', 20)).toThrow(
      'Execution limit exceeded',
    );
  });
});
