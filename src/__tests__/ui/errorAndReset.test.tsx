import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { App } from '../../App';

describe('App Malformed Input and Boundary State Handling', () => {
  beforeEach(() => {
    cleanup();
  });

  it('handles syntax errors gracefully in the UI without crashing', async () => {
    render(<App />);

    const runBtn = screen.getByRole('button', { name: /Run all test cases/i });
    const editor = screen.getByRole('textbox', { name: /Code editor/i });

    // Enter code with syntax error
    fireEvent.change(editor, { target: { value: 'function binarySearch(array, target) { let x = ; }' } });
    fireEvent.click(runBtn);

    await waitFor(() => {
      expect(screen.getByText(/⚠ Runtime error/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/At least one test case encountered a runtime error/i)).toBeInTheDocument();
  });

  it('shows a distinct timeout state when the interpreter step limit is reached', async () => {
    render(<App />);

    const runBtn = screen.getByRole('button', { name: /Run all test cases/i });
    const editor = screen.getByRole('textbox', { name: /Code editor/i });

    // Infinite loop
    fireEvent.change(editor, {
      target: {
        value: `
        function binarySearch(array, target) {
          let low = 0;
          let high = array.length - 1;
          while (low <= high) {
            // never update low/high
          }
          return -1;
        }
      `,
      },
    });
    fireEvent.click(runBtn);

    await waitFor(() => {
      expect(screen.getByText(/⏱ Execution limit reached/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/This is a bounded step budget, not a wall-clock timeout/i)).toBeInTheDocument();
  });

  it('prevents prototype pollution or access to window/document through the interpreter', async () => {
    render(<App />);

    const runBtn = screen.getByRole('button', { name: /Run all test cases/i });
    const editor = screen.getByRole('textbox', { name: /Code editor/i });

    // Attempt to access constructor or prototype
    fireEvent.change(editor, {
      target: {
        value: `
        function binarySearch(array, target) {
          const c = array.constructor;
          return -1;
        }
      `,
      },
    });
    fireEvent.click(runBtn);

    await waitFor(() => {
      expect(screen.getByText(/⚠ Runtime error/i)).toBeInTheDocument();
    });
  });

  it('clicking Reset button restores starter code and resets state', async () => {
    render(<App />);

    const runBtn = screen.getByRole('button', { name: /Run all test cases/i });
    const resetBtn = screen.getByRole('button', { name: /Reset code to buggy starter/i });
    const editor = screen.getByRole('textbox', { name: /Code editor/i });

    // Change and run
    fireEvent.change(editor, { target: { value: 'function binarySearch() { return 0; }' } });
    fireEvent.click(runBtn);

    await waitFor(() => {
      expect(screen.queryByText('Ready')).not.toBeInTheDocument();
    });

    // Click reset
    fireEvent.click(resetBtn);
    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect((editor as HTMLTextAreaElement).value).toContain('while (low < high)');
  });
});
