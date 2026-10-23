/**
 * AI Foundations — Pathfinding & Search Engine.
 *
 * Implements deterministic search on grid state spaces with:
 * - Start and Goal states
 * - Step-by-step frontier, visited/closed states, cost g(n), heuristic h(n), f(n)
 * - Educational path cost calculation and full decision trace
 *
 * Algorithms:
 * - BFS (uninformed, FIFO frontier, optimal for unweighted graphs)
 * - DFS (uninformed, LIFO frontier, explores deep before broad)
 * - UCS (uninformed, lowest cost first, optimal for weighted graphs)
 * - Greedy Best-First (informed, h(n) only, fast but not always optimal)
 * - A* (informed, f(n) = g(n) + h(n), optimal with admissible heuristic)
 */

export type AlgorithmType = 'BFS' | 'DFS' | 'UCS' | 'Greedy' | 'A*';

export interface GridPos {
  r: number;
  c: number;
}

export type CellType = 'empty' | 'wall' | 'start' | 'goal';

export interface GridMap {
  rows: number;
  cols: number;
  grid: CellType[][];
  start: GridPos;
  goal: GridPos;
}

export interface SearchStepTrace {
  step: number;
  current: GridPos;
  frontier: GridPos[];
  visited: GridPos[];
  gn: number;
  hn: number;
  fn: number;
  action: string;
}

export interface SearchResult {
  algorithm: AlgorithmType;
  found: boolean;
  path: GridPos[];
  pathCost: number;
  nodesExplored: number;
  trace: SearchStepTrace[];
  explanation: string;
}

// Manhattan distance heuristic
export function manhattanDistance(a: GridPos, b: GridPos): number {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
}

export function posKey(p: GridPos): string {
  return `${p.r},${p.c}`;
}

export function getNeighbors(pos: GridPos, map: GridMap): GridPos[] {
  const deltas = [
    { r: -1, c: 0 }, // Up
    { r: 1, c: 0 },  // Down
    { r: 0, c: -1 }, // Left
    { r: 0, c: 1 },  // Right
  ];
  const neighbors: GridPos[] = [];
  for (const d of deltas) {
    const nr = pos.r + d.r;
    const nc = pos.c + d.c;
    if (nr >= 0 && nr < map.rows && nc >= 0 && nc < map.cols) {
      if (map.grid[nr][nc] !== 'wall') {
        neighbors.push({ r: nr, c: nc });
      }
    }
  }
  return neighbors;
}

/**
 * Breadth-First Search (BFS)
 * Unweighted shortest path search exploring layer by layer (FIFO frontier).
 */
export function runBFS(map: GridMap, maxSteps = 500): SearchResult {
  const queue: GridPos[] = [map.start];
  const visited = new Set<string>([posKey(map.start)]);
  const parent = new Map<string, GridPos | null>();
  parent.set(posKey(map.start), null);

  const trace: SearchStepTrace[] = [];
  let step = 0;
  let found = false;

  while (queue.length > 0) {
    step++;
    if (step > maxSteps) break;

    const current = queue.shift()!;
    const hn = manhattanDistance(current, map.goal);

    trace.push({
      step,
      current,
      frontier: [...queue],
      visited: Array.from(visited).map((k) => {
        const [r, c] = k.split(',').map(Number);
        return { r, c };
      }),
      gn: step - 1,
      hn,
      fn: step - 1, // BFS does not use heuristic
      action:
        current.r === map.goal.r && current.c === map.goal.c
          ? 'Goal reached!'
          : `Dequeued (${current.r},${current.c}) and expanding valid neighbors.`,
    });

    if (current.r === map.goal.r && current.c === map.goal.c) {
      found = true;
      break;
    }

    for (const neighbor of getNeighbors(current, map)) {
      const nKey = posKey(neighbor);
      if (!visited.has(nKey)) {
        visited.add(nKey);
        parent.set(nKey, current);
        queue.push(neighbor);
      }
    }
  }

  const path: GridPos[] = [];
  if (found) {
    let curr: GridPos | null = map.goal;
    while (curr) {
      path.unshift(curr);
      curr = parent.get(posKey(curr)) ?? null;
    }
  }

  return {
    algorithm: 'BFS',
    found,
    path,
    pathCost: found ? path.length - 1 : 0,
    nodesExplored: visited.size,
    trace,
    explanation: found
      ? `BFS found the unweighted shortest path with ${path.length - 1} steps after exploring ${visited.size} states.`
      : `BFS exhausted the frontier without reaching the goal state.`,
  };
}

