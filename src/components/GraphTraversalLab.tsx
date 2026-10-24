import { useState } from 'react';
import {
  parseUndirectedAdjacencyList,
  traverseGraph,
  type GraphTraversalAlgorithm,
  type GraphTraversalResult,
} from '../engine/graphTraversal';
import styles from './GraphTraversalLab.module.css';

const EXAMPLE_GRAPH = `A: B, C
B: D, E
C: F
D:
E: F
F:
G:`;

export function GraphTraversalLab() {
  const [source, setSource] = useState(EXAMPLE_GRAPH);
  const [start, setStart] = useState('A');
  const [algorithm, setAlgorithm] = useState<GraphTraversalAlgorithm>('BFS');
  const [result, setResult] = useState<GraphTraversalResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRun = () => {
    try {
      const graph = parseUndirectedAdjacencyList(source);
      setResult(traverseGraph(graph, start.trim(), algorithm));
      setError(null);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleReset = () => {
    setSource(EXAMPLE_GRAPH);
    setStart('A');
    setAlgorithm('BFS');
    setResult(null);
    setError(null);
  };

  return (
    <section className={styles.container} aria-labelledby="graph-traversal-title">
      <header className={styles.header}>
        <div>
          <h2 id="graph-traversal-title" className={styles.title}>DAA — Graph Traversal Lab</h2>
          <p className={styles.description}>
            Compare breadth-first and depth-first traversal on an editable undirected graph.
            Each trace event comes from the selected algorithm visiting a vertex and updating
            its frontier.
          </p>
        </div>
      </header>

      <div className={styles.columns}>
        <section className={styles.card}>
          <h3 className={styles.heading}>Graph and controls</h3>
          <label className={styles.graphLabel} htmlFor="graph-adjacency-list">
            Adjacency list (one <code>vertex: neighbors</code> entry per line)
          </label>
          <textarea
            id="graph-adjacency-list"
            aria-label="Graph adjacency list"
            className={styles.editor}
            value={source}
            onChange={(event) => setSource(event.target.value)}
            rows={9}
            spellCheck={false}
          />
          <div className={styles.controls}>
            <label>
              Traversal
              <select
                aria-label="Traversal algorithm"
                value={algorithm}
                onChange={(event) => setAlgorithm(event.target.value as GraphTraversalAlgorithm)}
              >
                <option value="BFS">Breadth-First Search (BFS)</option>
                <option value="DFS">Depth-First Search (DFS)</option>
              </select>
            </label>
            <label>
              Start vertex
              <input
                aria-label="Start vertex"
                value={start}
                onChange={(event) => setStart(event.target.value)}
              />
            </label>
          </div>
          <div className={styles.buttons}>
            <button className={styles.runButton} onClick={handleRun}>▶ Run traversal</button>
            <button className={styles.resetButton} onClick={handleReset}>↺ Reset</button>
          </div>
          <p className={styles.note}>
            Edges are undirected; neighbor order follows the adjacency list. Traversal visits
            only the connected component containing the selected start vertex.
          </p>
          {error && <p className={styles.error} role="alert">{error}</p>}
        </section>

        <section className={styles.card}>
          <h3 className={styles.heading}>Traversal result</h3>
          {result ? (
            <>
              <div className={styles.summary} role="status">
                {result.algorithm} visited {result.reachableCount} of {result.vertexCount} vertices.
              </div>
              <p className={styles.order}>
                Visit order: <strong>{result.order.join(' → ')}</strong>
              </p>
            </>
          ) : (
            <p className={styles.note}>Run a traversal to inspect visited order and frontier evidence.</p>
          )}
        </section>
      </div>

      {result && (
        <section className={styles.card}>
          <h3 className={styles.heading}>Execution trace</h3>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr><th>Step</th><th>Current</th><th>Newly discovered</th><th>Frontier</th><th>Visited</th></tr>
              </thead>
              <tbody>
                {result.trace.map((step) => (
                  <tr key={step.step}>
                    <td>{step.step}</td>
                    <td><strong>{step.current}</strong></td>
                    <td>{step.discovered.join(', ') || 'none'}</td>
                    <td>{step.frontier.join(', ') || 'empty'}</td>
                    <td>{step.visited.join(', ')}</td>
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
