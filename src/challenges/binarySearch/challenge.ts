/**
 * Binary Search — first challenge.
 *
 * Buggy starter: uses `mid = Math.floor((low + high) / 2)` correctly,
 * but the loop condition is `low < high` instead of `low <= high`,
 * which causes it to miss elements at the rightmost position.
 *
 * This is a real, deterministic bug. The buggy starter WILL fail the
 * "target-at-right-boundary" test case with actual=-1, expected=4.
 */

import type { Challenge } from '../../types/domain';

export const BUGGY_STARTER = `// Binary Search — find the index of target in a sorted array.
// Return -1 if target is not found.
// Fix the bug so all test cases pass.
function binarySearch(array, target) {
  let low = 0;
  let high = array.length - 1;

  while (low < high) {          // ← BUG: should be low <= high
    const mid = Math.floor((low + high) / 2);
    if (array[mid] === target) {
      return mid;
    } else if (array[mid] < target) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return -1;
}`;

export const REFERENCE_CODE = `// Binary Search — correct reference implementation.
function binarySearch(array, target) {
  let low = 0;
  let high = array.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (array[mid] === target) {
      return mid;
    } else if (array[mid] < target) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return -1;
}`;

export const binarySearchChallenge: Challenge = {
  id: 'daa.binary-search.first-bad',
  title: 'Binary Search — Off-by-One Bug',
  subject: 'daa',
  algorithm: 'Binary Search',
  description: `
A student implemented binary search on a sorted array of integers.
The function should return the **index** of the target value, or **-1** if the target is absent.

Several test cases pass, but at least one reproducible failure exists.
Your task:
1. Run the tests to see which cases fail.
2. Inspect the trace to understand the execution path.
3. Read the hints if you get stuck.
4. Edit the code and re-run to verify your fix.

**Note:** Passing all provided tests is evidence that your solution handles these specific cases.
It does not prove universal correctness for all possible inputs.
  `.trim(),
  buggyStarterCode: BUGGY_STARTER,
  referenceCode: REFERENCE_CODE,
  testCases: [
    {
      id: 'empty-input',
      description: 'Empty array — target cannot exist',
      array: [],
      target: 5,
      expected: -1,
    },
    {
      id: 'singleton-found',
      description: 'Single-element array, target matches',
      array: [7],
      target: 7,
      expected: 0,
    },
    {
      id: 'singleton-not-found',
      description: 'Single-element array, target absent',
      array: [7],
      target: 3,
      expected: -1,
    },
    {
      id: 'target-at-left-boundary',
      description: 'Target is the first element',
      array: [1, 3, 5, 7, 9],
      target: 1,
      expected: 0,
    },
    {
      id: 'target-at-right-boundary',
      description: 'Target is the last element — the seeded bug fails here',
      array: [1, 3, 5, 7, 9],
      target: 9,
      expected: 4,
    },
    {
      id: 'target-in-middle',
      description: 'Target is exactly the middle element',
      array: [2, 4, 6, 8, 10],
      target: 6,
      expected: 2,
    },
    {
      id: 'target-absent',
      description: 'Target is not in the array',
      array: [1, 3, 5, 7, 9],
      target: 4,
      expected: -1,
    },
    {
      id: 'duplicate-values',
      description: 'Array has duplicates; any valid matching index is acceptable',
      array: [1, 2, 2, 2, 3],
      target: 2,
      expected: 2,
    },
    {
      id: 'larger-array',
      description: 'Larger sorted array, target near end',
      array: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      target: 10,
      expected: 10,
    },
  ],
  hints: [
    {
      level: 1,
      text: 'One of the test cases involves a target at the very last position in the array. Look at which test failed and what the algorithm returned.',
      evidenceRefs: ['target-at-right-boundary'],
    },
    {
      level: 2,
      text: 'The loop controls when the search space is considered exhausted. Think about what happens when `low` and `high` are equal — is the element at that position ever examined?',
      evidenceRefs: ['target-at-right-boundary', 'singleton-found'],
    },
    {
      level: 3,
      text: 'Compare the loop condition in the code to the standard binary search invariant: the loop should continue while `low <= high`, not merely `low < high`. When they are equal, `mid` equals `low` equals `high` — and that element is the last one to check.',
      evidenceRefs: ['target-at-right-boundary'],
    },
    {
      level: 4,
      text: 'Fix: change `while (low < high)` to `while (low <= high)`. This ensures the element at the final remaining position is examined before the loop terminates.',
      evidenceRefs: ['target-at-right-boundary'],
    },
  ],
};
