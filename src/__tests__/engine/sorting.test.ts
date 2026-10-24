import { describe, expect, it } from 'vitest';
import { sortWithTrace, type SortingAlgorithm } from '../../engine/sorting';

const algorithms: SortingAlgorithm[] = ['bubble', 'insertion', 'merge'];
const cases = [
  { name: 'empty input', input: [], expected: [] },
  { name: 'single value', input: [4], expected: [4] },
  { name: 'duplicates', input: [3, 1, 3, 2, 1], expected: [1, 1, 2, 3, 3] },
  { name: 'already sorted input', input: [-3, 0, 2, 8], expected: [-3, 0, 2, 8] },
  { name: 'reverse sorted input', input: [5, 4, 3, 2, 1], expected: [1, 2, 3, 4, 5] },
  { name: 'negative values', input: [0, -8, 4, -2, 4], expected: [-8, -2, 0, 4, 4] },
];

describe.each(algorithms)('%s sort', (algorithm) => {
  it.each(cases)('sorts $name', ({ input, expected }) => {
    const result = sortWithTrace(algorithm, input);
    expect(result.sorted).toEqual(expected);
    expect(result.original).toEqual(input);
    expect(result.algorithm).toBe(algorithm);
  });

  it('produces ordered execution events with accurate states and counters', () => {
    const result = sortWithTrace(algorithm, [3, 1, 2]);

    expect(result.trace.length).toBeGreaterThan(0);
    expect(result.trace.map((event) => event.step)).toEqual(
      result.trace.map((_, index) => index + 1),
    );
    expect(result.trace.every((event) => event.algorithm === algorithm)).toBe(true);
    expect(result.trace.every((event) => event.arrayState.length === 3)).toBe(true);
    expect(result.trace[result.trace.length - 1]).toMatchObject({
      type: 'complete',
      arrayState: [1, 2, 3],
      comparisons: result.comparisons,
      swaps: result.swaps,
      writes: result.writes,
    });
  });
});

describe('sorting evidence and operation counters', () => {
  it('bubble sort records actual comparisons, swaps, and writes', () => {
    const result = sortWithTrace('bubble', [2, 1]);

    expect(result.comparisons).toBe(1);
    expect(result.swaps).toBe(1);
    expect(result.writes).toBe(2);
    expect(result.trace.map((event) => event.type)).toEqual(['compare', 'swap', 'complete']);
    expect(result.trace[1]).toMatchObject({
      indices: [0, 1],
      values: [1, 2],
      arrayState: [1, 2],
    });
  });

  it('insertion sort counts comparisons and shift/insertion writes', () => {
    const result = sortWithTrace('insertion', [3, 1, 2]);

    expect(result.comparisons).toBe(3);
    expect(result.writes).toBe(4);
    expect(result.trace.filter((event) => event.type === 'write')).toHaveLength(4);
  });

  it('merge sort records genuine merge operations and array writes', () => {
    const result = sortWithTrace('merge', [3, 1, 2]);

    expect(result.trace.some((event) => event.type === 'merge')).toBe(true);
    expect(result.trace.filter((event) => event.type === 'write')).toHaveLength(result.writes);
    expect(result.swaps).toBe(0);
    expect(result.comparisons).toBe(3);
    expect(result.writes).toBe(5);
  });

  it('early-exits on sorted bubble-sort input', () => {
    const result = sortWithTrace('bubble', [1, 2, 3, 4]);
    expect(result.comparisons).toBe(3);
    expect(result.swaps).toBe(0);
  });

  it('does not mutate the caller input', () => {
    const input = [3, 1, 2];
    sortWithTrace('merge', input);
    expect(input).toEqual([3, 1, 2]);
  });
});
