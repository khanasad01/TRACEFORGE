import { beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { App } from '../../App';
import { KnowledgeLab } from '../../components/KnowledgeLab';
import { backwardChain, forwardChain, type Rule } from '../../engine/inference';

const facts = ['rain', 'cold'];
const rules: Rule[] = [
  {
    id: 'rain-wets-grass',
    premises: ['rain'],
    conclusion: 'wet-grass',
    description: 'Rain makes the grass wet.',
  },
  {
    id: 'cold-wet-grass-slippery',
    premises: ['wet-grass', 'cold'],
    conclusion: 'slippery',
    description: 'Wet grass is slippery when it is cold.',
  },
  {
    id: 'wet-grass-muddy',
    premises: ['wet-grass'],
    conclusion: 'muddy',
    description: 'Wet grass makes the ground muddy.',
  },
];

beforeEach(() => {
  cleanup();
});

describe('KnowledgeLab', () => {
  it('renders the example facts and rules', () => {
    render(<KnowledgeLab />);

    expect(screen.getByRole('heading', { name: /Knowledge Representation & Inference/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Initial facts')).toHaveTextContent('rain');
    expect(screen.getByLabelText('Initial facts')).toHaveTextContent('cold');
    expect(screen.getByLabelText('Knowledge base rules')).toHaveTextContent('rain-wets-grass');
    expect(screen.getByLabelText('Knowledge base rules')).toHaveTextContent('slippery');
  });

  it('uses forward chaining to derive a multi-step conclusion', () => {
    render(<KnowledgeLab />);
    fireEvent.click(screen.getByRole('button', { name: /Run inference/i }));

    const expected = forwardChain(facts, rules, 'slippery');
    expect(expected.derivedFacts).toEqual(['wet-grass', 'slippery', 'muddy']);
    expect(screen.getByRole('status')).toHaveTextContent('Proven: slippery');
    expect(screen.getByRole('status')).toHaveTextContent('wet-grass');
    expect(screen.getByRole('status')).toHaveTextContent('slippery');
  });

  it('uses backward chaining to prove a supported goal', () => {
    render(<KnowledgeLab />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Chaining strategy' }), {
      target: { value: 'backward' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Run inference/i }));

    const expected = backwardChain(facts, rules, 'slippery');
    expect(expected.goalStatus).toBe('proven');
    expect(screen.getByRole('status')).toHaveTextContent('Proven: slippery');
    expect(screen.getByText(/Investigated goal:/)).toHaveTextContent('slippery');
  });

  it('displays unknown for a goal with no supporting fact or rule', () => {
    render(<KnowledgeLab />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Inference goal' }), {
      target: { value: 'sunny' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Chaining strategy' }), {
      target: { value: 'backward' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Run inference/i }));

    expect(backwardChain(facts, rules, 'sunny').goalStatus).toBe('unknown');
    expect(screen.getByRole('status')).toHaveTextContent('Unknown: no initial fact or rule establishes this goal.');
    expect(screen.getByText(/No rule was evaluated for this goal/)).toBeInTheDocument();
  });

  it('renders trace entries from the actual engine evaluation', () => {
    render(<KnowledgeLab />);
    fireEvent.click(screen.getByRole('button', { name: /Run inference/i }));
    const expected = forwardChain(facts, rules, 'slippery');
    const trace = within(screen.getByRole('list', { name: 'Inference evidence trace' }));
    const rows = trace.getAllByRole('listitem');
    expect(rows).toHaveLength(expected.steps.length);

    expected.steps.forEach((step, index) => {
      const row = rows[index];
      expect(row).toHaveTextContent(step.description);
      expect(row).toHaveTextContent(step.premisesSatisfied ? 'Premises satisfied' : 'Premises not satisfied');
      expect(row).toHaveTextContent(step.newFacts.length > 0 ? step.newFacts.join(' ') : 'Newly derived: none');
    });
  });

  it('reset restores the default strategy, goal, and empty evidence state', () => {
    render(<KnowledgeLab />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Inference goal' }), {
      target: { value: 'sunny' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Chaining strategy' }), {
      target: { value: 'backward' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Run inference/i }));
    fireEvent.click(screen.getByRole('button', { name: '↺ Reset' }));

    expect(screen.getByRole('combobox', { name: 'Chaining strategy' })).toHaveValue('forward');
    expect(screen.getByRole('textbox', { name: 'Inference goal' })).toHaveValue('slippery');
    expect(screen.getByRole('status')).toHaveTextContent('Run inference to inspect the derived evidence.');
  });
});

describe('AI lab navigation', () => {
  it('keeps search and Tic-Tac-Toe labs available alongside Knowledge Lab', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('tab', { name: /AI · State Space Search/i }));

    expect(screen.getByRole('button', { name: /Run search algorithm/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Tic-Tac-Toe' }));
    expect(screen.getByRole('button', { name: 'Reset game' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /Knowledge & Inference/i }));
    expect(screen.getByRole('heading', { name: /Knowledge Representation & Inference/i })).toBeInTheDocument();
  });
});
