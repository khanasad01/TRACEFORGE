/**
 * TRACEFORGE canonical domain types.
 * These types form the contract between the execution engine, test harness,
 * diagnostic engine, and UI. All runtime data flows through these structures.
 */

// ---------------------------------------------------------------------------
// Run lifecycle
// ---------------------------------------------------------------------------

export type RunStatus =
  | 'idle'
  | 'queued'
  | 'running'
  | 'passed'
  | 'failed'
  | 'runtime_error'
  | 'timeout'
  | 'cancelled';

export type TestStatus = 'passed' | 'failed' | 'error' | 'timeout' | 'skipped';

// ---------------------------------------------------------------------------
// Evidence envelope (canonical schema v1.0)
// ---------------------------------------------------------------------------

export interface TestResult {
  testId: string;
  status: TestStatus;
  expected: unknown;
  actual: unknown;
  message?: string;
}

export interface TraceEvent {
  step: number;
  /** Identifier describing what happened at this step. */
  event:
    | 'init'
    | 'loop_condition'
    | 'mid_computed'
    | 'comparison'
    | 'move_low'
    | 'move_high'
    | 'found'
    | 'not_found'
    | 'execution_limit';
  variables: Record<string, unknown>;
  /** Optional reference to the test case this trace event belongs to. */
  evidenceRef?: string;
  note?: string;
}

export interface EvidenceReport {
  schemaVersion: '1.0';
  runId: string;
  challengeId: string;
  /** sha256-like hex digest of source code (computed client-side). */
  codeHash: string;
  status: RunStatus;
  tests: TestResult[];
  trace: TraceEvent[];
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Challenge registry
// ---------------------------------------------------------------------------

export interface TestCase {
  id: string;
  description: string;
  /** Sorted array to search in. */
  array: number[];
  target: number;
  expected: number;
}

export interface HintLevel {
  level: 1 | 2 | 3 | 4;
  /** Short attention-direction hint — no spoilers. */
  text: string;
  /** Which test IDs this hint is relevant to. */
  evidenceRefs: string[];
}

export interface Challenge {
  id: string;
  title: string;
  subject: 'daa';
  algorithm: string;
  description: string;
  buggyStarterCode: string;
  referenceCode: string;
  testCases: TestCase[];
  hints: HintLevel[];
}

// ---------------------------------------------------------------------------
// Run request
// ---------------------------------------------------------------------------

export interface RunRequest {
  challengeId: string;
  sourceCode: string;
  runId: string;
}

// ---------------------------------------------------------------------------
// Diagnostic rules (AI Foundations — rule-based inference)
// ---------------------------------------------------------------------------

export type DiagnosticConfidence = 'observed' | 'inferred' | 'hypothesis';

export interface DiagnosticResult {
  ruleId: string;
  confidence: DiagnosticConfidence;
  /** One-sentence statement of the observed or inferred fact. */
  statement: string;
  /** The test/trace events that support this diagnostic. */
  evidenceRefs: string[];
}
