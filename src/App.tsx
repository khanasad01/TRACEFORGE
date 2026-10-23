import { useState } from 'react';
import type { EvidenceReport, RunStatus } from './types/domain';
import { binarySearchChallenge } from './challenges/binarySearch/challenge';
import { runChallenge, generateRunId } from './engine/runController';
import { diagnose } from './diagnostics/engine';
import { CodeEditor } from './components/CodeEditor';
import { TestResultPanel } from './components/TestResultPanel';
import { TraceViewer } from './components/TraceViewer';
import { HintPanel } from './components/HintPanel';
import styles from './App.module.css';

const challenge = binarySearchChallenge;

export function App() {
  const [sourceCode, setSourceCode] = useState(challenge.buggyStarterCode);
  const [runStatus, setRunStatus] = useState<RunStatus>('idle');
  const [report, setReport] = useState<EvidenceReport | null>(null);
  const [activeTestId, setActiveTestId] = useState<string | null>(null);
  const [runCount, setRunCount] = useState(0);

  const handleRun = () => {
    setRunStatus('running');
    // Schedule execution in next tick to allow UI to update to 'running' state
    setTimeout(() => {
      try {
        const runId = generateRunId();
        const result = runChallenge(challenge, {
          challengeId: challenge.id,
          sourceCode,
          runId,
        });
        setReport(result);
        setRunStatus(result.status);
        setRunCount((c) => c + 1);
        // Auto-select the first failing test
        const firstFail = result.tests.find(
          (t) => t.status === 'failed' || t.status === 'error',
        );
        setActiveTestId(firstFail?.testId ?? result.tests[0]?.testId ?? null);
      } catch (err) {
        setRunStatus('runtime_error');
        console.error(err);
      }
    }, 0);
  };

  const handleReset = () => {
    setSourceCode(challenge.buggyStarterCode);
    setReport(null);
    setRunStatus('idle');
    setActiveTestId(null);
    setRunCount(0);
  };

  const diagnostics = report ? diagnose(report) : [];
  const hasFailed = report?.status === 'failed' || report?.status === 'runtime_error';
  const hasRun = report !== null;

  const statusLabel: Record<RunStatus, string> = {
    idle: 'Ready',
    queued: 'Queued…',
    running: '⟳ Running…',
    passed: '✓ All tests passed',
    failed: '✗ Tests failed',
    runtime_error: '⚠ Runtime error',
    timeout: '⏱ Timeout',
    cancelled: 'Cancelled',
  };

  const statusClass: Record<RunStatus, string> = {
    idle: styles.statusIdle,
    queued: styles.statusRunning,
    running: styles.statusRunning,
    passed: styles.statusPassed,
    failed: styles.statusFailed,
    runtime_error: styles.statusError,
    timeout: styles.statusError,
    cancelled: styles.statusIdle,
  };

  return (
    <div className={styles.app}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logo}>⬡</span>
          <span className={styles.name}>TRACEFORGE</span>
          <span className={styles.tagline}>Evidence-First Debugging Lab</span>
        </div>
        <div className={styles.meta}>
          <span className={styles.subject}>DAA · Binary Search</span>
        </div>
      </header>

      {/* Challenge description */}
      <section className={styles.challengeBar}>
        <h2 className={styles.challengeTitle}>{challenge.title}</h2>
        <p className={styles.challengeDesc}>{challenge.description}</p>
      </section>

      {/* Main layout */}
      <main className={styles.main}>
        {/* Left column: editor + run controls */}
        <div className={styles.leftCol}>
          <CodeEditor
            value={sourceCode}
            onChange={setSourceCode}
            disabled={runStatus === 'running'}
          />

          <div className={styles.controls}>
            <div className={[styles.statusBadge, statusClass[runStatus]].join(' ')}>
              {statusLabel[runStatus]}
              {runCount > 0 && runStatus !== 'running' && (
                <span className={styles.runCount}> (run #{runCount})</span>
              )}
            </div>
            <div className={styles.buttons}>
              <button
                className={styles.runBtn}
                onClick={handleRun}
                disabled={runStatus === 'running'}
                aria-label="Run all test cases"
              >
                ▶ Run Tests
              </button>
              <button
                className={styles.resetBtn}
                onClick={handleReset}
                disabled={runStatus === 'running'}
                aria-label="Reset code to buggy starter"
              >
                ↺ Reset
              </button>
            </div>
          </div>

          {/* Run metadata */}
          {report && (
            <div className={styles.runMeta}>
              <span>Run ID: <code>{report.runId}</code></span>
              <span>Code hash: <code>{report.codeHash}</code></span>
              <span>At: <code>{report.createdAt}</code></span>
            </div>
          )}
        </div>

        {/* Right column: test results, trace, hints */}
        <div className={styles.rightCol}>
          <TestResultPanel
            testCases={challenge.testCases}
            results={report?.tests ?? []}
            activeTestId={activeTestId}
            onSelectTest={setActiveTestId}
          />

          <div className={styles.traceSection}>
            <TraceViewer
              trace={report?.trace ?? []}
              activeTestId={activeTestId}
            />
          </div>

          <div className={styles.hintSection}>
            <HintPanel
              diagnostics={diagnostics}
              hints={challenge.hints}
              hasRun={hasRun}
              hasFailed={hasFailed ?? false}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>
          TRACEFORGE — Phase 1 MVP · Browser-based JS execution (not a hardened sandbox) ·
          Passing these tests is evidence for the declared cases, not proof of universal correctness.
        </p>
      </footer>
    </div>
  );
}
