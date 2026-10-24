import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from '../../App';
import { CacheLab } from '../../components/CacheLab';

afterEach(cleanup);

describe('CacheLab', () => {
  it('reports actual hits, misses, and per-access cache evidence', () => {
    render(<CacheLab />);
    fireEvent.click(screen.getByRole('button', { name: /Simulate cache/i }));

    expect(screen.getByRole('status')).toHaveTextContent('Accesses: 8');
    expect(screen.getByRole('status')).toHaveTextContent('Hits: 7');
    expect(screen.getByRole('status')).toHaveTextContent('Misses: 1');
    expect(screen.getByRole('table')).toHaveTextContent('HIT');
    expect(screen.getByRole('table')).toHaveTextContent('MISS (cold)');
  });

  it('rejects invalid addresses and reset restores the example', () => {
    render(<CacheLab />);
    fireEvent.change(screen.getByRole('textbox', { name: /Cache addresses/i }), {
      target: { value: '-1, 2' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Simulate cache/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/non-negative 31-bit/);

    fireEvent.click(screen.getByRole('button', { name: /Reset/i }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect((screen.getByRole('textbox', { name: /Cache addresses/i }) as HTMLTextAreaElement)
      .value).toBe('0, 1, 2, 3, 0, 1, 2, 3');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});

describe('COA cache navigation', () => {
  it('retains the CPU, pipeline, and I/O labs while adding cache simulation', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('tab', { name: /COA · TinyCPU Lab/i }));
    fireEvent.click(screen.getByRole('tab', { name: /Cache Hierarchy/i }));
    expect(screen.getByRole('heading', { name: /Cache Hierarchy Experiment/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: /Interactive I\/O/i }));
    expect(screen.getByRole('heading', { name: /Interactive I\/O Experiment/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: /Pipeline & Hazards/i }));
    expect(screen.getByRole('heading', { name: /Five-Stage Pipeline/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: /TinyCPU Simulator/i }));
    expect(screen.getByRole('heading', { name: /TinyCPU Simulator/i })).toBeInTheDocument();
  });
});
