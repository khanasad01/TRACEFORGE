/**
 * Unit tests for the Binary Search engine.
 *
 * These tests verify:
 * 1. The BUGGY starter code fails the expected test cases.
 * 2. The REFERENCE code passes all declared test cases.
 * 3. The trace engine produces correct trace events.
 * 4. Edge cases are handled correctly.
 *
 * Tests use actual computed results — no hardcoded pass states.
 */

import { describe, it, expect } from 'vitest';
import {
  runBinarySearchWithTrace,
  runStudentCode,
  runTestCase,
} from '../../engine/binarySearch';
import {
  binarySearchChallenge,
  BUGGY_STARTER,
  REFERENCE_CODE,
} from '../../challenges/binarySearch/challenge';

// ---------------------------------------------------------------------------
// Reference algorithm correctness
// ---------------------------------------------------------------------------

describe('runBinarySearchWithTrace — reference algorithm', () => {
  it('returns -1 for empty array', () => {
    const { result, trace } = runBinarySearchWithTrace([], 5, 'test');
    expect(result).toBe(-1);
    expect(trace.some((e) => e.event === 'not_found')).toBe(true);
  });

  it('finds element in singleton array', () => {
    const { result } = runBinarySearchWithTrace([7], 7, 'test');
    expect(result).toBe(0);
  });

  it('returns -1 for singleton with absent target', () => {
    const { result } = runBinarySearchWithTrace([7], 3, 'test');
    expect(result).toBe(-1);
  });

  it('finds target at left boundary (index 0)', () => {
    const { result } = runBinarySearchWithTrace([1, 3, 5, 7, 9], 1, 'test');
    expect(result).toBe(0);
  });

  it('finds target at right boundary (last index)', () => {
    const { result } = runBinarySearchWithTrace([1, 3, 5, 7, 9], 9, 'test');
    expect(result).toBe(4);
  });

  it('finds target in the middle', () => {
    const { result } = runBinarySearchWithTrace([2, 4, 6, 8, 10], 6, 'test');
    expect(result).toBe(2);
  });

  it('returns -1 for absent target', () => {
    const { result } = runBinarySearchWithTrace([1, 3, 5, 7, 9], 4, 'test');
    expect(result).toBe(-1);
  });

  it('finds one of the duplicate values', () => {
    const { result } = runBinarySearchWithTrace([1, 2, 2, 2, 3], 2, 'test');
    expect([1, 2, 3]).toContain(result); // any valid index is correct
  });

  it('finds target near end of a larger array', () => {
    const { result } = runBinarySearchWithTrace(
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      10,
      'test',
    );
    expect(result).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// Trace quality
// ---------------------------------------------------------------------------

describe('runBinarySearchWithTrace — trace events', () => {
  it('always starts with an init event', () => {
    const { trace } = runBinarySearchWithTrace([1, 2, 3], 2, 'ref');
    expect(trace[0].event).toBe('init');
  });

  it('emits mid_computed events during search', () => {
    const { trace } = runBinarySearchWithTrace([1, 3, 5, 7, 9], 9, 'ref');
    expect(trace.some((e) => e.event === 'mid_computed')).toBe(true);
  });

  it('emits found event when target is present', () => {
    const { trace } = runBinarySearchWithTrace([1, 3, 5], 3, 'ref');
    expect(trace.some((e) => e.event === 'found')).toBe(true);
  });

  it('emits not_found event when target is absent', () => {
    const { trace } = runBinarySearchWithTrace([1, 3, 5], 4, 'ref');
    expect(trace.some((e) => e.event === 'not_found')).toBe(true);
  });

  it('tags trace events with evidenceRef', () => {
    const { trace } = runBinarySearchWithTrace([1, 2, 3], 3, 'my-test');
    expect(trace.every((e) => e.evidenceRef === 'my-test')).toBe(true);
  });

  it('assigns step numbers sequentially starting at 1', () => {
    const { trace } = runBinarySearchWithTrace([1, 2, 3], 2, 't');
    for (let i = 0; i < trace.length; i++) {
      expect(trace[i].step).toBe(i + 1);
    }
  });
});

// ---------------------------------------------------------------------------
// Student code runner
// ---------------------------------------------------------------------------

describe('runStudentCode', () => {
  it('runs correct code and returns right index', () => {
    const result = runStudentCode(REFERENCE_CODE, [1, 3, 5, 7, 9], 9);
    expect(result).toBe(4);
  });

  it('throws if function is not named binarySearch', () => {
    expect(() =>
      runStudentCode('function foo() { return 0; }', [1, 2, 3], 2),
    ).toThrow();
  });

  it('throws on runtime error in student code', () => {
    expect(() =>
      runStudentCode('function binarySearch() { throw new Error("boom"); }', [1], 1),
    ).toThrow('boom');
  });
});

// ---------------------------------------------------------------------------
// Test harness — buggy starter vs reference
// ---------------------------------------------------------------------------

describe('Buggy starter — must fail known cases', () => {
  it('FAILS the target-at-right-boundary test case', () => {
    const tc = binarySearchChallenge.testCases.find(
      (t) => t.id === 'target-at-right-boundary',
    )!;
    const { testResult } = runTestCase(tc, BUGGY_STARTER);
    expect(testResult.status).toBe('failed');
    expect(testResult.actual).toBe(-1); // buggy code returns -1 instead of 4
    expect(testResult.expected).toBe(4);
  });

  it('FAILS the singleton-found test case', () => {
    const tc = binarySearchChallenge.testCases.find(
      (t) => t.id === 'singleton-found',
    )!;
    const { testResult } = runTestCase(tc, BUGGY_STARTER);
    // singleton: low=0, high=0, condition 0 < 0 is false — loop never executes
    expect(testResult.status).toBe('failed');
    expect(testResult.actual).toBe(-1);
  });

  it('FAILS the larger-array test case (target at index 10)', () => {
    const tc = binarySearchChallenge.testCases.find(
      (t) => t.id === 'larger-array',
    )!;
    const { testResult } = runTestCase(tc, BUGGY_STARTER);
    expect(testResult.status).toBe('failed');
  });
});

describe('Reference code — must pass all declared test cases', () => {
  for (const tc of binarySearchChallenge.testCases) {
    it(`PASSES: ${tc.id}`, () => {
      const { testResult } = runTestCase(tc, REFERENCE_CODE);
      expect(testResult.status).toBe('passed');
      expect(testResult.actual).toBe(tc.expected);
    });
  }
});
