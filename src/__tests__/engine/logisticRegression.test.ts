import { describe, expect, it } from 'vitest';
import {
  predictStudentOutcome,
  runLogisticRegressionExperiment,
  STUDENT_EXAMPLE_DATASET,
} from '../../engine/logisticRegression';

describe('interpretable logistic regression experiment', () => {
  it('trains on a stratified subset and reports held-out predictions and metrics', () => {
    const result = runLogisticRegressionExperiment();

    expect(result.trainingSize).toBe(18);
    expect(result.evaluationSize).toBe(6);
    expect(result.evaluation).toHaveLength(result.evaluationSize);
    expect(result.metrics.truePositive + result.metrics.trueNegative
      + result.metrics.falsePositive + result.metrics.falseNegative).toBe(result.evaluationSize);
    expect(result.metrics.accuracy).toBeGreaterThanOrEqual(0);
    expect(result.metrics.accuracy).toBeLessThanOrEqual(1);
    const correct = result.evaluation.filter((prediction) => prediction.correct).length;
    expect(result.metrics.accuracy).toBe(correct / result.evaluationSize);
    expect(result.evaluation.every((prediction) => prediction.actual !== undefined)).toBe(true);
    expect(result.model.studyHours).toBeGreaterThan(0);
    expect(result.trainingTrace).toHaveLength(300);
    expect(result.trainingTrace[result.trainingTrace.length - 1].loss)
      .toBeLessThan(result.trainingTrace[0].loss);
  });

  it('produces reproducible training traces and evaluation metrics', () => {
    const first = runLogisticRegressionExperiment();
    const second = runLogisticRegressionExperiment();
    expect(first.trainingTrace).toEqual(second.trainingTrace);
    expect(first.evaluation).toEqual(second.evaluation);
    expect(first.metrics).toEqual(second.metrics);
  });

  it('uses the learned coefficients to predict an editable profile', () => {
    const { model } = runLogisticRegressionExperiment();
    const low = predictStudentOutcome(model, {
      studyHours: 1,
      attendanceRate: 20,
    });
    const high = predictStudentOutcome(model, {
      studyHours: 9,
      attendanceRate: 95,
    });

    expect(low.probability).toBeGreaterThanOrEqual(0);
    expect(high.probability).toBeLessThanOrEqual(1);
    expect(high.probability).toBeGreaterThan(low.probability);
  });

  it('rejects invalid data and training settings', () => {
    expect(() => runLogisticRegressionExperiment(
      [{ studyHours: 2, attendanceRate: 50, passed: false }],
    )).toThrow(/at least four/);
    expect(() => runLogisticRegressionExperiment(STUDENT_EXAMPLE_DATASET, 0)).toThrow(/Epoch count/);
    expect(() => predictStudentOutcome(
      { bias: 0, studyHours: 0, attendanceRate: 0 },
      { studyHours: 2, attendanceRate: 120 },
    )).toThrow(/Attendance rate/);
  });
});
