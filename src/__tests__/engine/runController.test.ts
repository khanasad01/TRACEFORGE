/**
 * Unit tests for the run controller.
 */

import { describe, it, expect } from 'vitest';
import { runChallenge, generateRunId } from '../../engine/runController';
import { binarySearchChallenge, BUGGY_STARTER, REFERENCE_CODE } from '../../challenges/binarySearch/challenge';

describe('runChallenge', () => {
  it('returns status=failed when buggy code is run', () => {
    const report = runChallenge(binarySearchChallenge, {
      challengeId: binarySearchChallenge.id,
      sourceCode: BUGGY_STARTER,
      runId: 'test-run-1',
    });
    expect(report.status).toBe('failed');
    expect(report.schemaVersion).toBe('1.0');
    expect(report.challengeId).toBe(binarySearchChallenge.id);
    expect(report.runId).toBe('test-run-1');
  });

  it('returns status=passed when reference code is run', () => {
    const report = runChallenge(binarySearchChallenge, {
      challengeId: binarySearchChallenge.id,
      sourceCode: REFERENCE_CODE,
      runId: 'test-run-2',
    });
    expect(report.status).toBe('passed');
    expect(report.tests.every((t) => t.status === 'passed')).toBe(true);
  });

  it('reports execution-limit exhaustion as timeout, not runtime_error', () => {
    const sourceCode = `
      function binarySearch(array, target) {
        while (true) {}
      }
    `;
    const report = runChallenge(binarySearchChallenge, {
      challengeId: binarySearchChallenge.id,
      sourceCode,
      runId: 'test-run-timeout',
    });

    expect(report.status).toBe('timeout');
    expect(report.tests[0].status).toBe('timeout');
    expect(report.trace[0].event).toBe('execution_limit');
  });

  it('includes all declared test cases in output', () => {
    const report = runChallenge(binarySearchChallenge, {
      challengeId: binarySearchChallenge.id,
      sourceCode: REFERENCE_CODE,
      runId: 'test-run-3',
    });
    const ids = report.tests.map((t) => t.testId);
    for (const tc of binarySearchChallenge.testCases) {
      expect(ids).toContain(tc.id);
    }
  });

  it('includes trace events in the report', () => {
    const report = runChallenge(binarySearchChallenge, {
      challengeId: binarySearchChallenge.id,
      sourceCode: REFERENCE_CODE,
      runId: 'test-run-4',
    });
    expect(report.trace.length).toBeGreaterThan(0);
  });

  it('includes a createdAt ISO timestamp', () => {
    const report = runChallenge(binarySearchChallenge, {
      challengeId: binarySearchChallenge.id,
      sourceCode: REFERENCE_CODE,
      runId: 'test-run-5',
    });
    expect(() => new Date(report.createdAt)).not.toThrow();
    expect(new Date(report.createdAt).toISOString()).toBe(report.createdAt);
  });

  it('assigns a codeHash based on source code', () => {
    const r1 = runChallenge(binarySearchChallenge, {
      challengeId: binarySearchChallenge.id,
      sourceCode: BUGGY_STARTER,
      runId: 'r1',
    });
    const r2 = runChallenge(binarySearchChallenge, {
      challengeId: binarySearchChallenge.id,
      sourceCode: REFERENCE_CODE,
      runId: 'r2',
    });
    expect(r1.codeHash).not.toBe(r2.codeHash);
  });
});

describe('generateRunId', () => {
  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 20 }, () => generateRunId()));
    expect(ids.size).toBe(20);
  });

  it('starts with run_', () => {
    expect(generateRunId().startsWith('run_')).toBe(true);
  });
});
