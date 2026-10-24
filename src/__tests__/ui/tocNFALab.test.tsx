import { beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { App } from '../../App';
import { TOCNFALab } from '../../components/TOCNFALab';
import { compileRegularExpression, simulateNFA } from '../../engine/tocNFA';

beforeEach(() => {
  cleanup();
});

describe('TOCNFALab', () => {
  it('renders the supported regular-expression subset and presets', () => {
    render(<TOCNFALab />);

    expect(screen.getByRole('heading', { name: /NFA & Regular Expressions/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Regular expression preset' })).toBeInTheDocument();
    expect(screen.getByText(/No escaping, character classes/)).toBeInTheDocument();
  });

  it('compiles and accepts a valid input, showing generated NFA transitions', () => {
    render(<TOCNFALab />);
    fireEvent.click(screen.getByRole('button', { name: /Compile & simulate/i }));

    const nfa = compileRegularExpression('(0|1)*01');
    const result = simulateNFA(nfa, '1101');
    expect(result.accepted).toBe(true);
    expect(screen.getByRole('status')).toHaveTextContent('ACCEPTED');
    expect(screen.getByRole('region', { name: 'Compiled epsilon-NFA' })).toHaveTextContent(nfa.startState);
    expect(screen.getByRole('region', { name: 'Compiled epsilon-NFA' })).toHaveTextContent('ε');
  });

  it('displays rejected and invalid-alphabet outcomes from the simulator', () => {
    render(<TOCNFALab />);
    fireEvent.change(screen.getByRole('textbox', { name: 'NFA input string' }), {
      target: { value: '1100' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Compile & simulate/i }));
    expect(screen.getByRole('status')).toHaveTextContent('REJECTED');

    fireEvent.change(screen.getByRole('textbox', { name: 'NFA input string' }), {
      target: { value: '1102' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Compile & simulate/i }));
    expect(screen.getByRole('status')).toHaveTextContent("Symbol '2' at index 3");
  });

  it('shows trace rows matching the NFA simulator result', () => {
    render(<TOCNFALab />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Regular expression' }), {
      target: { value: 'a|bc' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'NFA input string' }), {
      target: { value: 'bc' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Compile & simulate/i }));

    const expected = simulateNFA(compileRegularExpression('a|bc'), 'bc');
    const traceTable = within(screen.getByRole('region', { name: 'Execution trace' }));
    const rows = traceTable.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(expected.trace.length);
    expected.trace.forEach((step, index) => {
      expect(rows[index]).toHaveTextContent(String(step.step));
      expect(rows[index]).toHaveTextContent(step.symbol);
      expect(rows[index]).toHaveTextContent(step.activeStatesAfter.join(', ') || '∅');
    });
  });

  it('surfaces malformed regular expression errors and reset clears output', () => {
    render(<TOCNFALab />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Regular expression' }), {
      target: { value: 'a|' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Compile & simulate/i }));
    expect(screen.getByRole('alert')).toHaveTextContent("Expected an expression after '|'");

    fireEvent.click(screen.getByRole('button', { name: '↺ Reset' }));
    expect(screen.getByRole('textbox', { name: 'Regular expression' })).toHaveValue('(0|1)*01');
    expect(screen.getByRole('textbox', { name: 'NFA input string' })).toHaveValue('1101');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

describe('TOC navigation', () => {
  it('preserves DFA simulator and exposes the NFA lab', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('tab', { name: 'TOC · Automata Lab' }));
    expect(screen.getByLabelText('Automaton:')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'NFA & Regex' }));
    expect(screen.getByRole('heading', { name: /NFA & Regular Expressions/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'DFA Simulator' }));
    expect(screen.getByLabelText('Automaton:')).toBeInTheDocument();
  });
});
