/**
 * Regression and Workflow tests for TRACEFORGE Binary Search debugging lab.
 *
 * Verifies:
 * 1. Buggy starter fails target-at-right-boundary.
 * 2. Correcting the loop condition changes the actual test result.
 * 3. The displayed trace corresponds to the submitted solution, not reference implementation.
 * 4. Trace events reference the correct test ID.
 * 5. Infinite loops terminate with an explicit failure status.
 * 6. Unsupported syntax produces a meaningful diagnostic.
 * 7. Boundary and duplicate-value cases continue to work.
 */

import { describe, it, expect } from 'vitest';
import { runTestCase } from '../../engine/binarySearch';
import { runChallenge } from '../../engine/runController';
import {
  binarySearchChallenge,
  BUGGY_STARTER,
  REFERENCE_CODE,
} from '../../challenges/binarySearch/challenge';

describe('TRACEFORGE Regression Suite', () => {
  it('1. Buggy starter fails target-at-right-boundary', () => {
    const tc = binarySearchChallenge.testCases.find((t) => t.id === 'target-at-right-boundary')!;
    const { testResult } = runTestCase(tc, BUGGY_STARTER);
    expect(testResult.status).toBe('failed');
    expect(testResult.actual).toBe(-1);
    expect(testResult.expected).toBe(4);
  });

  it('2. Correcting loop condition changes the actual test result to passed', () => {
    const tc = binarySearchChallenge.testCases.find((t) => t.id === 'target-at-right-boundary')!;
    const fixedCode = BUGGY_STARTER.replace('while (low < high)', 'while (low <= high)');
    const { testResult } = runTestCase(tc, fixedCode);
    expect(testResult.status).toBe('passed');
    expect(testResult.actual).toBe(4);
  });

  it('3. Displayed trace corresponds to the submitted solution, not reference implementation', () => {
    const tc = binarySearchChallenge.testCases.find((t) => t.id === 'target-at-right-boundary')!;
    
    // Run buggy starter
    const buggyRun = runTestCase(tc, BUGGY_STARTER);
    // Run reference code
    const refRun = runTestCase(tc, REFERENCE_CODE);

    // Buggy trace ends in not_found
    expect(buggyRun.trace.some((e) => e.event === 'found')).toBe(false);
    expect(buggyRun.trace[buggyRun.trace.length - 1].event).toBe('not_found');

    // Reference trace ends in found
    expect(refRun.trace.some((e) => e.event === 'found')).toBe(true);
    const foundEvent = refRun.trace.find((e) => e.event === 'found');
    expect(foundEvent?.variables.result).toBe(4);

    // The two traces are different because the buggy trace stopped early!
    expect(buggyRun.trace.length).not.toEqual(refRun.trace.length);
  });

  it('4. Trace events reference the correct test ID', () => {
    const tc = binarySearchChallenge.testCases.find((t) => t.id === 'target-in-middle')!;
    const { trace } = runTestCase(tc, REFERENCE_CODE);
    expect(trace.length).toBeGreaterThan(0);
    expect(trace.every((e) => e.evidenceRef === 'target-in-middle')).toBe(true);
  });

  it('5. Infinite loops terminate with an explicit failure/error status and limit note', () => {
    const infiniteCode = `
      function binarySearch(array, target) {
        let low = 0;
        let high = array.length - 1;
        while (low <= high) {
          // forgot to update low or high!
          const mid = Math.floor((low + high) / 2);
        }
        return -1;
      }
    `;
    const tc = binarySearchChallenge.testCases.find((t) => t.id === 'target-in-middle')!;
    const { testResult, trace } = runTestCase(tc, infiniteCode);

    expect(testResult.status).toBe('error');
    expect(testResult.message).toContain('Execution limit exceeded');
    expect(trace.some((t) => t.note?.includes('Execution limit exceeded'))).toBe(true);
  });

  it('6. Unsupported syntax produces a meaningful diagnostic', () => {
    const invalidSyntaxCode = `
      function binarySearch(array, target) {
        // syntax error
        let low = ;
      }
    `;
    const tc = binarySearchChallenge.testCases.find((t) => t.id === 'empty-input')!;
    const { testResult } = runTestCase(tc, invalidSyntaxCode);

    expect(testResult.status).toBe('error');
    expect(testResult.message).toContain('Syntax error');
  });

  it('7. Boundary and duplicate-value cases continue to work', () => {
    // Empty array
    const emptyTc = binarySearchChallenge.testCases.find((t) => t.id === 'empty-input')!;
    expect(runTestCase(emptyTc, REFERENCE_CODE).testResult.status).toBe('passed');

    // Singleton found
    const singleFound = binarySearchChallenge.testCases.find((t) => t.id === 'singleton-found')!;
    expect(runTestCase(singleFound, REFERENCE_CODE).testResult.status).toBe('passed');

    // Singleton absent
    const singleAbsent = binarySearchChallenge.testCases.find((t) => t.id === 'singleton-not-found')!;
    expect(runTestCase(singleAbsent, REFERENCE_CODE).testResult.status).toBe('passed');

    // Left boundary
    const leftTc = binarySearchChallenge.testCases.find((t) => t.id === 'target-at-left-boundary')!;
    expect(runTestCase(leftTc, REFERENCE_CODE).testResult.status).toBe('passed');

    // Duplicate values
    const dupTc = binarySearchChallenge.testCases.find((t) => t.id === 'duplicate-values')!;
    expect(runTestCase(dupTc, REFERENCE_CODE).testResult.status).toBe('passed');
  });

  it('8. Full challenge run through runChallenge handles all test cases and reports statuses', () => {
    const report = runChallenge(binarySearchChallenge, {
      challengeId: binarySearchChallenge.id,
      sourceCode: BUGGY_STARTER,
      runId: 'regression-run-buggy',
    });
    expect(report.status).toBe('failed');
    // Trace should contain events tagged for each individual test case
    const testIds = binarySearchChallenge.testCases.map((t) => t.id);
    for (const id of testIds) {
      expect(report.trace.some((e) => e.evidenceRef === id)).toBe(true);
    }
  });
});
