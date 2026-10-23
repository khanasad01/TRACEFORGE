/**
 * DAA — Linear Search algorithm instrumented with step tracking
 * for comparing complexity and operation counts against Binary Search.
 */

export interface ComparisonMetrics {
  target: number;
  arrayLength: number;
  linearOperations: number;
  binaryOperations: number;
  linearFound: boolean;
  binaryFound: boolean;
  theoreticalLinear: string;
  theoreticalBinary: string;
}

export function compareSearchOperations(array: number[], target: number): ComparisonMetrics {
  // Linear search count
  let linearOps = 0;
  let linearFound = false;
  for (let i = 0; i < array.length; i++) {
    linearOps++;
    if (array[i] === target) {
      linearFound = true;
      break;
    }
  }

  // Binary search count (standard reference)
  let binaryOps = 0;
  let binaryFound = false;
  let low = 0;
  let high = array.length - 1;

  while (low <= high) {
    binaryOps++;
    const mid = Math.floor((low + high) / 2);
    if (array[mid] === target) {
      binaryFound = true;
      break;
    } else if (array[mid] < target) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return {
    target,
    arrayLength: array.length,
    linearOperations: linearOps,
    binaryOperations: binaryOps,
    linearFound,
    binaryFound,
    theoreticalLinear: 'O(N)',
    theoreticalBinary: 'O(log N)',
  };
}
