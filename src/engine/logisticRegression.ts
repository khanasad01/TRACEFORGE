export interface StudentProfile {
  studyHours: number;
  attendanceRate: number;
}

export interface StudentExample extends StudentProfile {
  passed: boolean;
}

export interface LogisticWeights {
  bias: number;
  studyHours: number;
  attendanceRate: number;
}

export interface LogisticTrainingPoint {
  epoch: number;
  loss: number;
  weights: LogisticWeights;
}

export interface StudentPrediction {
  example: StudentProfile;
  probability: number;
  predicted: boolean;
  actual?: boolean;
  correct?: boolean;
}

export interface ClassificationMetrics {
  truePositive: number;
  trueNegative: number;
  falsePositive: number;
  falseNegative: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
}

export interface LogisticExperimentResult {
  trainingSize: number;
  evaluationSize: number;
  model: LogisticWeights;
  trainingTrace: LogisticTrainingPoint[];
  evaluation: StudentPrediction[];
  metrics: ClassificationMetrics;
}

export const STUDENT_EXAMPLE_DATASET: readonly StudentExample[] = [
  { studyHours: 1, attendanceRate: 50, passed: false },
  { studyHours: 2, attendanceRate: 60, passed: false },
  { studyHours: 3, attendanceRate: 60, passed: false },
  { studyHours: 4, attendanceRate: 70, passed: false },
  { studyHours: 4.5, attendanceRate: 80, passed: false },
  { studyHours: 5, attendanceRate: 60, passed: false },
  { studyHours: 1.5, attendanceRate: 95, passed: false },
  { studyHours: 3.5, attendanceRate: 90, passed: false },
  { studyHours: 2.5, attendanceRate: 40, passed: false },
  { studyHours: 5.5, attendanceRate: 50, passed: false },
  { studyHours: 3, attendanceRate: 75, passed: false },
  { studyHours: 4.8, attendanceRate: 45, passed: false },
  { studyHours: 3, attendanceRate: 95, passed: true },
  { studyHours: 4, attendanceRate: 98, passed: true },
  { studyHours: 5.5, attendanceRate: 90, passed: true },
  { studyHours: 6, attendanceRate: 80, passed: true },
  { studyHours: 7, attendanceRate: 70, passed: true },
  { studyHours: 8, attendanceRate: 85, passed: true },
  { studyHours: 6, attendanceRate: 100, passed: true },
  { studyHours: 9, attendanceRate: 60, passed: true },
  { studyHours: 8.5, attendanceRate: 95, passed: true },
  { studyHours: 4.8, attendanceRate: 90, passed: true },
  { studyHours: 5, attendanceRate: 75, passed: true },
  { studyHours: 7.5, attendanceRate: 45, passed: true },
];

const DEFAULT_EPOCHS = 300;
const DEFAULT_LEARNING_RATE = 0.5;
const MAX_EPOCHS = 2000;
const EPSILON = 1e-12;

function validateProfile(example: StudentProfile): void {
  if (!Number.isFinite(example.studyHours) || example.studyHours < 0) {
    throw new Error('Study hours must be a finite, non-negative number.');
  }
  if (!Number.isFinite(example.attendanceRate) || example.attendanceRate < 0 || example.attendanceRate > 100) {
    throw new Error('Attendance rate must be a number from 0 to 100.');
  }
}

function validateExample(example: StudentExample): void {
  validateProfile(example);
  if (typeof example.passed !== 'boolean') {
    throw new Error('Outcome label must be pass or fail.');
  }
}

function sigmoid(value: number): number {
  if (value >= 0) return 1 / (1 + Math.exp(-value));
  const exp = Math.exp(value);
  return exp / (1 + exp);
}

function probabilityFor(weights: LogisticWeights, example: StudentProfile): number {
  const score = weights.bias
    + weights.studyHours * (example.studyHours / 10)
    + weights.attendanceRate * (example.attendanceRate / 100);
  return sigmoid(score);
}

export function predictStudentOutcome(
  model: LogisticWeights,
  example: StudentProfile,
): StudentPrediction {
  validateProfile(example);
  const probability = probabilityFor(model, example);
  return {
    example,
    probability,
    predicted: probability >= 0.5,
  };
}

