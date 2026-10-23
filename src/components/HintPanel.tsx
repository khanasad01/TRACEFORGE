import { useState } from 'react';
import type { DiagnosticResult } from '../types/domain';
import styles from './HintPanel.module.css';

interface Props {
  diagnostics: DiagnosticResult[];
  hints: Array<{ level: 1 | 2 | 3 | 4; text: string; evidenceRefs: string[] }>;
  hasRun: boolean;
  hasFailed: boolean;
}

const CONFIDENCE_LABEL: Record<DiagnosticResult['confidence'], string> = {
  observed: 'Observed fact',
  inferred: 'Inferred cause',
  hypothesis: 'Hypothesis',
};

const CONFIDENCE_CLASS: Record<DiagnosticResult['confidence'], string> = {
  observed: styles.observed,
  inferred: styles.inferred,
  hypothesis: styles.hypothesis,
};

export function HintPanel({ diagnostics, hints, hasRun, hasFailed }: Props) {
  const [revealedLevel, setRevealedLevel] = useState<number>(0);

  if (!hasRun) {
    return (
      <div className={styles.panel}>
        <h3 className={styles.heading}>Diagnostics &amp; Hints</h3>
        <p className={styles.empty}>Run the tests first to see diagnostics.</p>
      </div>
    );
  }

  if (!hasFailed) {
    return (
      <div className={styles.panel}>
        <h3 className={styles.heading}>Diagnostics &amp; Hints</h3>
        <div className={styles.success}>
          <span className={styles.successIcon}>🎉</span>
          <div>
            <strong>All tests passed!</strong>
            <p>
              Your implementation handles all declared test cases. Remember: a
              finite test suite passing is evidence for those specific cases — it
              is not a proof of universal correctness.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const visibleHints = hints.filter((h) => h.level <= revealedLevel);

  return (
    <div className={styles.panel}>
      <h3 className={styles.heading}>Diagnostics</h3>

      {/* Diagnostics from rule engine */}
      <div className={styles.diagnosticsList}>
        {diagnostics.map((d) => (
          <div key={d.ruleId} className={[styles.diagnostic, CONFIDENCE_CLASS[d.confidence]].join(' ')}>
            <span className={styles.confidenceTag}>{CONFIDENCE_LABEL[d.confidence]}</span>
            <p className={styles.statement}>{d.statement}</p>
            {d.evidenceRefs.length > 0 && (
              <p className={styles.refs}>
                Evidence: {d.evidenceRefs.map((r) => <code key={r}>{r}</code>).reduce<React.ReactNode[]>((a, el, i) => i === 0 ? [el] : [...a, ', ', el], [])}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Progressive hints */}
      <div className={styles.hintsSection}>
        <h4 className={styles.hintsHeading}>Hints</h4>
        <p className={styles.hintsNote}>
          Hints reveal progressively. Try to fix the bug before requesting the next hint.
        </p>

        {visibleHints.map((h) => (
          <div key={h.level} className={styles.hint}>
            <span className={styles.hintLevel}>Hint {h.level}</span>
            <p>{h.text}</p>
          </div>
        ))}

        {revealedLevel < hints.length ? (
          <button
            className={styles.hintBtn}
            onClick={() => setRevealedLevel((l) => Math.min(l + 1, hints.length))}
          >
            {revealedLevel === 0 ? 'Show first hint' : `Show hint ${revealedLevel + 1}`}
          </button>
        ) : (
          <p className={styles.hintsExhausted}>All hints revealed.</p>
        )}
      </div>
    </div>
  );
}
