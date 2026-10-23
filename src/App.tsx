import { useState } from 'react';
import type { EvidenceReport, RunStatus } from './types/domain';
import { binarySearchChallenge } from './challenges/binarySearch/challenge';
import { runChallenge, generateRunId } from './engine/runController';
import { diagnose } from './diagnostics/engine';
import { compareSearchOperations, type ComparisonMetrics } from './engine/daaComparison';
import { CodeEditor } from './components/CodeEditor';
import { TestResultPanel } from './components/TestResultPanel';
import { TraceViewer } from './components/TraceViewer';
import { HintPanel } from './components/HintPanel';
import { AISearchLab } from './components/AISearchLab';
import { TicTacToeLab } from './components/TicTacToeLab';
import { TOCAutomataLab } from './components/TOCAutomataLab';
import { TinyCPULab } from './components/TinyCPULab';
import styles from './App.module.css';

export type SubjectModule = 'daa' | 'ai' | 'toc' | 'coa';

const challenge = binarySearchChallenge;

export function App() {
  const [activeModule, setActiveModule] = useState<SubjectModule>('daa');

  // DAA Binary Search Lab State
  const [sourceCode, setSourceCode] = useState(challenge.buggyStarterCode);
  const [runStatus, setRunStatus] = useState<RunStatus>('idle');
  const [report, setReport] = useState<EvidenceReport | null>(null);
  const [activeTestId, setActiveTestId] = useState<string | null>(null);
  const [runCount, setRunCount] = useState(0);
  const [daaMetrics, setDaaMetrics] = useState<ComparisonMetrics | null>(null);

  const handleRun = () => {
    setRunStatus('running');
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

        const firstFail = result.tests.find(
          (t) => t.status === 'failed' || t.status === 'error',
        );
        setActiveTestId(firstFail?.testId ?? result.tests[0]?.testId ?? null);

        // Update DAA complexity comparison
        const sampleArray = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31];
        setDaaMetrics(compareSearchOperations(sampleArray, 31));
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
    setDaaMetrics(null);
  };

  const handleExportEvidence = () => {
    if (!report) return;

    const exportData = {
      exportedAt: new Date().toISOString(),
      challengeId: report.challengeId,
      challengeTitle: challenge.title,
      runId: report.runId,
      status: report.status,
      codeHash: report.codeHash,
      tests: report.tests,
      trace: report.trace,
      diagnostics: diagnose(report),
      sourceCode,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `traceforge-evidence-${report.runId}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
      {/* Platform Header */}
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logo}>⬡</span>
          <span className={styles.name}>TRACEFORGE</span>
          <span className={styles.tagline}>Evidence-First CS Learning &amp; Debugging Lab</span>
        </div>
        <div className={styles.moduleNav} role="tablist" aria-label="Academic Subject Labs">
          <button
            role="tab"
            aria-selected={activeModule === 'daa'}
            className={[styles.navTab, activeModule === 'daa' ? styles.activeTab : ''].join(' ')}
            onClick={() => setActiveModule('daa')}
          >
            DAA · Search &amp; Complexity
          </button>
          <button
            role="tab"
            aria-selected={activeModule === 'ai'}
            className={[styles.navTab, activeModule === 'ai' ? styles.activeTab : ''].join(' ')}
            onClick={() => setActiveModule('ai')}
          >
            AI · State Space Search
          </button>
          <button
            role="tab"
            aria-selected={activeModule === 'toc'}
            className={[styles.navTab, activeModule === 'toc' ? styles.activeTab : ''].join(' ')}
            onClick={() => setActiveModule('toc')}
          >
            TOC · Automata Lab
          </button>
          <button
            role="tab"
            aria-selected={activeModule === 'coa'}
            className={[styles.navTab, activeModule === 'coa' ? styles.activeTab : ''].join(' ')}
            onClick={() => setActiveModule('coa')}
          >
            COA · TinyCPU Lab
          </button>
        </div>
      </header>

      {/* Main Body per Active Subject */}
      {activeModule === 'daa' && (
        <>
          <section className={styles.challengeBar}>
            <div className={styles.challengeMetaRow}>
              <h2 className={styles.challengeTitle}>{challenge.title}</h2>
              <span className={styles.subjectTag}>DAA · Divide &amp; Conquer</span>
            </div>
            <p className={styles.challengeDesc}>{challenge.description}</p>
          </section>

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

              {/* Algorithmic Complexity Comparison Card */}
              {daaMetrics && (
                <div className={styles.complexityCard}>
                  <h4 className={styles.complexityHeading}>Empirical vs Theoretical Complexity (N = {daaMetrics.arrayLength})</h4>
                  <div className={styles.metricGrid}>
                    <div className={styles.metricBox}>
                      <span className={styles.metricLabel}>Binary Search Steps:</span>
                      <strong>{daaMetrics.binaryOperations}</strong>
                      <small>Theoretical: {daaMetrics.theoreticalBinary}</small>
                    </div>
                    <div className={styles.metricBox}>
                      <span className={styles.metricLabel}>Linear Search Steps:</span>
                      <strong>{daaMetrics.linearOperations}</strong>
                      <small>Theoretical: {daaMetrics.theoreticalLinear}</small>
                    </div>
                  </div>
                  <p className={styles.complexityNote}>
                    Measured step counts show binary search dividing the remaining space in half each iteration (\(O(\log N)\)), whereas linear search examines elements sequentially (\(O(N)\)).
                  </p>
                </div>
              )}

              {/* Run metadata */}
              {report && (
                <div className={styles.runMeta}>
                  <span>Run ID: <code>{report.runId}</code></span>
                  <span>Code hash: <code>{report.codeHash}</code></span>
                  <span>At: <code>{report.createdAt}</code></span>
                  <button
                    className={styles.exportBtn}
                    onClick={handleExportEvidence}
                    aria-label="Export evidence report as JSON"
                    title="Download this run's evidence as a JSON file"
                  >
                    ↓ Export Evidence
                  </button>
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
        </>
      )}

      {activeModule === 'ai' && (
        <main className={styles.standaloneMain}>
          <div style={{ marginBottom: '1.5rem' }}>
            <AISearchLab />
          </div>
          <div>
            <TicTacToeLab />
          </div>
        </main>
      )}

      {activeModule === 'toc' && (
        <main className={styles.standaloneMain}>
          <TOCAutomataLab />
        </main>
      )}

      {activeModule === 'coa' && (
        <main className={styles.standaloneMain}>
          <TinyCPULab />
        </main>
      )}

      {/* Footer */}
      <footer className={styles.footer}>
        <p>
          TRACEFORGE — Integrated CS Learning Platform · Covering AI Foundations, DAA, TOC, and COA ·
          Deterministic evidence-first execution across all subject engines.
        </p>
      </footer>
    </div>
  );
}