/**
 * A* Search (Informed Heuristic Search)
 * Prioritizes nodes using f(n) = g(n) + h(n) with Manhattan distance.
 */
export function runAStar(map: GridMap, maxSteps = 500): SearchResult {
  interface Node {
    pos: GridPos;
    g: number;
    h: number;
    f: number;
  }

  const startH = manhattanDistance(map.start, map.goal);
  const openSet: Node[] = [{ pos: map.start, g: 0, h: startH, f: startH }];
  const closedSet = new Set<string>();
  const gScores = new Map<string, number>();
  gScores.set(posKey(map.start), 0);
  const parent = new Map<string, GridPos | null>();
  parent.set(posKey(map.start), null);

  const trace: SearchStepTrace[] = [];
  let step = 0;
  let found = false;

  while (openSet.length > 0) {
    step++;
    if (step > maxSteps) break;

    // Pick node with lowest f score (break ties with lowest h)
    openSet.sort((a, b) => a.f - b.f || a.h - b.h);
    const current = openSet.shift()!;
    const cKey = posKey(current.pos);

    closedSet.add(cKey);

    trace.push({
      step,
      current: current.pos,
      frontier: openSet.map((n) => n.pos),
      visited: Array.from(closedSet).map((k) => {
        const [r, c] = k.split(',').map(Number);
        return { r, c };
      }),
      gn: current.g,
      hn: current.h,
      fn: current.f,
      action:
        current.pos.r === map.goal.r && current.pos.c === map.goal.c
          ? `Goal reached! Path cost: ${current.g}`
          : `Selected lowest f(n)=${current.f} (g=${current.g}, h=${current.h}) from priority queue.`,
    });

    if (current.pos.r === map.goal.r && current.pos.c === map.goal.c) {
      found = true;
      break;
    }

    for (const neighbor of getNeighbors(current.pos, map)) {
      const nKey = posKey(neighbor);
      if (closedSet.has(nKey)) continue;

      const tentativeG = current.g + 1;
      const prevG = gScores.get(nKey) ?? Infinity;

      if (tentativeG < prevG) {
        gScores.set(nKey, tentativeG);
        parent.set(nKey, current.pos);
        const hn = manhattanDistance(neighbor, map.goal);
        const fn = tentativeG + hn;

        const existingIdx = openSet.findIndex((n) => posKey(n.pos) === nKey);
        if (existingIdx >= 0) {
          openSet[existingIdx] = { pos: neighbor, g: tentativeG, h: hn, f: fn };
        } else {
          openSet.push({ pos: neighbor, g: tentativeG, h: hn, f: fn });
        }
      }
    }
  }

  const path: GridPos[] = [];
  if (found) {
    let curr: GridPos | null = map.goal;
    while (curr) {
      path.unshift(curr);
      curr = parent.get(posKey(curr)) ?? null;
    }
  }

  return {
    algorithm: 'A*',
    found,
    path,
    pathCost: found ? path.length - 1 : 0,
    nodesExplored: closedSet.size,
    trace,
    explanation: found
      ? `A* heuristic search found optimal path of ${path.length - 1} steps by exploring ${closedSet.size} states using Manhattan heuristic h(n).`
      : `A* exhausted open set without finding a path to goal.`,
  };
}

/**
 * Depth-First Search (DFS)
 * Uninformed search using LIFO frontier (stack). Explores as deep as possible
 * before backtracking. Not guaranteed to find the shortest path.
 */
