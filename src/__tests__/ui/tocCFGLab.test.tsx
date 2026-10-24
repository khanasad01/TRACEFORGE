import { beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { App } from '../../App';
import { TOCCFGLab } from '../../components/TOCCFGLab';
import { ANBN_GRAMMAR, parseCFG } from '../../engine/tocCFG';

beforeEach(() => {
  cleanup();
});

describe('TOCCFGLab', () => {
  it('renders the curated grammar and CNF productions', () => {
    render(<TOCCFGLab />);

    expect(screen.getByRole('heading', { name: /Context-Free Grammar Parser/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /Equal a-prefix and b-suffix/i })).toHaveTextContent('S → A X');
    expect(screen.getByRole('region', { name: /Equal a-prefix and b-suffix/i })).toHaveTextContent('A → a');
  });

  it('accepts an in-language string and displays its actual parse tree', () => {
    render(<TOCCFGLab />);
    fireEvent.click(screen.getByRole('button', { name: '▶ Parse string' }));

    const result = parseCFG(ANBN_GRAMMAR, 'aaabbb');
    expect(result.accepted).toBe(true);
    expect(screen.getByRole('status')).toHaveTextContent('ACCEPTED');
    expect(screen.getByRole('tree', { name: 'Derived parse tree' })).toHaveTextContent('S');
    expect(screen.getByRole('tree', { name: 'Derived parse tree' })).toHaveTextContent('b');
  });

  it('rejects an out-of-language string with parser result', () => {
    render(<TOCCFGLab />);
    fireEvent.change(screen.getByRole('textbox', { name: 'CFG input string' }), {
      target: { value: 'aabbb' },
    });
    fireEvent.click(screen.getByRole('button', { name: '▶ Parse string' }));

    expect(parseCFG(ANBN_GRAMMAR, 'aabbb').accepted).toBe(false);
    expect(screen.getByRole('status')).toHaveTextContent('REJECTED');
    expect(screen.getByText(/No parse tree exists/)).toBeInTheDocument();
  });

  it('shows trace rows that match CYK engine evaluation events', () => {
    render(<TOCCFGLab />);
    fireEvent.change(screen.getByRole('textbox', { name: 'CFG input string' }), {
      target: { value: 'ab' },
    });
    fireEvent.click(screen.getByRole('button', { name: '▶ Parse string' }));

    const expected = parseCFG(ANBN_GRAMMAR, 'ab');
    const trace = within(screen.getByRole('region', { name: /CYK execution trace/i }));
    const rows = trace.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(expected.trace.length);
    expected.trace.forEach((step, index) => {
      expect(rows[index]).toHaveTextContent(String(step.step));
      expect(rows[index]).toHaveTextContent(`${step.production.lhs} → ${step.production.rhs.join(' ')}`);
      expect(rows[index]).toHaveTextContent(step.matching ? 'Yes' : 'No');
      expect(rows[index]).toHaveTextContent(step.addedToChart ? 'Yes' : 'No');
    });
  });

  it('reset restores the example input and idle state', () => {
    render(<TOCCFGLab />);
    fireEvent.change(screen.getByRole('textbox', { name: 'CFG input string' }), {
      target: { value: 'aabbb' },
    });
    fireEvent.click(screen.getByRole('button', { name: '▶ Parse string' }));
    fireEvent.click(screen.getByRole('button', { name: '↺ Reset' }));

    expect(screen.getByRole('textbox', { name: 'CFG input string' })).toHaveValue('aaabbb');
    expect(screen.getByRole('status')).toHaveTextContent('Run the parser to see the CYK chart evidence');
  });
});

describe('TOC CFG navigation', () => {
  it('exposes CFG parser without removing DFA and NFA labs', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('tab', { name: 'TOC · Automata Lab' }));

    fireEvent.click(screen.getByRole('tab', { name: 'CFG Parser' }));
    expect(screen.getByRole('heading', { name: /Context-Free Grammar Parser/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'NFA & Regex' }));
    expect(screen.getByRole('heading', { name: /NFA & Regular Expressions/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'DFA Simulator' }));
    expect(screen.getByLabelText('Automaton:')).toBeInTheDocument();
  });
});