function crossEntropyLoss(
  weights: LogisticWeights,
  examples: readonly StudentExample[],
): number {
  return examples.reduce((total, example) => {
    const probability = Math.min(
      1 - EPSILON,
      Math.max(EPSILON, probabilityFor(weights, example)),
    );
    return total - (
      Number(example.passed) * Math.log(probability)
      + Number(!example.passed) * Math.log(1 - probability)
    ) / examples.length;
  }, 0);
}

function splitStratified(dataset: readonly StudentExample[]): {
  training: StudentExample[];
  evaluation: StudentExample[];
} {
  const classes = [false, true].map((label) => dataset.filter((row) => row.passed === label));
  if (classes.some((rows) => rows.length < 2)) {
    throw new Error('The dataset needs at least two examples from each class for a holdout evaluation.');
  }

  const training: StudentExample[] = [];
  const evaluation: StudentExample[] = [];
  for (const rows of classes) {
    const trainingCount = Math.max(1, Math.floor(rows.length * 0.75));
    training.push(...rows.slice(0, trainingCount));
    evaluation.push(...rows.slice(trainingCount));
  }
  return { training, evaluation };
}

function calculateMetrics(predictions: readonly StudentPrediction[]): ClassificationMetrics {
  let truePositive = 0;
  let trueNegative = 0;
  let falsePositive = 0;
  let falseNegative = 0;

  for (const prediction of predictions) {
    if (prediction.actual === undefined) {
      throw new Error('Evaluation metrics require a known actual label for every prediction.');
    }
    if (prediction.predicted && prediction.actual) truePositive++;
    else if (!prediction.predicted && !prediction.actual) trueNegative++;
    else if (prediction.predicted) falsePositive++;
    else falseNegative++;
  }

  const accuracy = (truePositive + trueNegative) / predictions.length;
  const precision = truePositive + falsePositive === 0
    ? 0
    : truePositive / (truePositive + falsePositive);
  const recall = truePositive + falseNegative === 0
    ? 0
    : truePositive / (truePositive + falseNegative);
  const f1 = precision + recall === 0
    ? 0
    : 2 * precision * recall / (precision + recall);

  return {
    truePositive,
    trueNegative,
    falsePositive,
    falseNegative,
    accuracy,
    precision,
    recall,
    f1,
  };
}

/**
 * Trains a two-feature logistic regression model with batch gradient descent,
 * then reports metrics on a deterministic stratified holdout set.
 */
export function runLogisticRegressionExperiment(
  dataset: readonly StudentExample[] = STUDENT_EXAMPLE_DATASET,
  epochs = DEFAULT_EPOCHS,
  learningRate = DEFAULT_LEARNING_RATE,
): LogisticExperimentResult {
  if (dataset.length < 4) throw new Error('The dataset must contain at least four examples.');
  if (!Number.isInteger(epochs) || epochs < 1 || epochs > MAX_EPOCHS) {
    throw new Error(`Epoch count must be a whole number from 1 to ${MAX_EPOCHS}.`);
  }
  if (!Number.isFinite(learningRate) || learningRate <= 0 || learningRate > 1) {
    throw new Error('Learning rate must be greater than 0 and no greater than 1.');
  }
  dataset.forEach(validateExample);

  const { training, evaluation } = splitStratified(dataset);
  const weights: LogisticWeights = {
    bias: 0,
    studyHours: 0,
    attendanceRate: 0,
  };
  const trainingTrace: LogisticTrainingPoint[] = [];

  for (let epoch = 1; epoch <= epochs; epoch++) {
    let biasGradient = 0;
    let studyGradient = 0;
    let attendanceGradient = 0;

    for (const example of training) {
      const error = probabilityFor(weights, example) - Number(example.passed);
      biasGradient += error;
      studyGradient += error * (example.studyHours / 10);
      attendanceGradient += error * (example.attendanceRate / 100);
    }

    const scale = learningRate / training.length;
    weights.bias -= scale * biasGradient;
    weights.studyHours -= scale * studyGradient;
    weights.attendanceRate -= scale * attendanceGradient;

    trainingTrace.push({
      epoch,
      loss: crossEntropyLoss(weights, training),
      weights: { ...weights },
    });
  }

  const predictions = evaluation.map((example) => {
    const prediction = predictStudentOutcome(weights, example);
    return {
      ...prediction,
      actual: example.passed,
      correct: prediction.predicted === example.passed,
    };
  });

  return {
    trainingSize: training.length,
    evaluationSize: evaluation.length,
    model: { ...weights },
    trainingTrace,
    evaluation: predictions,
    metrics: calculateMetrics(predictions),
  };
}