export function runDFS(map: GridMap, maxSteps = 500): SearchResult {
  const stack: GridPos[] = [map.start];
  const visited = new Set<string>([posKey(map.start)]);
  const parent = new Map<string, GridPos | null>();
  parent.set(posKey(map.start), null);

  const trace: SearchStepTrace[] = [];
  let step = 0;
  let found = false;

  while (stack.length > 0) {
    step++;
    if (step > maxSteps) break;

    const current = stack.pop()!;
    const hn = manhattanDistance(current, map.goal);

    trace.push({
      step,
      current,
      frontier: [...stack],
      visited: Array.from(visited).map((k) => {
        const [r, c] = k.split(',').map(Number);
        return { r, c };
      }),
      gn: step - 1,
      hn,
      fn: step - 1,
      action:
        current.r === map.goal.r && current.c === map.goal.c
          ? 'Goal reached!'
          : `Popped (${current.r},${current.c}) from stack and expanding valid neighbors.`,
    });

    if (current.r === map.goal.r && current.c === map.goal.c) {
      found = true;
      break;
    }

    // Push neighbors — order matters for DFS behavior
    const neighbors = getNeighbors(current, map);
    for (let i = neighbors.length - 1; i >= 0; i--) {
      const neighbor = neighbors[i];
      const nKey = posKey(neighbor);
      if (!visited.has(nKey)) {
        visited.add(nKey);
        parent.set(nKey, current);
        stack.push(neighbor);
      }
    }
  }

  const path: GridPos[] = [];
  if (found) {
    let curr: GridPos | null = map.goal;
    while (curr) {
      path.unshift(curr);
      curr = parent.get(posKey(curr)) ?? null;
    }
  }

  return {
    algorithm: 'DFS',
    found,
    path,
    pathCost: found ? path.length - 1 : 0,
    nodesExplored: visited.size,
    trace,
    explanation: found
      ? `DFS found a path with ${path.length - 1} steps after exploring ${visited.size} states. Note: DFS is not guaranteed to find the shortest path.`
      : `DFS exhausted the frontier without reaching the goal state.`,
  };
}

/**
 * Uniform-Cost Search (UCS)
 * Uninformed search using lowest cost first. Optimal for weighted graphs.
 * Uses edge cost of 1 per step (same as BFS on unit-weight grids but
 * demonstrates the priority-queue pattern).
 */
export function runUCS(map: GridMap, maxSteps = 500): SearchResult {
  interface Node {
    pos: GridPos;
    g: number;
  }

  const startNode: Node = { pos: map.start, g: 0 };
  const openSet: Node[] = [startNode];
  const closedSet = new Set<string>();
  const gScores = new Map<string, number>([[posKey(map.start), 0]]);
  const parent = new Map<string, GridPos | null>();
  parent.set(posKey(map.start), null);

  const trace: SearchStepTrace[] = [];
  let step = 0;
  let found = false;

  while (openSet.length > 0) {
    step++;
    if (step > maxSteps) break;

    // Pick node with lowest g cost
    openSet.sort((a, b) => a.g - b.g);
    const current = openSet.shift()!;
    const cKey = posKey(current.pos);

    if (closedSet.has(cKey)) continue;
    closedSet.add(cKey);

    const hn = manhattanDistance(current.pos, map.goal);

    trace.push({
      step,
      current: current.pos,
      frontier: openSet.map((n) => n.pos),
      visited: Array.from(closedSet).map((k) => {
        const [r, c] = k.split(',').map(Number);
        return { r, c };
      }),
      gn: current.g,
      hn,
      fn: current.g,
      action:
        current.pos.r === map.goal.r && current.pos.c === map.goal.c
          ? 'Goal reached!'
          : `Expanding (${current.pos.r},${current.pos.c}) with g(n)=${current.g}, cost so far.`,
    });

    if (current.pos.r === map.goal.r && current.pos.c === map.goal.c) {
      found = true;
      break;
    }

    for (const neighbor of getNeighbors(current.pos, map)) {
      const nKey = posKey(neighbor);
      if (closedSet.has(nKey)) continue;

      const tentativeG = current.g + 1;
      const prevG = gScores.get(nKey);
      if (prevG === undefined || tentativeG < prevG) {
        gScores.set(nKey, tentativeG);
        parent.set(nKey, current.pos);
        const existingIdx = openSet.findIndex((n) => posKey(n.pos) === nKey);
        if (existingIdx >= 0) {
          openSet[existingIdx] = { pos: neighbor, g: tentativeG };
        } else {
          openSet.push({ pos: neighbor, g: tentativeG });
        }
      }
    }
  }

  const path: GridPos[] = [];
  if (found) {
    let curr: GridPos | null = map.goal;
    while (curr) {
      path.unshift(curr);
      curr = parent.get(posKey(curr)) ?? null;
    }
  }

  return {
    algorithm: 'UCS',
    found,
    path,
    pathCost: found ? path.length - 1 : 0,
    nodesExplored: closedSet.size,
    trace,
    explanation: found
      ? `UCS found the lowest-cost path with ${path.length - 1} steps after exploring ${closedSet.size} states.`
      : `UCS exhausted the frontier without reaching the goal state.`,
  };
}

