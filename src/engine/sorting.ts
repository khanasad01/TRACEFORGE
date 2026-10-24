export type SortingAlgorithm = 'bubble' | 'insertion' | 'merge';

export type SortingTraceEventType =
  | 'compare'
  | 'swap'
  | 'write'
  | 'merge'
  | 'complete';

export interface SortingTraceEvent {
  algorithm: SortingAlgorithm;
  step: number;
  type: SortingTraceEventType;
  arrayState: number[];
  indices?: number[];
  values?: number[];
  range?: [number, number];
  message: string;
  comparisons: number;
  swaps: number;
  writes: number;
}

export interface SortingResult {
  algorithm: SortingAlgorithm;
  original: number[];
  sorted: number[];
  comparisons: number;
  swaps: number;
  writes: number;
  trace: SortingTraceEvent[];
  complexity: {
    best: string;
    average: string;
    worst: string;
  };
}

const COMPLEXITY: Record<SortingAlgorithm, SortingResult['complexity']> = {
  bubble: { best: 'O(N) with early exit', average: 'O(N²)', worst: 'O(N²)' },
  insertion: { best: 'O(N)', average: 'O(N²)', worst: 'O(N²)' },
  merge: { best: 'O(N log N)', average: 'O(N log N)', worst: 'O(N log N)' },
};

export function sortWithTrace(
  algorithm: SortingAlgorithm,
  input: readonly number[],
): SortingResult {
  const original = [...input];
  const array = [...input];
  const trace: SortingTraceEvent[] = [];
  let comparisons = 0;
  let swaps = 0;
  let writes = 0;

  const record = (
    type: SortingTraceEventType,
    message: string,
    details: Pick<SortingTraceEvent, 'indices' | 'values' | 'range'> = {},
  ) => {
    trace.push({
      algorithm,
      step: trace.length + 1,
      type,
      arrayState: [...array],
      message,
      comparisons,
      swaps,
      writes,
      ...details,
    });
  };

  if (algorithm === 'bubble') {
    for (let end = array.length - 1; end > 0; end--) {
      let swapped = false;
      for (let index = 0; index < end; index++) {
        comparisons++;
        record('compare', `Compare indices ${index} and ${index + 1}.`, {
          indices: [index, index + 1],
          values: [array[index], array[index + 1]],
        });
        if (array[index] > array[index + 1]) {
          [array[index], array[index + 1]] = [array[index + 1], array[index]];
          swaps++;
          writes += 2;
          swapped = true;
          record('swap', `Swap indices ${index} and ${index + 1}.`, {
            indices: [index, index + 1],
            values: [array[index], array[index + 1]],
          });
        }
      }
      if (!swapped) break;
    }
  } else if (algorithm === 'insertion') {
    for (let index = 1; index < array.length; index++) {
      const value = array[index];
      let position = index;
      while (position > 0) {
        comparisons++;
        record('compare', `Compare key ${value} with index ${position - 1}.`, {
          indices: [position - 1, index],
          values: [array[position - 1], value],
        });
        if (array[position - 1] <= value) break;

        array[position] = array[position - 1];
        writes++;
        record('write', `Shift ${array[position]} right to index ${position}.`, {
          indices: [position],
          values: [array[position]],
        });
        position--;
      }
      if (position !== index) {
        array[position] = value;
        writes++;
        record('write', `Insert key ${value} at index ${position}.`, {
          indices: [position],
          values: [value],
        });
      }
    }
  } else {
    const mergeSort = (start: number, end: number): void => {
      if (start >= end) return;

      const middle = Math.floor((start + end) / 2);
      mergeSort(start, middle);
      mergeSort(middle + 1, end);

      const left = array.slice(start, middle + 1);
      const right = array.slice(middle + 1, end + 1);
      let leftIndex = 0;
      let rightIndex = 0;
      let target = start;

      while (leftIndex < left.length && rightIndex < right.length) {
        comparisons++;
        record('compare', `Compare ${left[leftIndex]} and ${right[rightIndex]} while merging.`, {
          indices: [start + leftIndex, middle + 1 + rightIndex],
          values: [left[leftIndex], right[rightIndex]],
          range: [start, end],
        });
        if (left[leftIndex] <= right[rightIndex]) {
          array[target] = left[leftIndex];
          leftIndex++;
        } else {
          array[target] = right[rightIndex];
          rightIndex++;
        }
        writes++;
        record('write', `Write ${array[target]} to index ${target}.`, {
          indices: [target],
          values: [array[target]],
          range: [start, end],
        });
        target++;
      }

      while (leftIndex < left.length) {
        array[target] = left[leftIndex];
        leftIndex++;
        writes++;
        record('write', `Write ${array[target]} to index ${target}.`, {
          indices: [target],
          values: [array[target]],
          range: [start, end],
        });
        target++;
      }

      while (rightIndex < right.length) {
        array[target] = right[rightIndex];
        rightIndex++;
        writes++;
        record('write', `Write ${array[target]} to index ${target}.`, {
          indices: [target],
          values: [array[target]],
          range: [start, end],
        });
        target++;
      }

      record('merge', `Merged indices ${start}–${end}.`, {
        range: [start, end],
        values: array.slice(start, end + 1),
      });
    };

    mergeSort(0, array.length - 1);
  }

  record('complete', 'Sorting complete.', {
    range: array.length === 0 ? undefined : [0, array.length - 1],
    values: [...array],
  });

  return {
    algorithm,
    original,
    sorted: array,
    comparisons,
    swaps,
    writes,
    trace,
    complexity: COMPLEXITY[algorithm],
  };
}
