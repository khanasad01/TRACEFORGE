import { useState } from 'react';
import {
  assembleProgram,
  runTinyCPU,
  defaultTinyCPUProgram,
  programRegistry,
  type CPUExecutionResult,
} from '../engine/tinyCPU';
import styles from './TinyCPULab.module.css';

export function TinyCPULab() {
  const [selectedProgramId, setSelectedProgramId] = useState<string>('coa.tinycpu.sum-3-2-1');
  const [code, setCode] = useState(defaultTinyCPUProgram);
  const [result, setResult] = useState<CPUExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRun = () => {
    try {
      setError(null);
      const instructions = assembleProgram(code);
      const res = runTinyCPU(instructions);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setResult(null);
    }
  };

  const handleReset = () => {
    const prog = programRegistry.find((p) => p.id === selectedProgramId) ?? programRegistry[0];
    setCode(prog.code);
    setResult(null);
    setError(null);
  };

  const handleProgramChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const prog = programRegistry.find((p) => p.id === id) ?? programRegistry[0];
    setSelectedProgramId(id);
    setCode(prog.code);
    setResult(null);
    setError(null);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Computer Organization &amp; Architecture (COA) — TinyCPU Simulator</h2>
          <p className={styles.desc}>
            A sequential educational 8-bit instruction-set simulator demonstrating register
            updates, zero-flag branching, and dependency warnings. Use the Pipeline &amp; Hazards
            tab for the separate cycle-by-cycle five-stage timing model.
          </p>
        </div>

        <div className={styles.programSelector}>
          <label htmlFor="program-select">Program:</label>
          <select
            id="program-select"
            value={selectedProgramId}
            onChange={handleProgramChange}
            aria-label="Select program"
          >
            {programRegistry.map((prog) => (
              <option key={prog.id} value={prog.id}>
                {prog.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.mainGrid}>
        {/* Code Editor and Controls */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardHeading}>Assembly Program</h3>
            <div className={styles.btnRow}>
              <button className={styles.runBtn} onClick={handleRun} aria-label="Execute TinyCPU">
                ▶ Execute
              </button>
              <button className={styles.resetBtn} onClick={handleReset} aria-label="Reset assembly program">
                ↺ Reset
              </button>
            </div>
          </div>
          <textarea
            className={styles.editor}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={12}
            spellCheck={false}
          />
          {error && <div className={styles.errorBox}>⚠ {error}</div>}

          <div className={styles.isaCheatSheet}>
            <strong>Supported ISA:</strong>
            <code>MOV Rd, val/Rs</code> · <code>ADD Rd, Rs</code> · <code>SUB Rd, Rs</code> · <code>LOAD Rd, [addr]</code> · <code>STORE Rd, [addr]</code> · <code>IN Rd</code> · <code>OUT Rs</code> · <code>JMP addr</code> · <code>JZ addr</code> · <code>HALT</code>
          </div>
        </div>

        {/* Machine State Display */}
        <div className={styles.card}>
          <h3 className={styles.cardHeading}>CPU Architectural State</h3>
          {result ? (
            <div className={styles.stateDisplay}>
              <div className={styles.statusRow}>
                <div>Status: <strong>{result.haltedNormally ? 'Halted Normally' : 'Running / Max Cycles'}</strong></div>
                <div>Cycles: <strong>{result.stepsExecuted}</strong></div>
                <div>PC: <code>{result.finalState.pc}</code></div>
                <div>Zero Flag (Z): <code>{result.finalState.zeroFlag ? '1 (SET)' : '0 (CLEAR)'}</code></div>
              </div>

              <h4 className={styles.subHeading}>Register File</h4>
              <div className={styles.regGrid}>
                {Object.entries(result.finalState.registers).map(([reg, val]) => (
                  <div key={reg} className={styles.regBox}>
                    <span className={styles.regName}>{reg.toUpperCase()}</span>
                    <span className={styles.regVal}>{val} <small>(0x{val.toString(16).padStart(2, '0')})</small></span>
                  </div>
                ))}
              </div>

              <h4 className={styles.subHeading}>Data Memory (RAM - 16 bytes)</h4>
              <div className={styles.memGrid}>
                {result.finalState.memory.map((val, idx) => (
                  <div key={idx} className={styles.memCell}>
                    <span className={styles.memAddr}>[{idx}]</span>
                    <span className={styles.memVal}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className={styles.emptyPrompt}>Click "Execute" to assemble instructions and run the TinyCPU simulation.</p>
          )}
        </div>
      </div>

      {/* Cycle by Cycle Trace */}
      {result && result.trace.length > 0 && (
        <div className={styles.card}>
          <h3 className={styles.cardHeading}>Sequential Instruction Trace &amp; Dependency Warnings</h3>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Cycle</th>
                  <th>PC</th>
                  <th>Instruction</th>
                  <th>Execution Effect</th>
                  <th>Pipeline Observation</th>
                </tr>
              </thead>
              <tbody>
                {result.trace.map((t) => (
                  <tr key={t.cycle} className={t.hazardDetected ? styles.hazardRow : ''}>
                    <td>{t.cycle}</td>
                    <td><code>{t.pc}</code></td>
                    <td><strong>{t.instruction}</strong></td>
                    <td>{t.note}</td>
                    <td>
                      {t.hazardDetected ? (
                        <span className={styles.hazardBadge}>⚠ {t.hazardDetected}</span>
                      ) : (
                        <span className={styles.cleanStage}>Clean Stage Progression</span>
                      )}
                    </td>
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
