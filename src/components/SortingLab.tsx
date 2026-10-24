import { useState } from 'react';
import {
  sortWithTrace,
  type SortingAlgorithm,
  type SortingResult,
  type SortingTraceEvent,
} from '../engine/sorting';
import styles from './SortingLab.module.css';

const PRESETS: { name: string; value: string }[] = [
  { name: 'Custom input', value: '' },
  { name: 'Mixed values', value: '8, 3, 5, 3, -2, 9, 1' },
  { name: 'Already sorted', value: '-4, -1, 0, 3, 7, 12' },
  { name: 'Reverse sorted', value: '9, 6, 3, 0, -3' },
  { name: 'Duplicates', value: '4, 2, 4, 1, 2, 1' },
];

const ALGORITHMS: { value: SortingAlgorithm; label: string }[] = [
  { value: 'bubble', label: 'Bubble Sort' },
  { value: 'insertion', label: 'Insertion Sort' },
  { value: 'merge', label: 'Merge Sort' },
];

function parseNumbers(value: string): number[] {
  const trimmed = value.trim();
  if (!trimmed) return [];
  const segments = trimmed.split(',');
  if (segments.some((segment) => segment.trim().length === 0)) {
    throw new Error('Enter finite numbers separated by commas or spaces.');
  }
  const tokens = segments.flatMap((segment) => segment.trim().split(/\s+/));
  if (tokens.some((token) => !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(token))) {
    throw new Error('Enter finite numbers separated by commas or spaces.');
  }

  const numbers = tokens.map(Number);
  if (numbers.some((number) => !Number.isFinite(number))) {
    throw new Error('Every input value must be a finite number.');
  }
  return numbers;
}

function formatArray(values: number[]): string {
  return `[${values.join(', ')}]`;
}

function eventDescription(event: SortingTraceEvent): string {
  if (event.type === 'compare' && event.indices && event.values) {
    return `${event.message} Values: ${event.values.join(' and ')}.`;
  }
  if (event.type === 'swap' && event.indices) {
    return `${event.message} Indices: ${event.indices.join(', ')}.`;
  }
  if (event.type === 'write' && event.indices && event.values) {
    return `${event.message} Index ${event.indices[0]} = ${event.values[0]}.`;
  }
  if (event.type === 'merge' && event.range && event.values) {
    return `${event.message} Merged values: ${event.values.join(', ')}.`;
  }
  return event.message;
}

export function SortingLab() {
  const [algorithm, setAlgorithm] = useState<SortingAlgorithm>('bubble');
  const [input, setInput] = useState(PRESETS[1].value);
  const [result, setResult] = useState<SortingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearRun = () => {
    setResult(null);
    setError(null);
  };

  const handleRun = () => {
    try {
      setResult(sortWithTrace(algorithm, parseNumbers(input)));
      setError(null);
    } catch (runError) {
      setResult(null);
      setError(runError instanceof Error ? runError.message : String(runError));
    }
  };

  const handleReset = () => {
    setAlgorithm('bubble');
    setInput(PRESETS[1].value);
    clearRun();
  };

  const selectedAlgorithm = ALGORITHMS.find((item) => item.value === algorithm);

  return (
    <section className={styles.container} aria-labelledby="sorting-lab-title">
      <header className={styles.header}>
        <div>
          <h2 className={styles.title} id="sorting-lab-title">DAA — Sorting Algorithms Lab</h2>
          <p className={styles.description}>
            Compare three sorting strategies using traces produced by their actual execution.
          </p>
        </div>
      </header>

      <section className={styles.card} aria-labelledby="sorting-controls-title">
        <h3 className={styles.heading} id="sorting-controls-title">Run a sort</h3>
        <div className={styles.controls}>
          <label className={styles.field}>
            <span>Algorithm</span>
            <select
              value={algorithm}
              aria-label="Sorting algorithm"
              onChange={(event) => {
                setAlgorithm(event.target.value as SortingAlgorithm);
                clearRun();
              }}
            >
              {ALGORITHMS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label className={styles.field}>
            <span>Input preset</span>
            <select
              aria-label="Input preset"
              value={PRESETS.find((preset) => preset.value === input)?.value ?? ''}
              onChange={(event) => {
                setInput(event.target.value);
                clearRun();
              }}
            >
              {PRESETS.map((preset) => <option key={preset.name} value={preset.value}>{preset.name}</option>)}
            </select>
          </label>
          <label className={styles.field}>
            <span>Numbers (comma or space separated)</span>
            <input
              aria-label="Numeric input"
              type="text"
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                clearRun();
              }}
              placeholder="e.g. 8, 3, -2, 5"
            />
          </label>
          <div className={styles.buttons}>
            <button className={styles.runButton} onClick={handleRun}>▶ Run sort</button>
            <button className={styles.resetButton} onClick={handleReset}>↺ Reset</button>
          </div>
        </div>
        {error && <p className={styles.error} role="alert">{error}</p>}
        {result && (
          <p className={styles.complete} role="status">
            ✓ {selectedAlgorithm?.label} complete — {result.sorted.length} values sorted.
          </p>
        )}
      </section>

      {result && (
        <>
          <div className={styles.columns}>
            <section className={styles.card} aria-labelledby="array-comparison-title">
              <h3 className={styles.heading} id="array-comparison-title">Original vs. Sorted</h3>
              <div className={styles.arrayRow}>
                <span>Original</span>
                <code>{formatArray(result.original)}</code>
              </div>
              <div className={styles.arrayRow}>
                <span>Sorted</span>
                <code>{formatArray(result.sorted)}</code>
              </div>
            </section>
            <section className={styles.card} aria-labelledby="operation-counts-title">
              <h3 className={styles.heading} id="operation-counts-title">Observed operation counts</h3>
              <dl className={styles.metrics}>
                <div><dt>Comparisons</dt><dd>{result.comparisons}</dd></div>
                <div><dt>Swaps</dt><dd>{result.swaps}</dd></div>
                <div><dt>Writes</dt><dd>{result.writes}</dd></div>
              </dl>
              <p className={styles.note}>
                Counts are empirical for this input and this implementation; they are not Big-O guarantees.
              </p>
            </section>
          </div>

          <section className={styles.card} aria-labelledby="complexity-title">
            <h3 className={styles.heading} id="complexity-title">Theoretical time complexity</h3>
            <dl className={styles.complexities}>
              <div><dt>Best</dt><dd>{result.complexity.best}</dd></div>
              <div><dt>Average</dt><dd>{result.complexity.average}</dd></div>
              <div><dt>Worst</dt><dd>{result.complexity.worst}</dd></div>
            </dl>
            <p className={styles.note}>
              These are theoretical bounds for the algorithm. The trace and counters below record actual operations for the selected input.
            </p>
          </section>

          <section className={styles.card} aria-labelledby="sorting-trace-title">
            <h3 className={styles.heading} id="sorting-trace-title">
              Execution trace — {selectedAlgorithm?.label} ({result.trace.length} steps)
            </h3>
            <div className={styles.traceWrap}>
              <table className={styles.traceTable}>
                <thead>
                  <tr>
                    <th>Step</th>
                    <th>Event</th>
                    <th>Operation evidence</th>
                    <th>Array state</th>
                    <th>Counts (C/S/W)</th>
                  </tr>
                </thead>
                <tbody>
                  {result.trace.map((event) => (
                    <tr key={event.step}>
                      <td>{event.step}</td>
                      <td>{event.type}</td>
                      <td>{eventDescription(event)}</td>
                      <td><code>{formatArray(event.arrayState)}</code></td>
                      <td>{event.comparisons}/{event.swaps}/{event.writes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </section>
  );
}
