import { useState } from 'react';
import { ANBN_PDA, simulatePDA, type PDASimulationResult } from '../engine/tocPDA';
import styles from './TOCPDALab.module.css';

const PRESETS = ['ab', 'aabb', 'aaabbb', 'aabbb', 'ba'];

export function TOCPDALab() {
  const [input, setInput] = useState('aaabbb');
  const [result, setResult] = useState<PDASimulationResult | null>(null);

  const run = (value = input) => setResult(simulatePDA(ANBN_PDA, value));
  const reset = () => {
    setInput('aaabbb');
    setResult(null);
  };

  return (
    <section className={styles.container} aria-labelledby="pda-lab-title">
      <header className={styles.header}>
        <div>
          <h2 className={styles.title} id="pda-lab-title">TOC — Pushdown Automaton</h2>
          <p className={styles.description}>
            Explore a nondeterministic PDA using a stack to recognize equal-length a-prefixes and b-suffixes.
          </p>
        </div>
      </header>

      <div className={styles.columns}>
        <section className={styles.card} aria-labelledby="pda-definition-title">
          <h3 className={styles.heading} id="pda-definition-title">{ANBN_PDA.name}</h3>
          <p className={styles.note}>{ANBN_PDA.description}</p>
          <p className={styles.note}>
            Start state: <code>{ANBN_PDA.startState}</code> · Initial stack: <code>{ANBN_PDA.startStackSymbol}</code>
            {' '}· Accept state: <code>{ANBN_PDA.acceptStates.join(', ')}</code>
          </p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Rule</th><th>State</th><th>Input</th><th>Stack top</th><th>Next state / push</th></tr></thead>
              <tbody>
                {ANBN_PDA.transitions.map((transition) => (
                  <tr key={transition.id}>
                    <td><code>{transition.id}</code></td>
                    <td>{transition.fromState}</td>
                    <td>{transition.inputSymbol ?? 'ε'}</td>
                    <td>{transition.stackTop}</td>
                    <td>{transition.toState} / {transition.pushSymbols.join('') || 'ε'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.card} aria-labelledby="pda-controls-title">
          <h3 className={styles.heading} id="pda-controls-title">Simulate input</h3>
          <label className={styles.field}>
            <span>Input string over {`{${ANBN_PDA.inputAlphabet.join(', ')}}`}</span>
            <input
              aria-label="PDA input string"
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                setResult(null);
              }}
            />
          </label>
          <div className={styles.presets}>
            <span>Presets:</span>
            {PRESETS.map((preset) => (
              <button key={preset} className={styles.presetButton} onClick={() => {
                setInput(preset);
                run(preset);
              }}>
                {preset}
              </button>
            ))}
          </div>
          <div className={styles.buttons}>
            <button className={styles.runButton} onClick={() => run()}>▶ Run PDA</button>
            <button className={styles.resetButton} onClick={reset}>↺ Reset</button>
          </div>
          {result ? (
            result.error ? (
              <p className={styles.error} role="alert">{result.error}</p>
            ) : (
              <p className={result.accepted ? styles.accepted : styles.rejected} role="status">
                {result.status === 'limit'
                  ? `⏱ Simulation limit — ${result.error}`
                  : result.accepted
                    ? `✓ ACCEPTED — "${result.input}" reached a final state after consuming all input.`
                    : `✗ REJECTED — no accepting configuration remains for "${result.input}".`}
              </p>
            )
          ) : (
            <p className={styles.empty} role="status">Run the PDA to inspect its state, input, and stack transitions.</p>
          )}
          <p className={styles.note}>
            This simulator explores nondeterministic configurations breadth-first and accepts by final state after all input is consumed.
          </p>
        </section>
      </div>

      {result && (
        <section className={styles.card} aria-labelledby="pda-trace-title">
          <h3 className={styles.heading} id="pda-trace-title">Configuration trace ({result.trace.length} events)</h3>
          {result.trace.length > 0 ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr><th>Step</th><th>Event / Rule</th><th>State</th><th>Input index / next symbol</th><th>Stack before</th><th>Enabled / result</th></tr>
                </thead>
                <tbody>
                  {result.trace.slice(0, 500).map((step) => (
                    <tr key={step.step}>
                      <td>{step.step}</td>
                      <td>{step.kind}{step.transitionId && <> · <code>{step.transitionId}</code></>}</td>
                      <td>{step.state}</td>
                      <td>{step.inputIndex} / {step.inputSymbol ?? 'end'}</td>
                      <td>{step.stackBefore.join(' ') || '∅'}</td>
                      <td>{step.enabled === undefined
                        ? step.kind === 'accept' ? 'Accepted' : 'No transition'
                        : step.enabled
                          ? `Yes → ${step.nextState}, input ${step.nextInputIndex}, stack ${step.stackAfter?.join(' ') || '∅'}${step.alreadyVisited ? ' (seen)' : ''}`
                          : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={styles.note}>No configuration transitions were evaluated for this input.</p>
          )}
          {result.trace.length > 500 && <p className={styles.note}>Showing first 500 trace events.</p>}
        </section>
      )}
    </section>
  );
}
