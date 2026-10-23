/**
 * Rule-based diagnostic engine (AI Foundations — knowledge representation).
 *
 * Each rule has:
 *  - a unique ID
 *  - a predicate over the EvidenceReport (observable condition)
 *  - a diagnostic statement (fact, inferred cause, or hypothesis)
 *  - a confidence label: 'observed' | 'inferred' | 'hypothesis'
 *
 * Rules are evaluated in order. A rule fires only when its predicate is true.
 * This is forward chaining over the evidence report.
 *
 * Rules NEVER modify test results, invent trace events, or override
 * deterministic outcomes. They are explanatory only.
 */

import type { DiagnosticResult, EvidenceReport } from '../types/domain';

// ---------------------------------------------------------------------------
// Rule type
// ---------------------------------------------------------------------------

interface DiagnosticRule {
  id: string;
  predicate: (report: EvidenceReport) => boolean;
  confidence: DiagnosticResult['confidence'];
  statement: string;
  evidenceRefs: (report: EvidenceReport) => string[];
}

// ---------------------------------------------------------------------------
// Rule catalog
// ---------------------------------------------------------------------------

const rules: DiagnosticRule[] = [
  {
    id: 'all-tests-passed',
    predicate: (r) => r.status === 'passed',
    confidence: 'observed',
    statement:
      'All declared test cases passed. This is evidence that your implementation handles the specific inputs tested — it is not a proof of universal correctness.',
    evidenceRefs: (r) => r.tests.map((t) => t.testId),
  },
  {
    id: 'right-boundary-failed',
    predicate: (r) =>
      r.tests.some(
        (t) => t.testId === 'target-at-right-boundary' && t.status === 'failed',
      ),
    confidence: 'observed',
    statement:
      'The test "target-at-right-boundary" failed: the implementation returned -1 when the target was the last element of the array.',
    evidenceRefs: () => ['target-at-right-boundary'],
  },
  {
    id: 'loop-exits-early-hypothesis',
    predicate: (r) =>
      r.tests.some(
        (t) => t.testId === 'target-at-right-boundary' && t.status === 'failed',
      ) &&
      r.tests.some(
        (t) => t.testId === 'target-at-left-boundary' && t.status === 'passed',
      ),
    confidence: 'inferred',
    statement:
      'The loop likely terminates before examining the final position. The left-boundary case passed (low starts at 0, which is a valid mid), but the right-boundary case failed (when low === high, the loop does not execute).',
    evidenceRefs: () => ['target-at-right-boundary', 'target-at-left-boundary'],
  },
  {
    id: 'singleton-failed',
    predicate: (r) =>
      r.tests.some(
        (t) => t.testId === 'singleton-found' && t.status === 'failed',
      ),
    confidence: 'observed',
    statement:
      'The single-element test failed: a one-element array with the target present returned -1. This strongly suggests the loop never executes when low === high.',
    evidenceRefs: () => ['singleton-found'],
  },
  {
    id: 'runtime-error',
    predicate: (r) => r.tests.some((t) => t.status === 'error'),
    confidence: 'observed',
    statement:
      'At least one test case encountered a runtime error. Check that your function is named exactly `binarySearch` and that it returns a number.',
    evidenceRefs: (r) =>
      r.tests.filter((t) => t.status === 'error').map((t) => t.testId),
  },
  {
    id: 'partial-pass',
    predicate: (r) =>
      r.status === 'failed' &&
      r.tests.some((t) => t.status === 'passed') &&
      r.tests.some((t) => t.status === 'failed'),
    confidence: 'observed',
    statement:
      'Some tests passed and some failed. The bug is likely in a boundary condition rather than the core algorithm logic.',
    evidenceRefs: (r) =>
      r.tests.filter((t) => t.status === 'failed').map((t) => t.testId),
  },
  {
    id: 'all-but-boundary-pass',
    predicate: (r) => {
      const failed = r.tests.filter((t) => t.status === 'failed');
      const failedTargetAtRight = failed.some((t) => t.testId === 'target-at-right-boundary');
      return r.status === 'failed' && failedTargetAtRight;
    },
    confidence: 'inferred',
    statement:
      'The right-boundary test case fails (expected index, got -1). This is the classic signature of a `while (low < high)` vs `while (low <= high)` off-by-one error — the final element is never examined when the search space narrows to a single element.',
    evidenceRefs: (r) =>
      r.tests.filter((t) => t.status === 'failed').map((t) => t.testId),
  },
  {
    id: 'timeout',
    predicate: (r) => r.status === 'timeout',
    confidence: 'observed',
    statement:
      'Execution exceeded the maximum allowed steps. Check for infinite loops or recursive calls without proper termination conditions.',
    evidenceRefs: () => [],
  },
  {
    id: 'empty-array-failed',
    predicate: (r) =>
      r.tests.some(
        (t) => t.testId === 'empty-input' && t.status === 'failed',
      ),
    confidence: 'observed',
    statement:
      'The empty-array test case failed. An empty array should return -1 immediately without entering the search loop.',
    evidenceRefs: () => ['empty-input'],
  },
  {
    id: 'singleton-boundary-pattern',
    predicate: (r) =>
      r.tests.some(
        (t) => t.testId === 'singleton-found' && t.status === 'failed',
      ) &&
      r.tests.some(
        (t) => t.testId === 'target-at-right-boundary' && t.status === 'failed',
      ),
    confidence: 'inferred',
    statement:
      'The singleton and right-boundary tests both fail, confirming the loop condition `while (low < high)` exits before examining the final remaining element. When the search narrows to one position (low === high), the condition is already false, so that element is skipped.',
    evidenceRefs: () => ['singleton-found', 'target-at-right-boundary'],
  },
];

// ---------------------------------------------------------------------------
// Forward-chaining evaluator
// ---------------------------------------------------------------------------

/**
 * Evaluate all rules against the evidence report and return the fired rules
 * as DiagnosticResults.
 */
export function diagnose(report: EvidenceReport): DiagnosticResult[] {
  const results: DiagnosticResult[] = [];
  for (const rule of rules) {
    if (rule.predicate(report)) {
      results.push({
        ruleId: rule.id,
        confidence: rule.confidence,
        statement: rule.statement,
        evidenceRefs: rule.evidenceRefs(report),
      });
    }
  }
  return results;
}
