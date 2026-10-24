/**
 * Unit tests for the rule-based diagnostic engine.
 */

import { describe, it, expect } from 'vitest';
import { diagnose } from '../../diagnostics/engine';
import { runChallenge } from '../../engine/runController';
import { binarySearchChallenge, BUGGY_STARTER, REFERENCE_CODE } from '../../challenges/binarySearch/challenge';

function makeReport(sourceCode: string) {
  return runChallenge(binarySearchChallenge, {
    challengeId: binarySearchChallenge.id,
    sourceCode,
    runId: 'diag-test',
  });
}

describe('diagnose — buggy starter', () => {
  it('fires right-boundary-failed rule', () => {
    const report = makeReport(BUGGY_STARTER);
    const results = diagnose(report);
    expect(results.some((r) => r.ruleId === 'right-boundary-failed')).toBe(true);
  });

  it('marks boundary failure as observed', () => {
    const report = makeReport(BUGGY_STARTER);
    const results = diagnose(report);
    const rule = results.find((r) => r.ruleId === 'right-boundary-failed');
    expect(rule?.confidence).toBe('observed');
  });

  it('references target-at-right-boundary in evidence', () => {
    const report = makeReport(BUGGY_STARTER);
    const results = diagnose(report);
    const rule = results.find((r) => r.ruleId === 'right-boundary-failed');
    expect(rule?.evidenceRefs).toContain('target-at-right-boundary');
  });

  it('fires loop-exits-early-hypothesis rule', () => {
    const report = makeReport(BUGGY_STARTER);
    const results = diagnose(report);
    expect(results.some((r) => r.ruleId === 'loop-exits-early-hypothesis')).toBe(true);
  });

  it('loop hypothesis is marked as inferred', () => {
    const report = makeReport(BUGGY_STARTER);
    const results = diagnose(report);
    const rule = results.find((r) => r.ruleId === 'loop-exits-early-hypothesis');
    expect(rule?.confidence).toBe('inferred');
  });

  it('does NOT fire all-tests-passed rule when code is buggy', () => {
    const report = makeReport(BUGGY_STARTER);
    const results = diagnose(report);
    expect(results.some((r) => r.ruleId === 'all-tests-passed')).toBe(false);
  });
});

describe('diagnose — reference code', () => {
  it('fires all-tests-passed rule', () => {
    const report = makeReport(REFERENCE_CODE);
    const results = diagnose(report);
    expect(results.some((r) => r.ruleId === 'all-tests-passed')).toBe(true);
  });

  it('does NOT fire failure rules when code is correct', () => {
    const report = makeReport(REFERENCE_CODE);
    const results = diagnose(report);
    expect(results.some((r) => r.ruleId === 'right-boundary-failed')).toBe(false);
    expect(results.some((r) => r.ruleId === 'singleton-failed')).toBe(false);
  });
});

describe('diagnose — runtime error code', () => {
  it('fires runtime-error rule', () => {
    const errorCode = 'function binarySearch() { throw new Error("oops"); }';
    const report = makeReport(errorCode);
    const results = diagnose(report);
    expect(results.some((r) => r.ruleId === 'runtime-error')).toBe(true);
  });
});

describe('diagnose — execution limit', () => {
  it('reports the timed-out tests as evidence', () => {
    const report = makeReport('function binarySearch(array, target) { while (true) {} }');
    const timeout = diagnose(report).find((result) => result.ruleId === 'timeout');

    expect(report.status).toBe('timeout');
    expect(timeout?.evidenceRefs.length).toBeGreaterThan(0);
    expect(timeout?.statement).toContain('not a wall-clock timeout');
  });
});

describe('diagnose — new enhanced rules', () => {
  it('fires all-but-boundary-pass rule when right-boundary fails', () => {
    const report = makeReport(BUGGY_STARTER);
    const results = diagnose(report);
    expect(results.some((r) => r.ruleId === 'all-but-boundary-pass')).toBe(true);
  });

  it('all-but-boundary-pass has inferred confidence', () => {
    const report = makeReport(BUGGY_STARTER);
    const results = diagnose(report);
    const rule = results.find((r) => r.ruleId === 'all-but-boundary-pass');
    expect(rule?.confidence).toBe('inferred');
  });

  it('does NOT fire all-but-boundary-pass when all tests pass', () => {
    const report = makeReport(REFERENCE_CODE);
    const results = diagnose(report);
    expect(results.some((r) => r.ruleId === 'all-but-boundary-pass')).toBe(false);
  });

  it('fires singleton-boundary-pattern rule with buggy starter', () => {
    const report = makeReport(BUGGY_STARTER);
    const results = diagnose(report);
    expect(results.some((r) => r.ruleId === 'singleton-boundary-pattern')).toBe(true);
  });

  it('does NOT fire empty-array-failed when reference code is used', () => {
    const report = makeReport(REFERENCE_CODE);
    const results = diagnose(report);
    expect(results.some((r) => r.ruleId === 'empty-array-failed')).toBe(false);
  });
});
