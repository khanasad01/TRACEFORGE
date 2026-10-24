import { useState } from 'react';
import {
  cacheConfigs,
  simulateCache,
  type CacheResult,
} from '../engine/cacheSim';
import styles from './CacheLab.module.css';

const DEFAULT_ADDRESSES = '0, 1, 2, 3, 0, 1, 2, 3';

function parseAddresses(raw: string): number[] {
  const tokens = raw.trim().split(/[,\s]+/).filter(Boolean);
  if (tokens.length === 0) throw new Error('Enter at least one memory address.');
  if (tokens.length > 200) throw new Error('Enter no more than 200 memory addresses.');
  return tokens.map((token) => {
    const address = Number(token);
    if (!Number.isSafeInteger(address) || address < 0 || address > 0x7fffffff) {
      throw new Error(`"${token}" is not a valid non-negative 31-bit address.`);
    }
    return address;
  });
}

export function CacheLab() {
  const [addresses, setAddresses] = useState(DEFAULT_ADDRESSES);
  const [configId, setConfigId] = useState('direct-mapped-4KB-16B');
  const [result, setResult] = useState<CacheResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRun = () => {
    try {
      const values = parseAddresses(addresses);
      const config = cacheConfigs[configId];
      if (!config) throw new Error(`Unknown cache configuration "${configId}".`);
      setResult(simulateCache(config, values));
      setError(null);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const reset = () => {
    setAddresses(DEFAULT_ADDRESSES);
    setConfigId('direct-mapped-4KB-16B');
    setResult(null);
    setError(null);
  };

  return (
    <section className={styles.container} aria-labelledby="cache-lab-title">
      <header className={styles.header}>
        <div>
          <h2 className={styles.title} id="cache-lab-title">COA — Cache Hierarchy Experiment</h2>
          <p className={styles.description}>
            Replay memory addresses through a deterministic educational cache model.
            Inspect actual hits, cold misses, set indices, tags, and eviction evidence.
          </p>
        </div>
      </header>

      <div className={styles.columns}>
        <section className={styles.card}>
          <h3 className={styles.heading}>Access pattern and configuration</h3>
          <label className={styles.label} htmlFor="cache-addresses">
            Addresses (comma or space separated, 0 to 2³¹−1)
          </label>
          <textarea
            id="cache-addresses"
            aria-label="Cache addresses"
            value={addresses}
            onChange={(event) => setAddresses(event.target.value)}
            rows={4}
          />
          <label className={styles.label} htmlFor="cache-config">Cache configuration</label>
          <select
            id="cache-config"
            aria-label="Cache configuration"
            value={configId}
            onChange={(event) => setConfigId(event.target.value)}
          >
            {Object.entries(cacheConfigs).map(([id, config]) => (
              <option key={id} value={id}>
                {id} · {config.replacementPolicy}
              </option>
            ))}
          </select>
          <div className={styles.buttons}>
            <button className={styles.runButton} onClick={handleRun}>▶ Simulate cache</button>
            <button className={styles.resetButton} onClick={reset}>↺ Reset</button>
          </div>
          <p className={styles.note}>
            Addresses are byte addresses. The preset repeats addresses within the same block
            to make cache hits visible. This is an educational model, not cycle-accurate hardware.
          </p>
          {error && <p className={styles.error} role="alert">{error}</p>}
        </section>

        <section className={styles.card}>
          <h3 className={styles.heading}>Observed cache result</h3>
          {result ? (
            <>
              <div className={styles.metrics} role="status">
                <span>Accesses: <strong>{result.totalAccesses}</strong></span>
                <span>Hits: <strong>{result.hits}</strong></span>
                <span>Misses: <strong>{result.misses}</strong></span>
                <span>Hit rate: <strong>{(result.hitRate * 100).toFixed(1)}%</strong></span>
              </div>
              <p className={styles.note}>{result.explanation}</p>
            </>
          ) : (
            <p className={styles.note}>Run an access pattern to see the cache's measured hit/miss behavior.</p>
          )}
        </section>
      </div>

      {result && (
        <section className={styles.card}>
          <h3 className={styles.heading}>Per-access evidence</h3>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Step</th><th>Address</th><th>Result</th><th>Set</th><th>Tag</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {result.trace.map((event) => (
                  <tr key={event.step}>
                    <td>{event.step}</td>
                    <td>{event.address}</td>
                    <td>{event.hit ? 'HIT' : 'MISS'}</td>
                    <td>{event.setIndex}</td>
                    <td>{event.tag}</td>
                    <td>{event.action}</td>
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
