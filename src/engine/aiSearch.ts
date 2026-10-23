/**
 * AI Foundations — Pathfinding & Search Engine (BFS & A*).
 *
 * Implements deterministic search on grid state spaces with:
 * - Start and Goal states
 * - Step-by-step frontier, visited/closed states, cost g(n), heuristic h(n), f(n)
 * - Educational path cost calculation and full decision trace
 */

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
  algorithm: 'BFS' | 'A*';
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
