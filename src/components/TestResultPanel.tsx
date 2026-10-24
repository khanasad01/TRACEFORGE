import type { TestCase, TestResult } from '../types/domain';
import styles from './TestResultPanel.module.css';

interface Props {
  testCases: TestCase[];
  results: TestResult[];
  activeTestId: string | null;
  onSelectTest: (id: string) => void;
}

const STATUS_LABEL: Record<TestResult['status'], string> = {
  passed: '✓ Passed',
  failed: '✗ Failed',
  error: '⚠ Error',
  timeout: '⏱ Limit reached',
  skipped: '— Skipped',
};

const STATUS_CLASS: Record<TestResult['status'], string> = {
  passed: styles.passed,
  failed: styles.failed,
  error: styles.error,
  timeout: styles.error,
  skipped: styles.skipped,
};

export function TestResultPanel({ testCases, results, activeTestId, onSelectTest }: Props) {
  const resultMap = new Map(results.map((r) => [r.testId, r]));

  return (
    <div className={styles.panel}>
      <h3 className={styles.heading}>Test Cases</h3>
      <p className={styles.note}>
        {results.length === 0
          ? 'Run the tests to see results.'
          : `${results.filter((r) => r.status === 'passed').length} / ${results.length} passed`}
      </p>
      <ul className={styles.list} role="list">
        {testCases.map((tc) => {
          const result = resultMap.get(tc.id);
          const isActive = tc.id === activeTestId;
          return (
            <li
              key={tc.id}
              className={[
                styles.item,
                result ? STATUS_CLASS[result.status] : styles.notRun,
                isActive ? styles.active : '',
              ].join(' ')}
              onClick={() => onSelectTest(tc.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSelectTest(tc.id)}
              aria-pressed={isActive}
            >
              <span className={styles.statusBadge}>
                {result ? STATUS_LABEL[result.status] : '· Not run'}
              </span>
              <span className={styles.testName}>{tc.description}</span>
              {result?.status === 'failed' && (
                <span className={styles.values}>
                  Expected <code>{String(result.expected)}</code>, got{' '}
                  <code>{String(result.actual)}</code>
                </span>
              )}
              {result?.message && (
                <span className={styles.message}>{result.message}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
