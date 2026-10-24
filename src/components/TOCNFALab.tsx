import { useState } from 'react';
import {
  compileRegularExpression,
  simulateNFA,
  type NFADefinition,
  type NFASimulationResult,
} from '../engine/tocNFA';
import styles from './TOCNFALab.module.css';

const PRESETS = [
  { label: 'Strings ending in 01', expression: '(0|1)*01', input: '1101' },
  { label: 'Strings with at least one 1', expression: '(0|1)*1(0|1)*', input: '00100' },
  { label: 'a* followed by b', expression: 'a*b', input: 'aaab' },
  { label: 'Empty string or ab', expression: 'ε|ab', input: 'ab' },
];

export function TOCNFALab() {
  const [expression, setExpression] = useState(PRESETS[0].expression);
  const [input, setInput] = useState(PRESETS[0].input);
  const [nfa, setNfa] = useState<NFADefinition | null>(null);
  const [result, setResult] = useState<NFASimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = (regex = expression, testInput = input) => {
    try {
      const compiledNFA = compileRegularExpression(regex);
      setNfa(compiledNFA);
      setResult(simulateNFA(compiledNFA, testInput));
      setError(null);
    } catch (compileError) {
      setNfa(null);
      setResult(null);
      setError(compileError instanceof Error ? compileError.message : String(compileError));
    }
  };

  const reset = () => {
    setExpression(PRESETS[0].expression);
    setInput(PRESETS[0].input);
    setNfa(null);
    setResult(null);
    setError(null);
  };

  return (
    <section className={styles.container} aria-labelledby="nfa-lab-title">
      <header className={styles.header}>
        <div>
          <h2 className={styles.title} id="nfa-lab-title">TOC — NFA &amp; Regular Expressions</h2>
          <p className={styles.description}>
            Compile the documented regular-expression subset into a Thompson epsilon-NFA, then simulate its state-set transitions.
          </p>
        </div>
      </header>

      <div className={styles.columns}>
        <section className={styles.card} aria-labelledby="regex-controls-title">
          <h3 className={styles.heading} id="regex-controls-title">Regular expression</h3>
          <label className={styles.field}>
            <span>Preset</span>
            <select
              aria-label="Regular expression preset"
              value={PRESETS.some((preset) => preset.expression === expression) ? expression : ''}
              onChange={(event) => {
                const selected = PRESETS.find((preset) => preset.expression === event.target.value);
                if (selected) {
                  setExpression(selected.expression);
                  setInput(selected.input);
                  setResult(null);
                  setNfa(null);
                  setError(null);
                }
              }}
            >
              <option value="">Custom expression</option>
              {PRESETS.map((preset) => (
                <option key={preset.expression} value={preset.expression}>{preset.label}</option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>Expression</span>
            <input
              aria-label="Regular expression"
              value={expression}
              onChange={(event) => {
                setExpression(event.target.value);
                setResult(null);
                setNfa(null);
                setError(null);
              }}
            />
          </label>
          <label className={styles.field}>
            <span>Input string</span>
            <input
              aria-label="NFA input string"
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                setResult(null);
              }}
            />
          </label>
          <div className={styles.buttons}>
            <button className={styles.runButton} onClick={() => run()}>▶ Compile &amp; simulate</button>
            <button className={styles.resetButton} onClick={reset}>↺ Reset</button>
          </div>
          <p className={styles.syntax}>
            Supported: single-character literals, implicit concatenation, union <code>|</code>,
            Kleene star <code>*</code>, parentheses, and epsilon <code>ε</code>. No escaping,
            character classes, or <code>+</code>/<code>?</code> quantifiers. Whitespace is not allowed.
          </p>
          {error && <p className={styles.error} role="alert">{error}</p>}
          {result && (
            <p className={result.error ? styles.error : result.accepted ? styles.accepted : styles.rejected} role="status">
              {result.error
                ? `Input error: ${result.error}`
                : result.accepted
                  ? `✓ ACCEPTED — "${result.inputString}" matches the expression.`
                  : `✗ REJECTED — "${result.inputString}" does not match the expression.`}
            </p>
          )}
        </section>

        <section className={styles.card} aria-labelledby="regex-learning-title">
          <h3 className={styles.heading} id="regex-learning-title">How to read the subset</h3>
          <ul className={styles.syntaxList}>
            <li><code>ab</code> concatenates symbols: match <code>a</code>, then <code>b</code>.</li>
            <li><code>a|b</code> is union: match either alternative.</li>
            <li><code>a*</code> matches zero or more repetitions, including the empty string.</li>
            <li><code>(a|b)*</code> groups alternatives before repetition.</li>
            <li><code>ε</code> denotes exactly the empty string.</li>
          </ul>
          <p className={styles.note}>
            This is an explicit educational subset, not JavaScript regular-expression syntax. Compilation uses Thompson construction; simulation tracks the epsilon-closed set of active states.
          </p>
        </section>
      </div>

      {nfa && result && (
        <>
          <section className={styles.card} aria-labelledby="compiled-nfa-title">
            <h3 className={styles.heading} id="compiled-nfa-title">Compiled epsilon-NFA</h3>
            <p className={styles.note}>
              States: <code>{nfa.states.join(', ')}</code> · Alphabet: <code>{nfa.alphabet.length ? nfa.alphabet.join(', ') : '(empty)'}</code>
              {' '}· Start: <code>{nfa.startState}</code> · Accept: <code>{nfa.acceptStates.join(', ')}</code>
            </p>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead><tr><th>From</th><th>Symbol</th><th>To</th></tr></thead>
                <tbody>
                  {nfa.transitions.map((transition, index) => (
                    <tr key={`${transition.fromState}-${transition.toState}-${index}`}>
                      <td><code>{transition.fromState}</code></td>
                      <td>{transition.symbol === null ? 'ε' : <code>{transition.symbol}</code>}</td>
                      <td><code>{transition.toState}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className={styles.card} aria-labelledby="nfa-trace-title">
            <h3 className={styles.heading} id="nfa-trace-title">Execution trace</h3>
            <p className={styles.note}>
              Initial epsilon-closure: <code>{result.initialStates.join(', ') || '∅'}</code>
              {' '}· Final active states: <code>{result.finalStates.join(', ') || '∅'}</code>
            </p>
            {result.trace.length > 0 ? (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr><th>Step</th><th>Symbol</th><th>Active before</th><th>Moved on symbol</th><th>After epsilon-closure</th><th>Accept state active?</th></tr>
                  </thead>
                  <tbody>
                    {result.trace.map((step) => (
                      <tr key={step.step}>
                        <td>{step.step}</td>
                        <td><code>{step.symbol}</code></td>
                        <td>{step.activeStatesBefore.join(', ') || '∅'}</td>
                        <td>{step.movedStates.join(', ') || '∅'}</td>
                        <td>{step.activeStatesAfter.join(', ') || '∅'}</td>
                        <td>{step.acceptedSoFar ? 'Yes' : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className={styles.note}>No input symbols were consumed; acceptance is determined by the initial epsilon-closure.</p>
            )}
          </section>
        </>
      )}
    </section>
  );
}
