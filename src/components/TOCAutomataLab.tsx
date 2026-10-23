import { useState } from 'react';
import {
  simulateDFA,
  dfaRegistry,
  binaryEndingIn01DFA,
  type DFADefinition,
  type DFASimulationResult,
} from '../engine/tocDFA';
import styles from './TOCAutomataLab.module.css';

export function TOCAutomataLab() {
  const [selectedDFAId, setSelectedDFAId] = useState<string>('toc.dfa.binary-ending-in-01');
  const [inputStr, setInputStr] = useState('1101');
  const [result, setResult] = useState<DFASimulationResult | null>(null);

  const dfa: DFADefinition = dfaRegistry.find((d) => d.id === selectedDFAId) ?? binaryEndingIn01DFA;

  const handleSimulate = (strToTest = inputStr) => {
    const res = simulateDFA(dfa, strToTest);
    setResult(res);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Theory of Computation (TOC) — Automata &amp; Formal Languages</h2>
          <p className={styles.desc}>
            Simulate a Deterministic Finite Automaton (DFA) \(M = (Q, \Sigma, \delta, q_0, F)\) step by step.
            Explore explicit state transitions, language acceptance criteria, and trap states.
          </p>
        </div>

        <div className={styles.selector}>
          <label htmlFor="dfa-select">Automaton:</label>
          <select
            id="dfa-select"
            value={selectedDFAId}
            onChange={(e) => {
              setSelectedDFAId(e.target.value);
              setResult(null);
              const selected = dfaRegistry.find((d) => d.id === e.target.value);
              if (selected) {
                setInputStr(selected.alphabet.slice(0, 3).join(''));
              }
            }}
            aria-label="Select DFA"
          >
            {dfaRegistry.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.mainGrid}>
        {/* DFA Specification Card */}
        <div className={styles.card}>
          <h3 className={styles.cardHeading}>Formal DFA Definition: {dfa.name}</h3>
          <p className={styles.definitionText}>{dfa.description}</p>
          <div className={styles.formalTuple}>
            <div><strong>States \(Q\):</strong> <code>{'{'}{dfa.states.join(', ')}{'}'}</code></div>
            <div><strong>Alphabet \(\Sigma\):</strong> <code>{'{'}{dfa.alphabet.join(', ')}{'}'}</code></div>
            <div><strong>Start State \(q_0\):</strong> <code>{dfa.startState}</code></div>
            <div><strong>Accept States \(F\):</strong> <code>{'{'}{dfa.acceptStates.join(', ')}{'}'}</code></div>
          </div>

          <h4 className={styles.subHeading}>Transition Table \(\delta\)</h4>
          <table className={styles.transTable}>
            <thead>
              <tr>
                <th>Current State</th>
                <th>Input '0'</th>
                <th>Input '1'</th>
              </tr>
            </thead>
            <tbody>
              {dfa.states.map((st) => {
                const to0 = dfa.transitions.find((t) => t.fromState === st && t.symbol === '0')?.toState;
                const to1 = dfa.transitions.find((t) => t.fromState === st && t.symbol === '1')?.toState;
                const isAccept = dfa.acceptStates.includes(st);
                return (
                  <tr key={st} className={isAccept ? styles.acceptRow : ''}>
                    <td><strong>{st}</strong> {isAccept ? '(Accept)' : ''}</td>
                    <td><code>{to0}</code></td>
                    <td><code>{to1}</code></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Input & Simulation Card */}
        <div className={styles.card}>
          <h3 className={styles.cardHeading}>Interactive String Evaluation</h3>
          <div className={styles.inputGroup}>
            <label htmlFor="dfa-input">Input String \(w \in \Sigma^*\):</label>
            <div className={styles.inputRow}>
              <input
                id="dfa-input"
                type="text"
                value={inputStr}
                onChange={(e) => setInputStr(e.target.value)}
                placeholder="e.g. 1101, 100, 01"
                className={styles.input}
              />
              <button
                className={styles.runBtn}
                onClick={() => handleSimulate()}
                aria-label="Simulate DFA"
              >
                ▶ Test String
              </button>
            </div>
          </div>

          <div className={styles.presets}>
            <span>Sample Presets:</span>
            {['01', '1101', '0001', '100', '010', '11'].map((preset) => (
              <button
                key={preset}
                className={styles.presetBtn}
                onClick={() => {
                  setInputStr(preset);
                  handleSimulate(preset);
                }}
              >
                "{preset}"
              </button>
            ))}
          </div>

          {/* Final State Indicator */}
          {result && (
            <div className={styles.finalStateIndicator}>
              <h4 className={styles.finalStateHeading}>Final State Transition Diagram</h4>
              <div className={styles.stateDiagram}>
                {dfa.states.map((state) => {
                  const isStart = state === dfa.startState;
                  const isAccept = dfa.acceptStates.includes(state);
                  const isFinal = state === result.finalState;
                  const isError = result.error && state === result.finalState;
                  let stateClass = styles.stateNode;
                  if (isAccept) stateClass = styles.stateNodeAccept;
                  if (isFinal) stateClass = isAccept ? styles.stateNodeFinalAccept : styles.stateNodeFinal;
                  if (isError && !result.accepted) stateClass = styles.stateNodeError;
                  return (
                    <div key={state} className={stateClass}>
                      <span className={styles.stateName}>{state}</span>
                      {isStart && <span className={styles.startMarker}>← start</span>}
                      {isAccept && <span className={styles.acceptMarker}>✓ accept</span>}
                      {isFinal && <span className={styles.finalMarker}>← final</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {result ? (
            <div className={styles.resultBox}>
              <div className={[styles.statusBadge, result.accepted ? styles.accepted : styles.rejected].join(' ')}>
                {result.accepted ? '✓ ACCEPTED' : '✗ REJECTED'}
              </div>
              <p className={styles.explanationText}>
                <strong>Decision Evidence:</strong> {result.explanation}
              </p>
              {result.error && <p className={styles.errorText}>⚠ {result.error}</p>}
            </div>
          ) : (
            <p className={styles.emptyPrompt}>Enter a binary string or select a preset to view step-by-step state transitions.</p>
          )}
        </div>
      </div>

      {/* Transition Trace */}
      {result && result.trace.length > 0 && (
        <div className={styles.card}>
          <h3 className={styles.cardHeading}>Deterministic State Transition Trace</h3>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Step</th>
                  <th>Current State</th>
                  <th>Read Symbol</th>
                  <th>Next State \(\delta(q, a)\)</th>
                  <th>Remaining Input</th>
                  <th>In Accept State?</th>
                </tr>
              </thead>
              <tbody>
                {result.trace.map((step) => (
                  <tr key={step.step} className={step.acceptedSoFar ? styles.acceptHighlight : ''}>
                    <td>{step.step}</td>
                    <td><code>{step.fromState}</code></td>
                    <td><strong>'{step.symbol}'</strong></td>
                    <td><code>{step.toState}</code></td>
                    <td><code>{step.remainingInput || 'ε (empty)'}</code></td>
                    <td>{step.acceptedSoFar ? '✓ Yes (q2)' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
