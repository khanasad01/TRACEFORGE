import { beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { App } from '../../App';
import { TOCPDALab } from '../../components/TOCPDALab';
import { ANBN_PDA, simulatePDA } from '../../engine/tocPDA';

beforeEach(() => {
  cleanup();
});

describe('TOCPDALab', () => {
  it('renders the PDA definition and stack transitions', () => {
    render(<TOCPDALab />);

    expect(screen.getByRole('heading', { name: /Pushdown Automaton/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /Equal a-prefix and b-suffix/i })).toHaveTextContent('push-first-a');
    expect(screen.getByRole('region', { name: /Equal a-prefix and b-suffix/i })).toHaveTextContent('accept-empty-stack');
  });

  it('accepts a matching input and displays the simulator evidence', () => {
    render(<TOCPDALab />);
    fireEvent.click(screen.getByRole('button', { name: '▶ Run PDA' }));

    expect(simulatePDA(ANBN_PDA, 'aaabbb').accepted).toBe(true);
    expect(screen.getByRole('status')).toHaveTextContent('ACCEPTED');
    expect(screen.getByRole('region', { name: /Configuration trace/i })).toHaveTextContent('pop-matching-a');
  });

  it('rejects mismatched counts and reports invalid input symbols', () => {
    render(<TOCPDALab />);
    fireEvent.change(screen.getByRole('textbox', { name: 'PDA input string' }), {
      target: { value: 'aabbb' },
    });
    fireEvent.click(screen.getByRole('button', { name: '▶ Run PDA' }));
    expect(screen.getByRole('status')).toHaveTextContent('REJECTED');

    fireEvent.change(screen.getByRole('textbox', { name: 'PDA input string' }), {
      target: { value: 'a1b' },
    });
    fireEvent.click(screen.getByRole('button', { name: '▶ Run PDA' }));
    expect(screen.getByRole('alert')).toHaveTextContent("Input symbol '1'");
  });

  it('renders trace events from the engine in order', () => {
    render(<TOCPDALab />);
    fireEvent.change(screen.getByRole('textbox', { name: 'PDA input string' }), {
      target: { value: 'ab' },
    });
    fireEvent.click(screen.getByRole('button', { name: '▶ Run PDA' }));

    const expected = simulatePDA(ANBN_PDA, 'ab');
    const trace = within(screen.getByRole('region', { name: /Configuration trace/i }));
    const rows = trace.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(expected.trace.length);
    expected.trace.forEach((step, index) => {
      expect(rows[index]).toHaveTextContent(String(step.step));
      expect(rows[index]).toHaveTextContent(step.kind);
      if (step.transitionId) expect(rows[index]).toHaveTextContent(step.transitionId);
    });
  });

  it('reset returns to the example input and clears trace', () => {
    render(<TOCPDALab />);
    fireEvent.click(screen.getByRole('button', { name: '▶ Run PDA' }));
    fireEvent.click(screen.getByRole('button', { name: '↺ Reset' }));

    expect(screen.getByRole('textbox', { name: 'PDA input string' })).toHaveValue('aaabbb');
    expect(screen.getByRole('status')).toHaveTextContent('Run the PDA');
    expect(screen.queryByRole('region', { name: /Configuration trace/i })).not.toBeInTheDocument();
  });
});

describe('TOC PDA navigation', () => {
  it('preserves DFA, NFA, and CFG lab navigation', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('tab', { name: 'TOC · Automata Lab' }));
    fireEvent.click(screen.getByRole('tab', { name: 'PDA Simulator' }));
    expect(screen.getByRole('heading', { name: /Pushdown Automaton/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'CFG Parser' }));
    expect(screen.getByRole('heading', { name: /Context-Free Grammar Parser/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'NFA & Regex' }));
    expect(screen.getByRole('heading', { name: /NFA & Regular Expressions/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'DFA Simulator' }));
    expect(screen.getByLabelText('Automaton:')).toBeInTheDocument();
  });
});
