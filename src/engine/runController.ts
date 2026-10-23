/**
 * Run controller — orchestrates running a challenge against student code
 * and assembles the canonical EvidenceReport.
 *
 * This module is pure TS with no React imports.
 */

import type {
  Challenge,
  EvidenceReport,
  RunRequest,
  RunStatus,
  TestResult,
  TraceEvent,
} from '../types/domain';
import { runTestCase } from './binarySearch';

// ---------------------------------------------------------------------------
// Simple hex hash (not cryptographic — used only as a change-detection key)
// ---------------------------------------------------------------------------

function simpleHash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  // Convert to unsigned hex
  return (h >>> 0).toString(16).padStart(8, '0');
}

// ---------------------------------------------------------------------------
// Main run function
// ---------------------------------------------------------------------------

export function runChallenge(
  challenge: Challenge,
  req: RunRequest,
): EvidenceReport {
  const allResults: TestResult[] = [];
  const allTrace: TraceEvent[] = [];

  for (const tc of challenge.testCases) {
    const { testResult, trace } = runTestCase(tc, req.sourceCode);
    allResults.push(testResult);
    allTrace.push(...trace);
  }

  const anyError = allResults.some((r) => r.status === 'error');
  const anyFailed = allResults.some((r) => r.status === 'failed');
  const status: RunStatus = anyError ? 'runtime_error' : anyFailed ? 'failed' : 'passed';

  return {
    schemaVersion: '1.0',
    runId: req.runId,
    challengeId: req.challengeId,
    codeHash: `sha256-lite:${simpleHash(req.sourceCode)}`,
    status,
    tests: allResults,
    trace: allTrace,
    createdAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Run ID generator
// ---------------------------------------------------------------------------

export function generateRunId(): string {
  return `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
