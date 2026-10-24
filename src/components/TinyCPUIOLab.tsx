import { useState } from 'react';
import {
  assembleProgram,
  runTinyCPU,
  type CPUExecutionResult,
} from '../engine/tinyCPU';
import styles from './TinyCPULab.module.css';

const defaultProgram = `IN R0
IN R1
ADD R0, R1
OUT R0
HALT`;
const defaultInputs = '12, 7';

function parseInputValues(raw: string): number[] {
  if (!raw.trim()) return [];
  return raw.split(/[,\s]+/).map((token) => {
    const value = Number(token);
    if (!Number.isInteger(value) || value < 0 || value > 255) {
      throw new Error(`Input values must be whole numbers from 0 to 255; received "${token}".`);
    }
    return value;
  });
}

export function TinyCPUIOLab() {
  const [program, setProgram] = useState(defaultProgram);
  const [inputs, setInputs] = useState(defaultInputs);
  const [result, setResult] = useState<CPUExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRun = () => {
    try {
      const values = parseInputValues(inputs);
      const instructions = assembleProgram(program);
      setResult(runTinyCPU(instructions, undefined, 100, values));
      setError(null);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleReset = () => {
    setProgram(defaultProgram);
    setInputs(defaultInputs);
    setResult(null);
    setError(null);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>TinyCPU Interactive I/O Experiment</h2>
          <p className={styles.desc}>
            Feed byte values through the input queue with <code>IN Rd</code>, operate on them
            with the TinyCPU ISA, and collect values using <code>OUT Rs</code>. The example
            reads two values, adds them, and writes the sum.
          </p>
        </div>
      </header>

      <div className={styles.mainGrid}>
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardHeading}>Program and input stream</h3>
            <div className={styles.btnRow}>
              <button className={styles.runBtn} onClick={handleRun} aria-label="Run I/O experiment">
                ▶ Run
              </button>
              <button className={styles.resetBtn} onClick={handleReset} aria-label="Reset I/O experiment">
                ↺ Reset
              </button>
            </div>
          </div>
          <label htmlFor="coa-io-input">Input bytes (comma or space separated)</label>
          <input
            id="coa-io-input"
            aria-label="Input bytes"
            className={styles.editor}
            value={inputs}
            onChange={(event) => setInputs(event.target.value)}
          />
          <label htmlFor="coa-io-program">Assembly program</label>
          <textarea
            id="coa-io-program"
            aria-label="I/O assembly program"
            className={styles.editor}
            value={program}
            onChange={(event) => setProgram(event.target.value)}
            rows={8}
            spellCheck={false}
          />
          {error && <div className={styles.errorBox} role="alert">⚠ {error}</div>}
          <p className={styles.isaCheatSheet}>
            I/O values are unsigned bytes (0–255). Running out of input stops with an explicit
            execution error; unread input values are permitted.
          </p>
        </section>

        <section className={styles.card}>
          <h3 className={styles.cardHeading}>Input / output evidence</h3>
          {result ? (
            <>
              {result.error && <div className={styles.errorBox} role="alert">⚠ {result.error}</div>}
              <div className={styles.statusRow}>
                <div>Status: <strong>{result.haltedNormally ? 'Halted normally' : result.error ? 'Input error' : 'Stopped'}</strong></div>
                <div>Cycles: <strong>{result.stepsExecuted}</strong></div>
              </div>
              <h4 className={styles.subHeading}>Input queue</h4>
              <p>{result.inputValues.length ? result.inputValues.join(', ') : 'No values supplied'}</p>
              <h4 className={styles.subHeading}>Output stream</h4>
              <p aria-label="Output values">
                {result.outputValues.length ? result.outputValues.join(', ') : 'No output written'}
              </p>
              <h4 className={styles.subHeading}>Final registers</h4>
              <div className={styles.regGrid}>
                {Object.entries(result.finalState.registers).map(([register, value]) => (
                  <div key={register} className={styles.regBox}>
                    <span className={styles.regName}>{register.toUpperCase()}</span>
                    <span className={styles.regVal}>{value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className={styles.emptyPrompt}>Run the program to see its actual input, output, and CPU trace.</p>
          )}
        </section>
      </div>

      {result && (
        <section className={styles.card}>
          <h3 className={styles.cardHeading}>Instruction I/O trace</h3>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr><th>Cycle</th><th>Instruction</th><th>Effect</th><th>Output so far</th></tr>
              </thead>
              <tbody>
                {result.trace.map((step) => (
                  <tr key={step.cycle}>
                    <td>{step.cycle}</td>
                    <td>{step.instruction}</td>
                    <td>{step.note}</td>
                    <td>{step.outputValues.join(', ') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
