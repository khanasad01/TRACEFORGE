import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from '../../App';
import { InterpretableMLLab } from '../../components/InterpretableMLLab';

afterEach(cleanup);

describe('InterpretableMLLab', () => {
  it('shows held-out metrics, model weights, and real prediction evidence', () => {
    render(<InterpretableMLLab />);
    fireEvent.click(screen.getByRole('button', { name: /Train & evaluate/i }));

    expect(screen.getByText(/Trained on 18 examples; evaluated on 6/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Held-out evaluation metrics/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Held-out predictions/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Model interpretation and training evidence/i })).toBeInTheDocument();
    expect(screen.getAllByText(/cross-entropy loss/i).length).toBeGreaterThan(0);
  });

  it('makes a prediction for the editable profile and resets the experiment', () => {
    render(<InterpretableMLLab />);
    fireEvent.click(screen.getByRole('button', { name: /Train & evaluate/i }));
    fireEvent.change(screen.getByRole('spinbutton', { name: /Study hours/i }), {
      target: { value: '1' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: /Attendance rate/i }), {
      target: { value: '20' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Predict profile/i }));
    expect(screen.getByText(/Predicted (not pass|pass) · P\(pass\) =/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Reset/i }));
    expect(screen.queryByRole('heading', { name: /Held-out evaluation metrics/i })).not.toBeInTheDocument();
  });
});

describe('AI interpretable ML navigation', () => {
  it('adds the ML lab without replacing search, game, or Knowledge Lab', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('tab', { name: /AI · State Space Search/i }));
    expect(screen.getByRole('tab', { name: 'State Space Search' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Tic-Tac-Toe/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Knowledge & Inference/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: /Interpretable ML/i }));
    expect(screen.getByRole('heading', { name: /Interpretable ML Experiment/i })).toBeInTheDocument();
  });
});
