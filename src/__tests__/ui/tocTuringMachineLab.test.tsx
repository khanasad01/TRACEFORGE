import { beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { App } from '../../App';
import { TOCTuringMachineLab } from '../../components/TOCTuringMachineLab';
import { runTuringMachine, UNARY_INCREMENT_TM } from '../../engine/tocTM';

beforeEach(() => {
  cleanup();
});

describe('TOCTuringMachineLab', () => {
  it('renders machine transition rules', () => {
    render(<TOCTuringMachineLab />);

    expect(screen.getByRole('heading', { name: /Simplified Turing Machine/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Unary Increment' })).toHaveTextContent('scan-right-over-one');
    expect(screen.getByRole('region', { name: 'Unary Increment' })).toHaveTextContent('write-increment-and-halt');
  });

  it('runs unary increment and reports actual machine output', () => {
    render(<TOCTuringMachineLab />);
    fireEvent.click(screen.getByRole('button', { name: '▶ Run machine' }));

    expect(runTuringMachine(UNARY_INCREMENT_TM, '111').output).toBe('1111');
    expect(screen.getByRole('status')).toHaveTextContent('HALTED — output 1111');
  });

  it('shows the execution trace events from the machine engine', () => {
    render(<TOCTuringMachineLab />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Unary input' }), {
      target: { value: '1' },
    });
    fireEvent.click(screen.getByRole('button', { name: '▶ Run machine' }));

    const expected = runTuringMachine(UNARY_INCREMENT_TM, '1');
    const trace = within(screen.getByRole('region', { name: /Tape execution trace/i }));
    const rows = trace.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(expected.trace.length);
    expected.trace.forEach((step, index) => {
      expect(rows[index]).toHaveTextContent(String(step.step));
      expect(rows[index]).toHaveTextContent(step.transitionId);
      expect(rows[index]).toHaveTextContent(`${step.stateAfter} / ${step.headAfter}`);
    });
  });

  it('reports invalid input and reset clears result state', () => {
    render(<TOCTuringMachineLab />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Unary input' }), {
      target: { value: '12' },
    });
    fireEvent.click(screen.getByRole('button', { name: '▶ Run machine' }));
    expect(screen.getByRole('alert')).toHaveTextContent("Input symbol '2'");

    fireEvent.click(screen.getByRole('button', { name: '↺ Reset' }));
    expect(screen.getByRole('textbox', { name: 'Unary input' })).toHaveValue('111');
    expect(screen.getByRole('status')).toHaveTextContent('Run the machine');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('Turing machine TOC navigation', () => {
  it('keeps the existing automata, regex, CFG, and PDA labs reachable', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('tab', { name: 'TOC · Automata Lab' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Turing Machine' }));
    expect(screen.getByRole('heading', { name: /Simplified Turing Machine/i })).toBeInTheDocument();
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
