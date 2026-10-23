import { useState } from 'react';
import { runBFS, runAStar, createDefaultGrid, type GridMap, type SearchResult } from '../engine/aiSearch';
import styles from './AISearchLab.module.css';

export function AISearchLab() {
  const [map] = useState<GridMap>(createDefaultGrid());
  const [algorithm, setAlgorithm] = useState<'BFS' | 'A*'>('A*');
  const [result, setResult] = useState<SearchResult | null>(null);

  const handleRunSearch = () => {
    const res = algorithm === 'BFS' ? runBFS(map) : runAStar(map);
    setResult(res);
  };

  const pathSet = new Set(result?.path.map((p) => `${p.r},${p.c}`) ?? []);
  const exploredSet = new Set(
    result?.trace.flatMap((t) => t.visited.map((p) => `${p.r},${p.c}`)) ?? [],
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>AI Foundations — State Space Search &amp; Reasoning</h2>
          <p className={styles.desc}>
            Explore heuristic vs. uninformed search strategies on a state space grid.
            Observe the open frontier, closed/visited states, path costs \(g(n)\), and Manhattan heuristic \(h(n)\).
          </p>
        </div>
        <div className={styles.controls}>
          <div className={styles.selector}>
            <label htmlFor="algo-select">Algorithm:</label>
            <select
              id="algo-select"
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value as 'BFS' | 'A*')}
              className={styles.select}
            >
              <option value="A*">A* (Heuristic Search)</option>
              <option value="BFS">BFS (Breadth-First Search)</option>
            </select>
          </div>
          <button className={styles.runBtn} onClick={handleRunSearch} aria-label="Run search algorithm">
            ▶ Run {algorithm}
          </button>
        </div>
      </div>

      <div className={styles.gridSection}>
        <div className={styles.gridCard}>
          <h3 className={styles.cardHeading}>Environment State Space (6x6 Grid)</h3>
          <div
            className={styles.grid}
            style={{ gridTemplateColumns: `repeat(${map.cols}, 40px)` }}
            role="grid"
            aria-label="Search Grid"
          >
            {map.grid.map((row, r) =>
              row.map((cell, c) => {
                const key = `${r},${c}`;
                const isStart = map.start.r === r && map.start.c === c;
                const isGoal = map.goal.r === r && map.goal.c === c;
                const isPath = pathSet.has(key);
                const isExplored = exploredSet.has(key) && !isPath && !isStart && !isGoal;

                let cellClass = styles.cell;
                if (cell === 'wall') cellClass += ` ${styles.wall}`;
                else if (isStart) cellClass += ` ${styles.start}`;
                else if (isGoal) cellClass += ` ${styles.goal}`;
                else if (isPath) cellClass += ` ${styles.path}`;
                else if (isExplored) cellClass += ` ${styles.explored}`;

                return (
                  <div key={key} className={cellClass} title={`(${r},${c})`}>
                    {isStart ? 'S' : isGoal ? 'G' : isPath ? '•' : ''}
                  </div>
                );
              }),
            )}
          </div>
          <div className={styles.legend}>
            <span className={styles.legendItem}><span className={`${styles.legendBox} ${styles.start}`} /> Start (0,0)</span>
            <span className={styles.legendItem}><span className={`${styles.legendBox} ${styles.goal}`} /> Goal (5,5)</span>
            <span className={styles.legendItem}><span className={`${styles.legendBox} ${styles.wall}`} /> Obstacle</span>
            <span className={styles.legendItem}><span className={`${styles.legendBox} ${styles.explored}`} /> Explored</span>
            <span className={styles.legendItem}><span className={`${styles.legendBox} ${styles.path}`} /> Optimal Path</span>
          </div>
        </div>

        <div className={styles.infoCard}>
          <h3 className={styles.cardHeading}>Search Metrics &amp; Reasoning</h3>
          {result ? (
            <div className={styles.metrics}>
              <div className={styles.metricRow}>
                <span>Status:</span>
                <strong>{result.found ? '✓ Goal Found' : '✗ Path Not Found'}</strong>
              </div>
              <div className={styles.metricRow}>
                <span>Path Cost \(g(goal)\):</span>
                <strong>{result.pathCost} steps</strong>
              </div>
              <div className={styles.metricRow}>
                <span>States Explored:</span>
                <strong>{result.nodesExplored} states</strong>
              </div>
              <div className={styles.explanationBox}>
                <p><strong>Observed Reasoning:</strong> {result.explanation}</p>
                <p className={styles.note}>
                  {algorithm === 'A*'
                    ? 'A* uses evaluation function f(n) = g(n) + h(n), where h(n) is the admissible Manhattan distance heuristic, focusing exploration directly toward the goal.'
                    : 'BFS explores systematically layer-by-layer without domain heuristics, which guarantees shortest path on unweighted graphs at the expense of expanding more frontier nodes.'}
                </p>
              </div>
            </div>
          ) : (
            <p className={styles.emptyPrompt}>Click "Run {algorithm}" to execute the search algorithm and observe state transitions.</p>
          )}
        </div>
      </div>

      {result && result.trace.length > 0 && (
        <div className={styles.traceCard}>
          <h3 className={styles.cardHeading}>Decision &amp; State Trace ({result.algorithm})</h3>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Step</th>
                  <th>Current State</th>
                  <th>\(g(n)\)</th>
                  <th>\(h(n)\)</th>
                  <th>\(f(n)\)</th>
                  <th>Action / Decision</th>
                </tr>
              </thead>
              <tbody>
                {result.trace.map((t) => (
                  <tr key={t.step}>
                    <td>{t.step}</td>
                    <td><code>({t.current.r}, {t.current.c})</code></td>
                    <td>{t.gn}</td>
                    <td>{t.hn}</td>
                    <td>{t.fn}</td>
                    <td>{t.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={styles.traceNote}>Showing all {result.trace.length} expansion step{result.trace.length !== 1 ? 's' : ''}.</p>
        </div>
      )}
    </div>
  );
}
