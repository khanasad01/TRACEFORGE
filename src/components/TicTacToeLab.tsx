import { useState } from 'react';
import {
  createEmptyBoard,
  applyMove,
  checkWinner,
  isBoardFull,
  findBestMove,
  type Board,
  type Player,
} from '../engine/aiSearch';
import styles from './TicTacToeLab.module.css';

export function TicTacToeLab() {
  const [board, setBoard] = useState<Board>(createEmptyBoard());
  const [gameStatus, setGameStatus] = useState<string>('Tic-Tac-Toe — make your move as X');
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [moveHistory, setMoveHistory] = useState<{ row: number; col: number; player: Player }[]>([]);
  const [traceVisible, setTraceVisible] = useState(false);

  const checkGameOver = (b: Board): boolean => {
    if (checkWinner(b, 'X')) {
      setGameStatus('X wins!');
      setGameOver(true);
      return true;
    }
    if (checkWinner(b, 'O')) {
      setGameStatus('O (AI) wins!');
      setGameOver(true);
      return true;
    }
    if (isBoardFull(b)) {
      setGameStatus("It's a draw!");
      setGameOver(true);
      return true;
    }
    return false;
  };

  const handleCellClick = (row: number, col: number) => {
    if (gameOver || board[row][col] !== null) return;

    const newBoard = applyMove(board, row, col, 'X');
    if (!newBoard) return;

    setBoard(newBoard);
    setMoveHistory((h) => [...h, { row, col, player: 'X' }]);

    if (!checkGameOver(newBoard)) {
      // AI move
      const result = findBestMove(newBoard, 'O');
      const { row: aiRow, col: aiCol } = result.bestMove;

      if (aiRow < 0 || aiCol < 0) {
        setGameStatus("It's a draw!");
        setGameOver(true);
        return;
      }

      const aiBoard = applyMove(newBoard, aiRow, aiCol, 'O');
      if (!aiBoard) return;

      setBoard(aiBoard);
      setMoveHistory((h) => [...h, { row: aiRow, col: aiCol, player: 'O' }]);
      setTraceVisible(true);

      if (!checkGameOver(aiBoard)) {
        setGameStatus('Your turn — you are X');
      }
    }
  };

  const handleReset = () => {
    setBoard(createEmptyBoard());
    setGameOver(false);
    setGameStatus('Tic-Tac-Toe — make your move as X');
    setMoveHistory([]);
    setTraceVisible(false);
  };

  const handleDemo = () => {
    const newBoard = createEmptyBoard();
    setBoard(newBoard);
    setGameOver(false);
    setMoveHistory([]);
    setTraceVisible(false);
    setGameStatus('Demo mode — X and O play optimally');

    let currentBoard = newBoard;
    let player: Player = 'X';
    const history: { row: number; col: number; player: Player }[] = [];

    const playDemo = () => {
      if (checkWinner(currentBoard, 'X') || checkWinner(currentBoard, 'O') || isBoardFull(currentBoard)) {
        setGameStatus(
          checkWinner(currentBoard, 'X')
            ? 'X wins!'
            : checkWinner(currentBoard, 'O')
              ? 'O (AI) wins!'
              : "It's a draw!",
        );
        setGameOver(true);
        setBoard(currentBoard);
        setMoveHistory(history);
        return;
      }

      const result = findBestMove(currentBoard, player);
      const { row, col } = result.bestMove;

      if (row < 0 || col < 0) {
        setGameStatus("It's a draw!");
        setGameOver(true);
        setBoard(currentBoard);
        setMoveHistory(history);
        return;
      }

      currentBoard = applyMove(currentBoard, row, col, player)!;
      history.push({ row, col, player });
      setBoard(currentBoard);
      setMoveHistory(history);
      setTraceVisible(true);

      player = player === 'X' ? 'O' : 'X';
      setTimeout(playDemo, 300);
    };

    playDemo();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>AI Foundations — Minimax &amp; Alpha-Beta Pruning</h2>
          <p className={styles.desc}>
            Tic-Tac-Toe with optimal AI using Minimax with alpha-beta pruning. The AI (O) never loses.
            Explore how the algorithm considers all possible future game states to make perfect decisions.
          </p>
        </div>
      </div>

      <div className={styles.gameSection}>
        <div className={styles.board}>
          {board.map((row, r) =>
            row.map((cell, c) => (
              <button
                key={`${r}-${c}`}
                className={`${styles.cell} ${cell === 'X' ? styles.cellX : cell === 'O' ? styles.cellO : ''}`}
                onClick={() => handleCellClick(r, c)}
                aria-label={`Cell ${r},${c}${cell ? ` contains ${cell}` : ', empty'}`}
                disabled={gameOver}
              >
                {cell}
              </button>
            )),
          )}
        </div>

        <div className={styles.gameInfo}>
          <div className={gameOver ? styles.statusEnd : styles.statusPlaying} role="status" aria-live="polite">
            {gameStatus}
          </div>

          <div className={styles.controls}>
            <button className={styles.actionBtn} onClick={handleReset} aria-label="Reset game">
              ↺ Reset Game
            </button>
            <button className={styles.actionBtn} onClick={handleDemo} aria-label="Run demo">
              ▶ Demo Mode
            </button>
          </div>

          {moveHistory.length > 0 && (
            <div className={styles.moveHistory}>
              <h4>Move History</h4>
              <ul>
                {moveHistory.map((move, i) => (
                  <li key={i}>
                    Move {i + 1}: {move.player} → ({move.row}, {move.col})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {traceVisible && (
            <div className={styles.aiInfo}>
              <h4>AI Decision Process</h4>
              <p>
                Minimax with alpha-beta pruning explored the full game tree to determine the optimal move.
                The AI considers all possible future states, pruning branches that cannot affect the outcome.
              </p>
              <p>
                <strong>Key insight:</strong> Tic-Tac-Toe has perfect information and a finite state space.
                Minimax guarantees optimal play — the AI never loses, and wins whenever the opponent errs.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