/**
 * Greedy Best-First Search (GBFS)
 * Informed search using only h(n) (heuristic). Fast but not guaranteed
 * to find the optimal path. Selects node closest to goal by heuristic.
 */
export function runGreedyBestFirst(map: GridMap, maxSteps = 500): SearchResult {
  const openSet: GridPos[] = [map.start];
  const visited = new Set<string>([posKey(map.start)]);
  const parent = new Map<string, GridPos | null>();
  parent.set(posKey(map.start), null);

  const trace: SearchStepTrace[] = [];
  let step = 0;
  let found = false;

  while (openSet.length > 0) {
    step++;
    if (step > maxSteps) break;

    // Sort by heuristic only (h(n))
    openSet.sort((a, b) => {
      return manhattanDistance(a, map.goal) - manhattanDistance(b, map.goal);
    });
    const current = openSet.shift()!;
    const hn = manhattanDistance(current, map.goal);

    trace.push({
      step,
      current,
      frontier: [...openSet],
      visited: Array.from(visited).map((k) => {
        const [r, c] = k.split(',').map(Number);
        return { r, c };
      }),
      gn: step - 1,
      hn,
      fn: hn,
      action:
        current.r === map.goal.r && current.c === map.goal.c
          ? 'Goal reached!'
          : `Greedy: selected (${current.r},${current.c}) with h(n)=${hn} from priority queue.`,
    });

    if (current.r === map.goal.r && current.c === map.goal.c) {
      found = true;
      break;
    }

    for (const neighbor of getNeighbors(current, map)) {
      const nKey = posKey(neighbor);
      if (!visited.has(nKey)) {
        visited.add(nKey);
        parent.set(nKey, current);
        openSet.push(neighbor);
      }
    }
  }

  const path: GridPos[] = [];
  if (found) {
    let curr: GridPos | null = map.goal;
    while (curr) {
      path.unshift(curr);
      curr = parent.get(posKey(curr)) ?? null;
    }
  }

  return {
    algorithm: 'Greedy',
    found,
    path,
    pathCost: found ? path.length - 1 : 0,
    nodesExplored: visited.size,
    trace,
    explanation: found
      ? `Greedy Best-First Search found a path with ${path.length - 1} steps after exploring ${visited.size} states using only h(n). Note: not guaranteed to be optimal.`
      : `Greedy Best-First Search exhausted the frontier without reaching the goal state.`,
  };
}

/**
 * Standard default map for testing & demo.
 * 6x6 grid with a simple obstacle maze.
 */
