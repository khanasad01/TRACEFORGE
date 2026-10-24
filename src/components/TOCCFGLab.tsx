import { useState, type ReactNode } from 'react';
import { ANBN_GRAMMAR, parseCFG, type CFGParseResult, type CFGParseTree } from '../engine/tocCFG';
import styles from './TOCCFGLab.module.css';

const TRACE_DISPLAY_LIMIT = 500;
const PRESETS = ['aaabbb', 'aabb', 'aabbb', 'b'];

function renderTree(node: CFGParseTree): ReactNode {
  return (
    <li key={`${node.symbol}-${node.span[0]}-${node.span[1]}`}>
      <code>{node.symbol} [{node.span[0]}, {node.span[1]})</code>
      {node.children.length > 0 && <ul>{node.children.map(renderTree)}</ul>}
    </li>
  );
}

export function TOCCFGLab() {
  const [input, setInput] = useState('aaabbb');
  const [result, setResult] = useState<CFGParseResult | null>(null);

  const run = (value = input) => setResult(parseCFG(ANBN_GRAMMAR, value));
  const reset = () => {
    setInput('aaabbb');
    setResult(null);
  };

  return (
    <section className={styles.container} aria-labelledby="cfg-lab-title">
      <header className={styles.header}>
        <div>
          <h2 className={styles.title} id="cfg-lab-title">TOC — Context-Free Grammar Parser</h2>
          <p className={styles.description}>
            CYK parses the selected string against a curated grammar in Chomsky Normal Form and builds an evidence-backed parse tree.
          </p>
        </div>
      </header>

      <div className={styles.columns}>
        <section className={styles.card} aria-labelledby="cfg-definition-title">
          <h3 className={styles.heading} id="cfg-definition-title">{ANBN_GRAMMAR.name}</h3>
          <p className={styles.note}>{ANBN_GRAMMAR.description}</p>
          <p className={styles.tuple}>
            Start symbol: <code>{ANBN_GRAMMAR.startSymbol}</code> · Nonterminals: <code>{ANBN_GRAMMAR.nonTerminals.join(', ')}</code>
            {' '}· Terminals: <code>{ANBN_GRAMMAR.terminals.join(', ')}</code>
          </p>
          <h4 className={styles.subheading}>Productions (CNF)</h4>
          <ul className={styles.productionList}>
            {ANBN_GRAMMAR.productions.map((production, index) => (
              <li key={`${production.lhs}-${index}`}>
                <code>{production.lhs} → {production.rhs.join(' ')}</code>
              </li>
            ))}
          </ul>
          <p className={styles.note}>
            This grammar recognizes <code>aⁿbⁿ</code> for <code>n ≥ 1</code>. The parser supports one-character terminals and CNF productions only.
          </p>
        </section>

        <section className={styles.card} aria-labelledby="cfg-controls-title">
          <h3 className={styles.heading} id="cfg-controls-title">Parse an input</h3>
          <label className={styles.field}>
            <span>Input string over {`{${ANBN_GRAMMAR.terminals.join(', ')}}`}</span>
            <input
              aria-label="CFG input string"
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
              <button
                key={preset}
                className={styles.presetButton}
                onClick={() => {
                  setInput(preset);
                  run(preset);
                }}
              >
                {preset}
              </button>
            ))}
          </div>
          <div className={styles.buttons}>
            <button className={styles.runButton} onClick={() => run()}>▶ Parse string</button>
            <button className={styles.resetButton} onClick={reset}>↺ Reset</button>
          </div>
          {result ? (
            result.error ? (
              <p className={styles.error} role="alert">{result.error}</p>
            ) : (
              <p className={result.accepted ? styles.accepted : styles.rejected} role="status">
                {result.accepted
                  ? `✓ ACCEPTED — "${result.input}" belongs to this grammar.`
                  : `✗ REJECTED — "${result.input}" cannot be derived from the start symbol.`}
              </p>
            )
          ) : (
            <p className={styles.empty} role="status">Run the parser to see the CYK chart evidence and parse tree.</p>
          )}
        </section>
      </div>

      {result && !result.error && (
        <>
          <section className={styles.card} aria-labelledby="parse-tree-title">
            <h3 className={styles.heading} id="parse-tree-title">Parse tree</h3>
            {result.parseTree ? (
              <ul className={styles.tree} aria-label="Derived parse tree" role="tree">
                {renderTree(result.parseTree)}
              </ul>
            ) : (
              <p className={styles.note}>No parse tree exists because the start symbol was not found in the full-span CYK cell.</p>
            )}
          </section>

          <section className={styles.card} aria-labelledby="cyk-trace-title">
            <h3 className={styles.heading} id="cyk-trace-title">
              CYK execution trace ({result.trace.length} evaluations)
            </h3>
            <p className={styles.note}>
              Each row records an actual terminal or production check and whether it added a nonterminal to a chart cell.
            </p>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr><th>Step</th><th>Cell span</th><th>Split</th><th>Production</th><th>Premises matched?</th><th>Added to chart?</th></tr>
                </thead>
                <tbody>
                  {result.trace.slice(0, TRACE_DISPLAY_LIMIT).map((step) => (
                    <tr key={step.step}>
                      <td>{step.step}</td>
                      <td>[{step.span[0]}, {step.span[1]})</td>
                      <td>{step.split ?? '—'}</td>
                      <td><code>{step.production.lhs} → {step.production.rhs.join(' ')}</code></td>
                      <td>{step.matching ? 'Yes' : 'No'}</td>
                      <td>{step.addedToChart ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {result.trace.length > TRACE_DISPLAY_LIMIT && (
              <p className={styles.note}>
                Showing the first {TRACE_DISPLAY_LIMIT} actual evaluations; {result.trace.length - TRACE_DISPLAY_LIMIT} more are omitted from this view.
              </p>
            )}
          </section>
        </>
      )}
    </section>
  );
}
