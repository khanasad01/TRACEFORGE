import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { App } from '../../App';

describe('App End-to-End User Journey', () => {
  it('completes the full learner debugging workflow', async () => {
    render(<App />);

    // 1. Initial State
    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText('Binary Search — Off-by-One Bug')).toBeInTheDocument();
    expect(screen.getByText('Run the tests to see results.')).toBeInTheDocument();
    expect(screen.getByText('Run the tests to see the execution trace.')).toBeInTheDocument();
    expect(screen.getByText('Run the tests first to see diagnostics.')).toBeInTheDocument();

    const runBtn = screen.getByRole('button', { name: /Run all test cases/i });
    const editor = screen.getByRole('textbox', { name: /Code editor/i });

    // 2. Click Run Tests on Buggy Starter
    fireEvent.click(runBtn);

    // Wait for test results
    await waitFor(() => {
      expect(screen.getByText(/6 \/ 9 passed/i)).toBeInTheDocument();
    });

    // 3. Inspect Failed Test & Trace
    expect(screen.getByText(/✗ Tests failed/i)).toBeInTheDocument();
    expect(screen.getByText(/Target is the last element — the seeded bug fails here/i)).toBeInTheDocument();

    // Auto-selected first failing test trace
    expect(screen.getByText(/Showing actual execution trace for:/i)).toBeInTheDocument();
    expect(screen.getAllByText('target-at-right-boundary').length).toBeGreaterThanOrEqual(1);

    // 4. Inspect Diagnostics & Progressive Hints
    expect(screen.getByText(/The test "target-at-right-boundary" failed/i)).toBeInTheDocument();

    // Show hints progressively
    const hintBtn = screen.getByRole('button', { name: /Show first hint/i });
    fireEvent.click(hintBtn);
    expect(screen.getByText(/One of the test cases involves a target at the very last position/i)).toBeInTheDocument();

    const hint2Btn = screen.getByRole('button', { name: /Show hint 2/i });
    fireEvent.click(hint2Btn);
    expect(screen.getByText(/The loop controls when the search space is considered exhausted/i)).toBeInTheDocument();

    // 5. Edit the Solution (fix off-by-one bug)
    const buggyCode = (editor as HTMLTextAreaElement).value;
    const fixedCode = buggyCode.replace('while (low < high)', 'while (low <= high)');
    fireEvent.change(editor, { target: { value: fixedCode } });

    // 6. Rerun Tests
    fireEvent.click(runBtn);

    // 7. Verify Success State
    await waitFor(() => {
      expect(screen.getByText(/9 \/ 9 passed/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/✓ All tests passed/i)).toBeInTheDocument();
    expect(screen.getByText(/All tests passed!/i)).toBeInTheDocument();
  });
});