export function createDefaultGrid(): GridMap {
  const rows = 6;
  const cols = 6;
  const grid: CellType[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => 'empty' as CellType),
  );

  // Set obstacles
  grid[1][2] = 'wall';
  grid[2][2] = 'wall';
  grid[3][2] = 'wall';
  grid[3][4] = 'wall';
  grid[4][4] = 'wall';

  const start = { r: 0, c: 0 };
  const goal = { r: 5, c: 5 };
  grid[start.r][start.c] = 'start';
  grid[goal.r][goal.c] = 'goal';

  return { rows, cols, grid, start, goal };
}

// ---------------------------------------------------------------------------
// Minimax with Alpha-Beta Pruning — Tic-Tac-Toe
// ---------------------------------------------------------------------------

export type Player = 'X' | 'O';
export type CellValue = Player | null;
export type Board = CellValue[][];

export interface MinimaxMove {
  row: number;
  col: number;
  score: number;
  depth: number;
}

export interface MinimaxStep {
  step: number;
  board: CellValue[][];
  move: { row: number; col: number } | null;
  player: Player;
  score: number;
  alpha: number;
  beta: number;
  pruned: boolean;
  action: string;
}

export interface MinimaxResult {
  bestMove: { row: number; col: number };
  score: number;
  nodesExplored: number;
  trace: MinimaxStep[];
  explanation: string;
}

/**
 * Creates a fresh 3x3 empty Tic-Tac-Toe board.
 */
export function createEmptyBoard(): Board {
  return [
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ];
}

/**
 * Checks if the given player has won on the current board.
 */
export function checkWinner(board: Board, player: Player): boolean {
  // Check rows, columns, and diagonals
  for (let i = 0; i < 3; i++) {
    if (board[i][0] === player && board[i][1] === player && board[i][2] === player) return true;
    if (board[0][i] === player && board[1][i] === player && board[2][i] === player) return true;
  }
  if (board[0][0] === player && board[1][1] === player && board[2][2] === player) return true;
  if (board[0][2] === player && board[1][1] === player && board[2][0] === player) return true;
  return false;
}

/**
 * Checks if the board is full (tie game).
 */
export function isBoardFull(board: Board): boolean {
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (board[r][c] === null) return false;
    }
  }
  return true;
}

/** Deep clone a board for minimax exploration. */
function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

/**
 * Minimax with Alpha-Beta pruning for Tic-Tac-Toe.
 * Returns the best move for the given player.
 *
 * @param board - current 3x3 board state
 * @param player - 'X' or 'O' (the player to find best move for)
 * @param depth - current recursion depth (0 = root)
 * @param alpha - alpha value for pruning
 * @param beta - beta value for pruning
 * @param isMaximizing - whether current player is maximizing
 */
