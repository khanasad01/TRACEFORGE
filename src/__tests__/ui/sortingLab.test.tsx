import { beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { App } from '../../App';
import { SortingLab } from '../../components/SortingLab';
import { sortWithTrace, type SortingAlgorithm } from '../../engine/sorting';

beforeEach(() => {
  cleanup();
});

describe('SortingLab', () => {
  it.each([
    ['bubble', 'Bubble Sort'],
    ['insertion', 'Insertion Sort'],
    ['merge', 'Merge Sort'],
  ] as const)('runs %s sort and shows result and operation evidence', (algorithm, label) => {
    render(<SortingLab />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Sorting algorithm' }), {
      target: { value: algorithm },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Numeric input' }), {
      target: { value: '3, 1, 2, 1' },
    });
    fireEvent.click(screen.getByRole('button', { name: '▶ Run sort' }));

    const result = sortWithTrace(algorithm, [3, 1, 2, 1]);
    expect(screen.getByRole('status')).toHaveTextContent(`${label} complete`);
    expect(screen.getByRole('region', { name: 'Original vs. Sorted' })).toHaveTextContent('[3, 1, 2, 1]');
    expect(screen.getByRole('region', { name: 'Original vs. Sorted' })).toHaveTextContent('[1, 1, 2, 3]');
    expect(screen.getByRole('region', { name: 'Observed operation counts' })).toHaveTextContent(String(result.comparisons));
    expect(screen.getByRole('region', { name: 'Theoretical time complexity' })).toHaveTextContent(result.complexity.average);
  });

  it('renders each displayed trace row from the engine events', () => {
    render(<SortingLab />);
    const algorithm: SortingAlgorithm = 'merge';
    fireEvent.change(screen.getByRole('combobox', { name: 'Sorting algorithm' }), {
      target: { value: algorithm },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Numeric input' }), {
      target: { value: '4, 1, 3' },
    });
    fireEvent.click(screen.getByRole('button', { name: '▶ Run sort' }));

    const expected = sortWithTrace(algorithm, [4, 1, 3]);
    const trace = within(screen.getByRole('region', { name: /Execution trace — Merge Sort/i }));
    const rows = trace.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(expected.trace.length);
    expected.trace.forEach((event, index) => {
      expect(rows[index]).toHaveTextContent(String(event.step));
      expect(rows[index]).toHaveTextContent(event.type);
      expect(rows[index]).toHaveTextContent(event.arrayState.join(', '));
      expect(rows[index]).toHaveTextContent(`${event.comparisons}/${event.swaps}/${event.writes}`);
    });
  });

  it('shows an invalid-input state and does not show stale result evidence', () => {
    render(<SortingLab />);
    fireEvent.click(screen.getByRole('button', { name: '▶ Run sort' }));
    expect(screen.getByRole('status')).toHaveTextContent('Bubble Sort complete');

    fireEvent.change(screen.getByRole('textbox', { name: 'Numeric input' }), {
      target: { value: '1, nope, 2' },
    });
    fireEvent.click(screen.getByRole('button', { name: '▶ Run sort' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Enter finite numbers separated by commas or spaces.');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /Execution trace/i })).not.toBeInTheDocument();
  });

  it('rejects malformed comma-separated input', () => {
    render(<SortingLab />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Numeric input' }), {
      target: { value: '1,,2' },
    });
    fireEvent.click(screen.getByRole('button', { name: '▶ Run sort' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Enter finite numbers separated by commas or spaces.');
  });

  it('reset restores the default algorithm and input and clears results', () => {
    render(<SortingLab />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Sorting algorithm' }), {
      target: { value: 'merge' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Numeric input' }), {
      target: { value: '8, 1' },
    });
    fireEvent.click(screen.getByRole('button', { name: '▶ Run sort' }));
    fireEvent.click(screen.getByRole('button', { name: '↺ Reset' }));

    expect(screen.getByRole('combobox', { name: 'Sorting algorithm' })).toHaveValue('bubble');
    expect(screen.getByRole('textbox', { name: 'Numeric input' })).toHaveValue('8, 3, 5, 3, -2, 9, 1');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /Execution trace/i })).not.toBeInTheDocument();
  });

  it('restores the original Binary Search debugger and its evidence export in DAA navigation', async () => {
    render(<App />);

    expect(screen.getByRole('button', { name: /Run all test cases/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Sorting Lab' }));
    expect(screen.getByRole('heading', { name: /Sorting Algorithms Lab/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Binary Search Debugger' }));
    expect(screen.getByRole('button', { name: /Run all test cases/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Run all test cases/i }));
    expect(await screen.findByRole('button', { name: /Export evidence/i })).toBeInTheDocument();
  });
});
