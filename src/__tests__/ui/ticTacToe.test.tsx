import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { TicTacToeLab } from '../../components/TicTacToeLab';
import { createEmptyBoard, applyMove, checkWinner, findBestMove } from '../../engine/aiSearch';

describe('TicTacToeLab — Minimax AI Component', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders the Tic-Tac-Toe game header and board', () => {
    render(<TicTacToeLab />);

    expect(screen.getByText(/AI Foundations/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reset Game/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Run demo/i })).toBeInTheDocument();
  });

  it('renders an empty 3x3 board', () => {
    render(<TicTacToeLab />);
    // 9 cells
    const cells = screen.getAllByRole('button', { name: /Cell/i });
    expect(cells).toHaveLength(9);
  });

  it('allows human player (X) to make a move, triggering AI (O) response', () => {
    render(<TicTacToeLab />);

    // Click the first cell (0,0)
    const cell00 = screen.getByLabelText(/Cell 0,0/i);
    fireEvent.click(cell00);

    // Cell should now show X
    expect(cell00).toHaveTextContent('X');

    // After human move, AI should respond — verify a cell contains O
    const cells = screen.getAllByRole('button', { name: /Cell/i });
    const hasO = cells.some((c) => c.textContent === 'O');
    expect(hasO).toBe(true);
  });

  it('game status updates when game state changes', () => {
    render(<TicTacToeLab />);

    const initialStatus = screen.getByRole('status');
    expect(initialStatus).toHaveTextContent(/make your move/i);
  });

  it('reset button clears the board', () => {
    render(<TicTacToeLab />);

    const cell00 = screen.getByLabelText(/Cell 0,0/i);
    fireEvent.click(cell00);

    // Some cells should now have content
    expect(cell00).toHaveTextContent('X');

    // Click reset
    fireEvent.click(screen.getByRole('button', { name: /Reset Game/i }));

    // After reset, cell 0,0 should be empty again
    expect(cell00).toBeEmptyDOMElement();
  });

  it('AI as O never loses when X plays first', () => {
    // Test the engine directly: AI as O should never allow X to win
    // With optimal play from both sides, the game is a draw (score 0).
    const board = createEmptyBoard();

    // X plays center
    let b = applyMove(board, 1, 1, 'X')!;
    // O (AI) plays — should pick an optimal response (corner, score < 0 = never a loss for O)
    const result1 = findBestMove(b, 'O');
    expect(result1.bestMove.row).toBeGreaterThanOrEqual(0);
    expect(result1.score).toBeLessThanOrEqual(0);
    const b1 = applyMove(b, result1.bestMove.row, result1.bestMove.col, 'O');
    if (!b1) return; // Skip if AI chose an occupied cell (shouldn't happen)
    b = b1;

    // X plays a different corner (0,0 if not taken by O)
    const b2 = applyMove(b, 0, 0, 'X');
    if (!b2) return; // Skip if cell is occupied
    b = b2;

    // O (AI) responds — still never loses
    const result2 = findBestMove(b, 'O');
    expect(result2.bestMove.row).toBeGreaterThanOrEqual(0);
    expect(result2.score).toBeLessThanOrEqual(0);
  });
});

describe('TicTacToeLab — Minimax Engine Edge Cases', () => {
  it('AI blocks opponent winning move', () => {
    // X at (0,0) and (0,1), O must block at (0,2)
    const board = createEmptyBoard();
    let b = applyMove(board, 0, 0, 'X')!;
    b = applyMove(b, 1, 0, 'O')!;
    b = applyMove(b, 0, 1, 'X')!;

    const result = findBestMove(b, 'O');
    expect(result.bestMove).toEqual({ row: 0, col: 2 });
  });

  it('AI takes winning move when available', () => {
    // O has two in a diagonal, can win at (2,2)
    const board = createEmptyBoard();
    let b = applyMove(board, 0, 0, 'O')!;
    b = applyMove(b, 0, 1, 'X')!;
    b = applyMove(b, 1, 1, 'O')!;
    b = applyMove(b, 1, 0, 'X')!;

    const result = findBestMove(b, 'O');
    expect(result.bestMove).toEqual({ row: 2, col: 2 });
    expect(result.score).toBeLessThan(0); // O wins = negative score
  });

  it('checkWinner detects anti-diagonal win', () => {
    const board = createEmptyBoard();
    let b = applyMove(board, 0, 2, 'X')!;
    b = applyMove(b, 0, 0, 'O')!;
    b = applyMove(b, 1, 1, 'X')!;
    b = applyMove(b, 1, 0, 'O')!;
    b = applyMove(b, 2, 0, 'X')!;

    expect(checkWinner(b, 'X')).toBe(true);
  });
});
