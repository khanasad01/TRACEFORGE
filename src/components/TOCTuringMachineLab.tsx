import { useState } from 'react';
import { runTuringMachine, UNARY_INCREMENT_TM, type TMSimulationResult } from '../engine/tocTM';
import styles from './TOCTuringMachineLab.module.css';

export function TOCTuringMachineLab() {
  const [input, setInput] = useState('111');
  const [result, setResult] = useState<TMSimulationResult | null>(null);

  const run = () => setResult(runTuringMachine(UNARY_INCREMENT_TM, input));
  const reset = () => {
    setInput('111');
    setResult(null);
  };

  return (
    <section className={styles.container} aria-labelledby="tm-lab-title">
      <header className={styles.header}>
        <div>
          <h2 className={styles.title} id="tm-lab-title">TOC — Simplified Turing Machine</h2>
          <p className={styles.description}>
            Follow a deterministic single-tape machine that increments a unary number by one.
          </p>
        </div>
      </header>

      <div className={styles.columns}>
        <section className={styles.card} aria-labelledby="tm-definition-title">
          <h3 className={styles.heading} id="tm-definition-title">{UNARY_INCREMENT_TM.name}</h3>
          <p className={styles.note}>{UNARY_INCREMENT_TM.description}</p>
          <p className={styles.note}>
            Start: <code>{UNARY_INCREMENT_TM.startState}</code> · Halt: <code>{UNARY_INCREMENT_TM.haltStates.join(', ')}</code>
            {' '}· Blank: <code>{UNARY_INCREMENT_TM.blankSymbol}</code>
          </p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Rule</th><th>State</th><th>Read</th><th>Write</th><th>Move</th><th>Next state</th></tr></thead>
              <tbody>
                {UNARY_INCREMENT_TM.transitions.map((transition) => (
                  <tr key={transition.id}>
                    <td><code>{transition.id}</code></td><td>{transition.state}</td><td><code>{transition.readSymbol}</code></td>
                    <td><code>{transition.writeSymbol}</code></td><td>{transition.move}</td><td>{transition.nextState}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.card} aria-labelledby="tm-controls-title">
          <h3 className={styles.heading} id="tm-controls-title">Run the machine</h3>
          <label className={styles.field}>
            <span>Unary input (one or more `1` symbols, or empty)</span>
            <input
              aria-label="Unary input"
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                setResult(null);
              }}
            />
          </label>
          <div className={styles.buttons}>
            <button className={styles.runButton} onClick={run}>▶ Run machine</button>
            <button className={styles.resetButton} onClick={reset}>↺ Reset</button>
          </div>
          {result ? (
            result.status === 'invalid_input' ? (
              <p className={styles.error} role="alert">{result.error}</p>
            ) : (
              <p className={result.status === 'halted' ? styles.accepted : styles.error} role="status">
                {result.status === 'halted'
                  ? `✓ HALTED — output ${result.output || '(empty tape)'}`
                  : `${result.status === 'stuck' ? '⚠ STUCK' : '⏱ STEP LIMIT'} — ${result.error}`}
              </p>
            )
          ) : (
            <p className={styles.empty} role="status">Run the machine to see each read, write, head move, and state transition.</p>
          )}
          <p className={styles.note}>
            This is a simplified deterministic single-tape model, not a hardware simulator. Execution is bounded to 500 steps.
          </p>
        </section>
      </div>

      {result && result.trace.length > 0 && (
        <section className={styles.card} aria-labelledby="tm-trace-title">
          <h3 className={styles.heading} id="tm-trace-title">Tape execution trace ({result.trace.length} steps)</h3>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr><th>Step</th><th>Rule</th><th>State</th><th>Head</th><th>Read</th><th>Write</th><th>Move</th><th>Next state / head</th><th>Tape after step (head marked ▶)</th></tr>
              </thead>
              <tbody>
                {result.trace.map((step) => (
                  <tr key={step.step}>
                    <td>{step.step}</td>
                    <td><code>{step.transitionId}</code></td>
                    <td>{step.stateBefore}</td>
                    <td>{step.headBefore}</td>
                    <td><code>{step.readSymbol}</code></td>
                    <td><code>{step.writeSymbol}</code></td>
                    <td>{step.move}</td>
                    <td>{step.stateAfter} / {step.headAfter}</td>
                    <td className={styles.tape}>
                      {step.tapeSnapshot.map((symbol, index) => {
                        const position = step.tapeStart + index;
                        return (
                          <span key={position} className={position === step.headAfter ? styles.headCell : styles.tapeCell}>
                            {position === step.headAfter ? '▶' : ''}{symbol}
                          </span>
                        );
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </section>
  );
}
