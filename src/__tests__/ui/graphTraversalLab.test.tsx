import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from '../../App';
import { GraphTraversalLab } from '../../components/GraphTraversalLab';

afterEach(cleanup);

describe('GraphTraversalLab', () => {
  it('shows BFS traversal order and trace data from the engine', () => {
    render(<GraphTraversalLab />);
    fireEvent.click(screen.getByRole('button', { name: /Run traversal/i }));

    expect(screen.getByText(/BFS visited 6 of 7 vertices/)).toBeInTheDocument();
    expect(screen.getByText('A → B → C → D → E → F')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Execution trace/i })).toBeInTheDocument();
  });

  it('switches to DFS and reports invalid input clearly', () => {
    render(<GraphTraversalLab />);
    fireEvent.change(screen.getByRole('combobox', { name: /Traversal algorithm/i }), {
      target: { value: 'DFS' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Run traversal/i }));
    expect(screen.getByText(/DFS visited/)).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: /Start vertex/i }), {
      target: { value: 'missing' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Run traversal/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/not in the graph/);
    expect(screen.queryByRole('heading', { name: /Execution trace/i })).not.toBeInTheDocument();
  });

  it('reset restores the example and navigation preserves existing DAA labs', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('tab', { name: /Graph Traversal/i }));
    expect(screen.getByText(/DAA — Graph Traversal Lab/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Reset/i }));
    expect(
      (screen.getByRole('textbox', { name: /Graph adjacency list/i }) as HTMLTextAreaElement)
        .value.startsWith('A: B, C'),
    ).toBe(true);

    fireEvent.click(screen.getByRole('tab', { name: /Sorting Lab/i }));
    expect(screen.getByText(/DAA — Sorting Algorithms Lab/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: /Binary Search Debugger/i }));
    expect(screen.getByText(/Binary Search — Off-by-One Bug/i)).toBeInTheDocument();
  });
});
