import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from '../../App';
import { TinyCPUPipelineLab } from '../../components/TinyCPUPipelineLab';

afterEach(cleanup);

describe('TinyCPUPipelineLab', () => {
  it('shows actual stage and hazard evidence for the example stream', () => {
    render(<TinyCPUPipelineLab />);
    fireEvent.click(screen.getByRole('button', { name: /Run pipeline simulation/i }));

    expect(screen.getByText('Cycle-by-cycle stage trace')).toBeInTheDocument();
    expect(screen.getByText('RAW stalls:')).toBeInTheDocument();
    expect(screen.getAllByText(/RAW hazard:/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText('bubble').length).toBeGreaterThan(0);
  });

  it('shows assembly errors and reset restores the initial idle state', () => {
    render(<TinyCPUPipelineLab />);
    const editor = screen.getByRole('textbox', { name: /Pipeline assembly program/i });
    fireEvent.change(editor, { target: { value: 'INVALID R0' } });
    fireEvent.click(screen.getByRole('button', { name: /Run pipeline simulation/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/Unknown opcode/);

    fireEvent.click(screen.getByRole('button', { name: /Reset pipeline simulation/i }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText('Cycle-by-cycle stage trace')).not.toBeInTheDocument();
    expect((editor as HTMLTextAreaElement).value.startsWith('MOV R0, 5')).toBe(true);
  });
});

describe('COA pipeline navigation', () => {
  it('keeps the original TinyCPU and exposes the cycle pipeline lab', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('tab', { name: /COA · TinyCPU Lab/i }));
    expect(screen.getByText(/COA.*TinyCPU Simulator/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /Pipeline & Hazards/i }));
    expect(screen.getByText('TinyCPU Five-Stage Pipeline')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /TinyCPU Simulator/i }));
    fireEvent.click(screen.getByRole('button', { name: /Execute TinyCPU/i }));
    expect(screen.getByText(/Sequential Instruction Trace & Dependency Warnings/i)).toBeInTheDocument();
  });
});
