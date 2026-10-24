import { useState } from 'react';
import { assembleProgram, type Instruction } from '../engine/tinyCPU';
import {
  simulateTinyCPUPipeline,
  type PipelineResult,
  type PipelineStage,
} from '../engine/tinyCPUPipeline';
import styles from './TinyCPULab.module.css';

const exampleProgram = `MOV R0, 5
MOV R1, 2
ADD R1, R0
ADD R2, R1
STORE R2, [0]
HALT`;

const pipelineStages: PipelineStage[] = ['IF', 'ID', 'EX', 'MEM', 'WB'];

export function TinyCPUPipelineLab() {
  const [program, setProgram] = useState(exampleProgram);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRun = () => {
    try {
      const instructions: Instruction[] = assembleProgram(program);
      setResult(simulateTinyCPUPipeline(instructions));
      setError(null);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleReset = () => {
    setProgram(exampleProgram);
    setResult(null);
    setError(null);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>TinyCPU Five-Stage Pipeline</h2>
          <p className={styles.desc}>
            Run the instruction stream through IF → ID → EX → MEM → WB. This is a timing
            model, not an architectural execution: branches are treated as listed instructions.
            There is no forwarding; WB writes are visible to ID during that cycle.
          </p>
        </div>
      </header>

      <div className={styles.mainGrid}>
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardHeading}>Assembly instruction stream</h3>
            <div className={styles.btnRow}>
              <button className={styles.runBtn} onClick={handleRun} aria-label="Run pipeline simulation">
                ▶ Run
              </button>
              <button className={styles.resetBtn} onClick={handleReset} aria-label="Reset pipeline simulation">
                ↺ Reset
              </button>
            </div>
          </div>
          <textarea
            className={styles.editor}
            aria-label="Pipeline assembly program"
            value={program}
            onChange={(event) => setProgram(event.target.value)}
            rows={10}
            spellCheck={false}
          />
          {error && <div className={styles.errorBox} role="alert">⚠ {error}</div>}
          <p className={styles.isaCheatSheet}>
            RAW stalls are inserted while a consumer in ID depends on a producer in EX or MEM.
            Immediate operands do not create register dependencies.
          </p>
        </section>

        <section className={styles.card}>
          <h3 className={styles.cardHeading}>Measured pipeline summary</h3>
          {result ? (
            <>
              <div className={styles.statusRow}>
                <div>Instructions: <strong>{result.instructions}</strong></div>
                <div>Cycles observed: <strong>{result.cycles}</strong></div>
                <div>RAW stalls: <strong>{result.stalls}</strong></div>
                <div>Ideal cycles: <strong>{result.idealCycles}</strong></div>
              </div>
              <p className={styles.isaCheatSheet}>
                Ideal cycles assume a full five-stage pipeline with no stalls (N + 4).
                Observed counts come from this instruction stream and the documented
                no-forwarding assumption.
              </p>
            </>
          ) : (
            <p className={styles.emptyPrompt}>Run the program to see cycle and stall evidence.</p>
          )}
        </section>
      </div>

      {result && (
        <section className={styles.card}>
          <h3 className={styles.cardHeading}>Cycle-by-cycle stage trace</h3>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Cycle</th>
                  {pipelineStages.map((stage) => <th key={stage}>{stage}</th>)}
                  <th>Hazard / event</th>
                </tr>
              </thead>
              <tbody>
                {result.trace.map((cycle) => (
                  <tr key={cycle.cycle} className={cycle.stalled ? styles.hazardRow : ''}>
                    <td>{cycle.cycle}</td>
                    {pipelineStages.map((stage) => (
                      <td key={stage}>
                        {cycle.stages[stage]?.raw ?? (cycle.stalled && stage === 'EX' ? 'bubble' : '—')}
                      </td>
                    ))}
                    <td>{cycle.stallReason ?? (cycle.stalled ? 'RAW stall' : 'Progress')}</td>
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