export function minimax(
  board: Board,
  player: Player,
  depth: number = 0,
  alpha: number = -Infinity,
  beta: number = Infinity,
  isMaximizing: boolean = true,
  trace: MinimaxStep[] = [],
  stepCounter: { count: number } = { count: 0 },
): { score: number; bestMove: { row: number; col: number } | null } {
  stepCounter.count++;
  // Terminal states
  if (checkWinner(board, 'X')) {
    trace.push({
      step: stepCounter.count,
      board: cloneBoard(board),
      move: null,
      player,
      score: 10 - depth,
      alpha,
      beta,
      pruned: false,
      action: 'Terminal: X wins',
    });
    return { score: 10 - depth, bestMove: null };
  }
  if (checkWinner(board, 'O')) {
    trace.push({
      step: stepCounter.count,
      board: cloneBoard(board),
      move: null,
      player,
      score: depth - 10,
      alpha,
      beta,
      pruned: false,
      action: 'Terminal: O wins',
    });
    return { score: depth - 10, bestMove: null };
  }
  if (isBoardFull(board)) {
    trace.push({
      step: stepCounter.count,
      board: cloneBoard(board),
      move: null,
      player,
      score: 0,
      alpha,
      beta,
      pruned: false,
      action: 'Terminal: Draw',
    });
    return { score: 0, bestMove: null };
  }

  if (isMaximizing) {
    let bestScore = -Infinity;
    let bestMove: { row: number; col: number } | null = null;

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (board[r][c] === null) {
          board[r][c] = 'X';
          const result = minimax(board, player, depth + 1, alpha, beta, false, trace, stepCounter);
          board[r][c] = null;

          if (result.score > bestScore) {
            bestScore = result.score;
            bestMove = { row: r, col: c };
          }
          alpha = Math.max(alpha, bestScore);

          trace.push({
            step: stepCounter.count,
            board: cloneBoard(board),
            move: { row: r, col: c },
            player: 'X',
            score: bestScore,
            alpha,
            beta,
            pruned: beta <= alpha,
            action: `Max: trying (${r},${c}) score=${bestScore} alpha=${alpha} beta=${beta}`,
          });

          if (beta <= alpha) {
            // Alpha-beta prune
            break;
          }
        }
      }
    }

    return { score: bestScore, bestMove };
  } else {
    let bestScore = Infinity;
    let bestMove: { row: number; col: number } | null = null;

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (board[r][c] === null) {
          board[r][c] = 'O';
          const result = minimax(board, player, depth + 1, alpha, beta, true, trace, stepCounter);
          board[r][c] = null;

          if (result.score < bestScore) {
            bestScore = result.score;
            bestMove = { row: r, col: c };
          }
          beta = Math.min(beta, bestScore);

          trace.push({
            step: stepCounter.count,
            board: cloneBoard(board),
            move: { row: r, col: c },
            player: 'O',
            score: bestScore,
            alpha,
            beta,
            pruned: beta <= alpha,
            action: `Min: trying (${r},${c}) score=${bestScore} alpha=${alpha} beta=${beta}`,
          });

          if (beta <= alpha) {
            // Alpha-beta prune
            break;
          }
        }
      }
    }

    return { score: bestScore, bestMove };
  }
}

/**
 * Runs the Minimax algorithm with alpha-beta pruning on a Tic-Tac-Toe board.
 * Returns the best move for the given player along with a full trace.
 */
export function findBestMove(
  board: Board,
  player: Player,
): { bestMove: { row: number; col: number }; score: number; nodesExplored: number; trace: MinimaxStep[]; explanation: string } {
  const trace: MinimaxStep[] = [];
  const stepCounter = { count: 0 };

  const result = minimax(
    cloneBoard(board),
    player,
    0,
    -Infinity,
    Infinity,
    player === 'X', // X maximizes, O minimizes
    trace,
    stepCounter,
  );

  if (!result.bestMove) {
    // No valid move — board is full
    return {
      bestMove: { row: -1, col: -1 },
      score: 0,
      nodesExplored: stepCounter.count,
      trace,
      explanation: 'No valid moves available — the board is full.',
    };
  }

  const isWinningMove = checkWinner(
    (() => {
      const testBoard = cloneBoard(board);
      testBoard[result.bestMove.row][result.bestMove.col] = player;
      return testBoard;
    })(),
    player,
  );

  return {
    bestMove: result.bestMove,
    score: result.score,
    nodesExplored: stepCounter.count,
    trace,
    explanation: isWinningMove
      ? `Minimax with alpha-beta pruning selected move (${result.bestMove.row}, ${result.bestMove.col}) — immediate winning move for ${player}. Explored ${stepCounter.count} nodes.`
      : `Minimax with alpha-beta pruning selected move (${result.bestMove.row}, ${result.bestMove.col}) for ${player} with score ${result.score}. Explored ${stepCounter.count} nodes.`,
  };
}

/**
 * Applies a move to the board (immutable — returns a new board).
 */
export function applyMove(board: Board, row: number, col: number, player: Player): Board | null {
  if (board[row][col] !== null) return null;
  const newBoard = cloneBoard(board);
  newBoard[row][col] = player;
  return newBoard;
}

/**
 * Finds all empty cells on the board.
 */
export function getEmptyCells(board: Board): { row: number; col: number }[] {
  const cells: { row: number; col: number }[] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (board[r][c] === null) cells.push({ row: r, col: c });
    }
  }
  return cells;
}
