/**
 * Pure Binary Search engine.
 *
 * This module contains ONLY algorithm logic — no React, no UI, no side effects.
 * It accepts a source-code string, parses it as one of the supported
 * implementations, runs deterministic search, and emits a full trace.
 *
 * For Phase 1 the "execution" is handled by evaluating the student's code
 * as a JavaScript function using the Function constructor (sandboxed to the
 * extent possible in a browser). Python execution via Pyodide is deferred to
 * Phase 3. This module clearly documents this limitation.
 *
 * SECURITY NOTE: The Function constructor executes code in the same origin.
 * It is NOT a hardened sandbox. This is a usability prototype boundary, not
 * a production security control. Do not expose this to arbitrary external code.
 */

import type { TestCase, TestResult, TraceEvent } from '../types/domain';
import { ExecutionLimitError, interpretBinarySearchWithTrace } from './safeInterpreter';

// ---------------------------------------------------------------------------
// Trace-instrumented reference implementations
// ---------------------------------------------------------------------------

/**
 * Run binary search on `array` looking for `target`, recording every step
 * as a TraceEvent. Returns the index (or -1) and the trace log.
 */
export function runBinarySearchWithTrace(
  array: number[],
  target: number,
  evidenceRef: string,
): { result: number; trace: TraceEvent[] } {
  const trace: TraceEvent[] = [];
  let step = 0;

  if (array.length === 0) {
    trace.push({
      step: ++step,
      event: 'init',
      variables: { array: [], target, low: 0, high: -1 },
      evidenceRef,
      note: 'Empty array — search space is immediately exhausted.',
    });
    trace.push({
      step: ++step,
      event: 'not_found',
      variables: { result: -1 },
      evidenceRef,
    });
    return { result: -1, trace };
  }

  let low = 0;
  let high = array.length - 1;

  trace.push({
    step: ++step,
    event: 'init',
    variables: { target, low, high, arrayLength: array.length },
    evidenceRef,
  });

  while (low <= high) {
    trace.push({
      step: ++step,
      event: 'loop_condition',
      variables: { low, high, condition: low <= high },
      evidenceRef,
    });

    const mid = Math.floor((low + high) / 2);
    trace.push({
      step: ++step,
      event: 'mid_computed',
      variables: { low, high, mid, midValue: array[mid] },
      evidenceRef,
    });

    trace.push({
      step: ++step,
      event: 'comparison',
      variables: { midValue: array[mid], target, equal: array[mid] === target },
      evidenceRef,
    });

    if (array[mid] === target) {
      trace.push({
        step: ++step,
        event: 'found',
        variables: { result: mid, midValue: array[mid], target },
        evidenceRef,
      });
      return { result: mid, trace };
    } else if (array[mid] < target) {
      const newLow = mid + 1;
      trace.push({
        step: ++step,
        event: 'move_low',
        variables: { from: low, to: newLow, because: `array[${mid}]=${array[mid]} < target=${target}` },
        evidenceRef,
      });
      low = newLow;
    } else {
      const newHigh = mid - 1;
      trace.push({
        step: ++step,
        event: 'move_high',
        variables: { from: high, to: newHigh, because: `array[${mid}]=${array[mid]} > target=${target}` },
        evidenceRef,
      });
      high = newHigh;
    }

    // Guard against runaway loops (should never happen with correct logic)
    if (step > 500) {
      trace.push({
        step: ++step,
        event: 'not_found',
        variables: { low, high, note: 'Trace cap reached.' },
        evidenceRef,
        note: 'Execution capped at 500 steps.',
      });
      return { result: -1, trace };
    }
  }

  trace.push({
    step: ++step,
    event: 'not_found',
    variables: { result: -1 },
    evidenceRef,
  });
  return { result: -1, trace };
}

// ---------------------------------------------------------------------------
// Buggy student implementation runner
// ---------------------------------------------------------------------------

/**
 * Attempts to extract a binary search function from student source code and
 * call it. The function must be named `binarySearch` and accept
 * (array: number[], target: number) => number.
 *
 * Returns the student's return value or throws on runtime error.
 *
 * ⚠ Uses the Function constructor. See module-level SECURITY NOTE.
 */
export function runStudentCode(
  sourceCode: string,
  array: number[],
  target: number,
): number {
  // Wrap source in a closure that returns the function
  const wrapped = `
    ${sourceCode}
    if (typeof binarySearch !== 'function') {
      throw new Error('Your code must define a function named binarySearch(array, target).');
    }
    return binarySearch(array, target);
  `;
  const fn = new Function('array', 'target', wrapped);
  const result = fn(array, target) as unknown;
  if (typeof result !== 'number') {
    throw new TypeError(`binarySearch must return a number, got ${typeof result}`);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Test harness
// ---------------------------------------------------------------------------

/**
 * Run a single test case against the student's source code and return a
 * TestResult along with the genuine execution trace produced by interpreting
 * the student's submission.
 */
export function runTestCase(
  testCase: TestCase,
  sourceCode: string,
): { testResult: TestResult; trace: TraceEvent[] } {
  let actual: unknown = null;
  let status: TestResult['status'];
  let message: string | undefined;
  let trace: TraceEvent[] = [];

  try {
    const exec = interpretBinarySearchWithTrace(
      sourceCode,
      [...testCase.array],
      testCase.target,
      testCase.id,
    );
    actual = exec.result;
    trace = exec.trace;

    if (actual === testCase.expected) {
      status = 'passed';
    } else {
      status = 'failed';
      message = `Expected index ${testCase.expected} but got ${actual}.`;
    }
  } catch (err) {
    const timedOut = err instanceof ExecutionLimitError;
    status = timedOut ? 'timeout' : 'error';
    message = err instanceof Error ? err.message : String(err);
    trace = [
      {
        step: 1,
        event: timedOut ? 'execution_limit' : 'init',
        variables: { error: message },
        evidenceRef: testCase.id,
        note: timedOut
          ? `Execution stopped after reaching the step limit: ${message}`
          : `Execution halted with error: ${message}`,
      },
    ];
  }

  return {
    testResult: {
      testId: testCase.id,
      status,
      expected: testCase.expected,
      actual,
      message,
    },
    trace,
  };
}
