import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { App } from '../../App';

describe('TRACEFORGE Integrated Four-Subject Navigation', () => {
  beforeEach(() => {
    cleanup();
  });

  it('allows navigation across all four academic labs and verifies interactive elements', () => {
    render(<App />);

    // 1. Initial Lab: DAA
    expect(screen.getByText(/Binary Search — Off-by-One Bug/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Run all test cases/i })).toBeInTheDocument();

    // 2. Switch to AI Foundations Lab
    const aiTab = screen.getByRole('tab', { name: /AI · State Space Search/i });
    fireEvent.click(aiTab);

    expect(screen.getByText(/AI Foundations — State Space Search & Reasoning/i)).toBeInTheDocument();
    const runAiBtn = screen.getByRole('button', { name: /Run search algorithm/i });
    expect(runAiBtn).toBeInTheDocument();

    // Execute A*
    fireEvent.click(runAiBtn);
    expect(screen.getByText(/Goal Found/i)).toBeInTheDocument();
    expect(screen.getByText(/Decision & State Trace/i)).toBeInTheDocument();

    // 3. Switch to TOC Automata Lab
    const tocTab = screen.getByRole('tab', { name: /TOC · Automata Lab/i });
    fireEvent.click(tocTab);

    expect(screen.getByText(/Theory of Computation \(TOC\) — Automata & Formal Languages/i)).toBeInTheDocument();
    expect(screen.getByText(/Formal DFA Definition: Binary Strings Ending in "01"/i)).toBeInTheDocument();

    // Verify DFA selector exists
    const dfaSelect = screen.getByLabelText('Automaton:');
    expect(dfaSelect).toBeInTheDocument();

    const testDfaBtn = screen.getByRole('button', { name: /Simulate DFA/i });
    fireEvent.click(testDfaBtn);
    expect(screen.getByText('✓ ACCEPTED')).toBeInTheDocument();

    // Switch to Even Number of 1s DFA
    fireEvent.change(dfaSelect, { target: { value: 'toc.dfa.even-ones' } });
    expect(screen.getByText(/Formal DFA Definition: Even Number of 1s/i)).toBeInTheDocument();

    // 4. Switch to COA TinyCPU Lab
    const coaTab = screen.getByRole('tab', { name: /COA · TinyCPU Lab/i });
    fireEvent.click(coaTab);

    expect(screen.getByText(/Computer Organization & Architecture \(COA\) — TinyCPU Simulator/i)).toBeInTheDocument();

    // Verify program selector exists
    const programSelect = screen.getByLabelText('Program:');
    expect(programSelect).toBeInTheDocument();

    const runCpuBtn = screen.getByRole('button', { name: /Execute TinyCPU/i });
    fireEvent.click(runCpuBtn);

    expect(screen.getByText(/CPU Architectural State/i)).toBeInTheDocument();
    expect(screen.getByText(/Sequential Instruction Trace & Dependency Warnings/i)).toBeInTheDocument();
  });

  it('verifies export evidence button appears after running DAA lab', async () => {
    const { container } = render(<App />);

    // Initially no export button (no report)
    expect(container.querySelector('button[aria-label*="Export evidence"]')).not.toBeInTheDocument();

    // Run the DAA binary search tests
    const runBtn = screen.getByRole('button', { name: /Run all test cases/i });
    fireEvent.click(runBtn);

    // After running, export button should appear (handleRun uses setTimeout)
    const exportBtn = await screen.findByRole('button', { name: /Export evidence/i });
    expect(exportBtn).toBeInTheDocument();
  });
});
