import { useState } from 'react';
import {
  predictStudentOutcome,
  runLogisticRegressionExperiment,
  type LogisticExperimentResult,
  type StudentPrediction,
} from '../engine/logisticRegression';
import styles from './InterpretableMLLab.module.css';

const INITIAL_HOURS = '6';
const INITIAL_ATTENDANCE = '80';

export function InterpretableMLLab() {
  const [result, setResult] = useState<LogisticExperimentResult | null>(null);
  const [hours, setHours] = useState(INITIAL_HOURS);
  const [attendance, setAttendance] = useState(INITIAL_ATTENDANCE);
  const [prediction, setPrediction] = useState<StudentPrediction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const makePrediction = (model: LogisticExperimentResult['model']) => {
    if (!hours.trim() || !attendance.trim()) {
      throw new Error('Enter both study hours and an attendance percentage.');
    }
    const query = {
      studyHours: Number(hours),
      attendanceRate: Number(attendance),
    };
    setPrediction(predictStudentOutcome(model, query));
    setError(null);
  };

  const handleTrain = () => {
    try {
      const trained = runLogisticRegressionExperiment();
      setResult(trained);
      makePrediction(trained.model);
    } catch (err) {
      setResult(null);
      setPrediction(null);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handlePredict = () => {
    if (!result) return;
    try {
      makePrediction(result.model);
    } catch (err) {
      setPrediction(null);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const reset = () => {
    setResult(null);
    setHours(INITIAL_HOURS);
    setAttendance(INITIAL_ATTENDANCE);
    setPrediction(null);
    setError(null);
  };

  return (
    <section className={styles.container} aria-labelledby="ml-lab-title">
      <header className={styles.header}>
        <div>
          <h2 id="ml-lab-title" className={styles.title}>AI Foundations — Interpretable ML Experiment</h2>
          <p className={styles.description}>
            Train a two-feature logistic regression classifier, inspect its learned weights,
            and evaluate it on a deterministic held-out subset. This small, synthetic classroom
            dataset is for demonstration—not student assessment.
          </p>
        </div>
      </header>

      <div className={styles.grid}>
        <section className={styles.card}>
          <h3 className={styles.heading}>Experiment setup</h3>
          <p className={styles.note}>
            Predict whether a learner passes from study hours and attendance. The dataset has
            24 synthetic examples; a stratified 75/25 split preserves both classes in training
            and evaluation. Batch gradient descent fits the model using cross-entropy loss.
          </p>
          <div className={styles.controls}>
            <button className={styles.primaryButton} onClick={handleTrain}>▶ Train &amp; evaluate</button>
            <button className={styles.secondaryButton} onClick={reset}>↺ Reset</button>
          </div>
          {error && <p className={styles.error} role="alert">{error}</p>}
          {result && (
            <div className={styles.summary} role="status">
              Trained on {result.trainingSize} examples; evaluated on {result.evaluationSize}
              {' '}held-out examples. Predictions shown below come from the trained model.
            </div>
          )}
        </section>

        <section className={styles.card}>
          <h3 className={styles.heading}>Try a profile</h3>
          <div className={styles.fields}>
            <label>
              Study hours
              <input
                aria-label="Study hours"
                type="number"
                min="0"
                step="0.5"
                value={hours}
                onChange={(event) => {
                  setHours(event.target.value);
                  setPrediction(null);
                }}
              />
            </label>
            <label>
              Attendance (%)
              <input
                aria-label="Attendance rate"
                type="number"
                min="0"
                max="100"
                step="1"
                value={attendance}
                onChange={(event) => {
                  setAttendance(event.target.value);
                  setPrediction(null);
                }}
              />
            </label>
          </div>
          <button
            className={styles.secondaryButton}
            onClick={handlePredict}
            disabled={!result}
          >
            Predict profile
          </button>
          {prediction && (
            <p className={styles.prediction} aria-live="polite">
              Predicted {prediction.predicted ? 'pass' : 'not pass'} · P(pass) =
              {' '}{(prediction.probability * 100).toFixed(1)}%
            </p>
          )}
        </section>
      </div>

      {result && (
        <>
          <section className={styles.card} aria-labelledby="metrics-heading">
            <h3 id="metrics-heading" className={styles.heading}>Held-out evaluation metrics</h3>
            <div className={styles.metricGrid}>
              <Metric label="Accuracy" value={result.metrics.accuracy} />
              <Metric label="Precision" value={result.metrics.precision} />
              <Metric label="Recall" value={result.metrics.recall} />
              <Metric label="F1" value={result.metrics.f1} />
            </div>
            <p className={styles.note}>
              Confusion counts: TP {result.metrics.truePositive} · TN {result.metrics.trueNegative}
              {' '}· FP {result.metrics.falsePositive} · FN {result.metrics.falseNegative}.
              Metrics use only the held-out examples. With a tiny dataset these values are
              illustrative and should not be treated as a reliable real-world estimate.
            </p>
          </section>

          <section className={styles.card}>
            <h3 className={styles.heading}>Model interpretation and training evidence</h3>
            <p className={styles.formula}>
              P(pass) = sigmoid(bias + w₁ × (study hours / 10) + w₂ × (attendance / 100))
            </p>
            <div className={styles.weights}>
              <span>Bias: {result.model.bias.toFixed(3)}</span>
              <span>Study-hours weight: {result.model.studyHours.toFixed(3)}</span>
              <span>Attendance weight: {result.model.attendanceRate.toFixed(3)}</span>
            </div>
            <p className={styles.note}>
              A positive weight raises the model score as that feature increases; a negative
              weight lowers it. The trace records the actual cross-entropy loss and weights
              after each gradient-descent epoch.
            </p>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead><tr><th>Epoch</th><th>Training loss</th><th>Study weight</th><th>Attendance weight</th></tr></thead>
                <tbody>
                  {result.trainingTrace
                    .filter((point) => point.epoch === 1 || point.epoch % 50 === 0 || point.epoch === result.trainingTrace.length)
                    .map((point) => (
                      <tr key={point.epoch}>
                        <td>{point.epoch}</td>
                        <td>{point.loss.toFixed(4)}</td>
                        <td>{point.weights.studyHours.toFixed(3)}</td>
                        <td>{point.weights.attendanceRate.toFixed(3)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className={styles.card}>
            <h3 className={styles.heading}>Held-out predictions</h3>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr><th>Study hours</th><th>Attendance</th><th>Actual</th><th>Predicted</th><th>P(pass)</th><th>Result</th></tr>
                </thead>
                <tbody>
                  {result.evaluation.map((item, index) => (
                    <tr key={`${item.example.studyHours}-${item.example.attendanceRate}-${index}`}>
                      <td>{item.example.studyHours}</td>
                      <td>{item.example.attendanceRate}%</td>
                      <td>{item.actual ? 'Pass' : 'Not pass'}</td>
                      <td>{item.predicted ? 'Pass' : 'Not pass'}</td>
                      <td>{(item.probability * 100).toFixed(1)}%</td>
                      <td>{item.correct ? 'Correct' : 'Incorrect'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.metric}>
      <span>{label}</span>
      <strong>{(value * 100).toFixed(1)}%</strong>
    </div>
  );
}
