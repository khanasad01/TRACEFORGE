import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from '../../App';
import { TinyCPUIOLab } from '../../components/TinyCPUIOLab';

afterEach(cleanup);

describe('TinyCPUIOLab', () => {
  it('executes the input-add-output example and displays its actual trace', () => {
    render(<TinyCPUIOLab />);
    fireEvent.click(screen.getByRole('button', { name: /Run I\/O experiment/i }));

    expect(screen.getByText('12, 7')).toBeInTheDocument();
    expect(screen.getByLabelText('Output values')).toHaveTextContent('19');
    expect(screen.getByText(/Wrote 19 from R0 to output/)).toBeInTheDocument();
  });

  it('reports invalid input and input exhaustion explicitly', () => {
    render(<TinyCPUIOLab />);
    fireEvent.change(screen.getByRole('textbox', { name: /Input bytes/i }), {
      target: { value: '999' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Run I\/O experiment/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/0 to 255/);

    fireEvent.change(screen.getByRole('textbox', { name: /Input bytes/i }), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Run I\/O experiment/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/Input exhausted/);
  });

  it('reset restores the example program and input values', () => {
    render(<TinyCPUIOLab />);
    fireEvent.change(screen.getByRole('textbox', { name: /Input bytes/i }), {
      target: { value: '4' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Run I\/O experiment/i }));
    fireEvent.click(screen.getByRole('button', { name: /Reset I\/O experiment/i }));

    expect(screen.getByRole('textbox', { name: /Input bytes/i })).toHaveValue('12, 7');
    expect(screen.queryByText('Instruction I/O trace')).not.toBeInTheDocument();
  });
});

describe('COA I/O navigation', () => {
  it('keeps the CPU and pipeline labs accessible alongside I/O', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('tab', { name: /COA · TinyCPU Lab/i }));
    fireEvent.click(screen.getByRole('tab', { name: /Interactive I\/O/i }));
    expect(screen.getByText('TinyCPU Interactive I/O Experiment')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /Pipeline & Hazards/i }));
    expect(screen.getByText('TinyCPU Five-Stage Pipeline')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: /TinyCPU Simulator/i }));
    fireEvent.click(screen.getByRole('button', { name: /Execute TinyCPU/i }));
    expect(screen.getByText(/Sequential Instruction Trace & Dependency Warnings/i)).toBeInTheDocument();
  });
});
