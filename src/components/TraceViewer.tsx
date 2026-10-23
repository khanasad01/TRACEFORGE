import type { TraceEvent } from '../types/domain';
import styles from './TraceViewer.module.css';

interface Props {
  trace: TraceEvent[];
  activeTestId: string | null;
}

const EVENT_LABELS: Record<TraceEvent['event'], string> = {
  init: 'Initialize',
  loop_condition: 'Loop condition',
  mid_computed: 'Compute mid',
  comparison: 'Compare',
  move_low: 'Move low →',
  move_high: '← Move high',
  found: '✓ Found',
  not_found: '✗ Not found',
};

const EVENT_CLASS: Partial<Record<TraceEvent['event'], string>> = {
  found: styles.found,
  not_found: styles.notFound,
  move_low: styles.move,
  move_high: styles.move,
};

function formatVars(vars: Record<string, unknown>): string {
  return Object.entries(vars)
    .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
    .join('  ');
}

export function TraceViewer({ trace, activeTestId }: Props) {
  const filtered = activeTestId
    ? trace.filter((e) => !e.evidenceRef || e.evidenceRef === activeTestId)
    : trace;

  if (filtered.length === 0) {
    return (
      <div className={styles.empty}>
        {activeTestId
          ? 'No trace events for this test case.'
          : 'Run the tests to see the execution trace.'}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.heading}>Execution Trace</h3>
      {activeTestId && (
        <p className={styles.subtitle}>
          Showing actual execution trace for: <code>{activeTestId}</code>
        </p>
      )}
      <p className={styles.note}>
        This trace reflects your submitted implementation's step-by-step
        execution path on this test case. Inspect loop conditions, variable updates,
        and comparisons to locate where the logic diverges.
      </p>
      <div className={styles.tableWrap}>
        <table className={styles.table} aria-label="Execution trace">
          <thead>
            <tr>
              <th>Step</th>
              <th>Event</th>
              <th>Variables &amp; Notes</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((ev) => (
              <tr
                key={`${ev.evidenceRef ?? ''}-${ev.step}`}
                className={EVENT_CLASS[ev.event] ?? ''}
              >
                <td className={styles.step}>{ev.step}</td>
                <td className={styles.event}>{EVENT_LABELS[ev.event]}</td>
                <td className={styles.vars}>
                  <code>{formatVars(ev.variables)}</code>
                  {ev.note && <span className={styles.note2}> ← {ev.note}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
