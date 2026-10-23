import { describe, it, expect } from 'vitest';
import {
  runBFS,
  runDFS,
  runUCS,
  runGreedyBestFirst,
  runAStar,
  createDefaultGrid,
  createEmptyBoard,
  applyMove,
  checkWinner,
  findBestMove,
  type Board,
} from '../../engine/aiSearch';
import {
  simulateDFA,
  binaryEndingIn01DFA,
  evenOnesDFA,
  divisibleBy3DFA,
  dfaRegistry,
} from '../../engine/tocDFA';
import {
  assembleProgram,
  runTinyCPU,
  defaultTinyCPUProgram,
  programRegistry,
} from '../../engine/tinyCPU';
import { compareSearchOperations } from '../../engine/daaComparison';
import { simulateCache, cacheConfigs } from '../../engine/cacheSim';

describe('AI Foundations — BFS and A* Search', () => {
  it('BFS finds optimal path on default grid', () => {
    const map = createDefaultGrid();
    const result = runBFS(map);
    expect(result.found).toBe(true);
    expect(result.path.length).toBeGreaterThan(0);
    expect(result.path[0]).toEqual(map.start);
    expect(result.path[result.path.length - 1]).toEqual(map.goal);
    expect(result.trace.length).toBeGreaterThan(0);
  });

  it('A* finds optimal path and utilizes heuristic', () => {
    const map = createDefaultGrid();
    const result = runAStar(map);
    expect(result.found).toBe(true);
    expect(result.path[result.path.length - 1]).toEqual(map.goal);
    expect(result.trace.some((t) => t.hn > 0)).toBe(true);
    // A* should explore fewer or equal states compared to BFS on targeted path
    const bfs = runBFS(map);
    expect(result.nodesExplored).toBeLessThanOrEqual(bfs.nodesExplored + 2);
  });
});

describe('AI Foundations — DFS, UCS, Greedy Best-First Search', () => {
  const map = createDefaultGrid();

  it('DFS finds a path to goal (not necessarily optimal)', () => {
    const result = runDFS(map);
    expect(result.algorithm).toBe('DFS');
    expect(result.found).toBe(true);
    expect(result.path[0]).toEqual(map.start);
    expect(result.path[result.path.length - 1]).toEqual(map.goal);
    expect(result.trace.length).toBeGreaterThan(0);
    expect(result.trace.every((t) => t.action)).toBe(true);
  });

  it('UCS finds a path to goal', () => {
    const result = runUCS(map);
    expect(result.algorithm).toBe('UCS');
    expect(result.found).toBe(true);
    expect(result.path[0]).toEqual(map.start);
    expect(result.path[result.path.length - 1]).toEqual(map.goal);
    expect(result.nodesExplored).toBeGreaterThan(0);
  });

  it('Greedy Best-First finds a path to goal', () => {
    const result = runGreedyBestFirst(map);
    expect(result.algorithm).toBe('Greedy');
    expect(result.found).toBe(true);
    expect(result.path[0]).toEqual(map.start);
    expect(result.path[result.path.length - 1]).toEqual(map.goal);
    expect(result.nodesExplored).toBeGreaterThan(0);
  });

  it('All algorithms find a path on default grid', () => {
    const bfs = runBFS(map);
    const dfs = runDFS(map);
    const ucs = runUCS(map);
    const greedy = runGreedyBestFirst(map);
    const astar = runAStar(map);

    expect(bfs.found).toBe(true);
    expect(dfs.found).toBe(true);
    expect(ucs.found).toBe(true);
    expect(greedy.found).toBe(true);
    expect(astar.found).toBe(true);
  });
});

describe('AI Foundations — Minimax with Alpha-Beta Pruning', () => {
  it('findBestMove returns a valid move on empty board', () => {
    const board = createEmptyBoard();
    const result = findBestMove(board, 'X');
    expect(result.bestMove.row).toBeGreaterThanOrEqual(0);
    expect(result.bestMove.col).toBeGreaterThanOrEqual(0);
    expect(result.bestMove.row).toBeLessThanOrEqual(2);
    expect(result.bestMove.col).toBeLessThanOrEqual(2);
  });

  it('X playing first on empty board should pick center or corner', () => {
    const board = createEmptyBoard();
    const result = findBestMove(board, 'X');
    // Center (1,1) or any corner is optimal first move
    const isCenterOrCorner =
      (result.bestMove.row === 1 && result.bestMove.col === 1) ||
      (result.bestMove.row % 2 === 0 && result.bestMove.col % 2 === 0);
    expect(isCenterOrCorner).toBe(true);
  });

  it('detects winning move when available', () => {
    // X has two in a row on top row: X X _
    const board: Board = [
      ['X', 'X', null],
      ['O', 'O', null],
      [null, null, null],
    ];
    const result = findBestMove(board, 'X');
    expect(result.bestMove).toEqual({ row: 0, col: 2 });
  });

  it('blocks opponent winning move', () => {
    // O has two in a row on left column: O _ _, O _ _, _ _ _  — O threatens (2,0)
    const board: Board = [
      ['O', null, null],
      ['O', null, null],
      [null, null, null],
    ];
    const result = findBestMove(board, 'X');
    // X should block O at (2, 0)
    expect(result.bestMove).toEqual({ row: 2, col: 0 });
  });

  it('checkWinner detects horizontal win', () => {
    const board: Board = [
      ['X', 'X', 'X'],
      ['O', 'O', null],
      [null, null, null],
    ];
    expect(checkWinner(board, 'X')).toBe(true);
    expect(checkWinner(board, 'O')).toBe(false);
  });

  it('checkWinner detects diagonal win', () => {
    const board: Board = [
      ['X', 'O', 'O'],
      ['O', 'X', null],
      [null, null, 'X'],
    ];
    expect(checkWinner(board, 'X')).toBe(true);
  });

  it('applyMove places player correctly and returns null on occupied cell', () => {
    const board = createEmptyBoard();
    const newBoard = applyMove(board, 1, 1, 'X');
    expect(newBoard).not.toBeNull();
    expect(newBoard![1][1]).toBe('X');
    // Original board is not mutated
    expect(board[1][1]).toBeNull();
    // Occupied cell returns null
    expect(applyMove(newBoard!, 1, 1, 'O')).toBeNull();
  });
});

describe('TOC — DFA Engine', () => {
  it('accepts valid binary strings ending with 01', () => {
    expect(simulateDFA(binaryEndingIn01DFA, '01').accepted).toBe(true);
    expect(simulateDFA(binaryEndingIn01DFA, '101').accepted).toBe(true);
    expect(simulateDFA(binaryEndingIn01DFA, '0001').accepted).toBe(true);
    expect(simulateDFA(binaryEndingIn01DFA, '11101').accepted).toBe(true);
  });

  it('rejects binary strings not ending with 01', () => {
    expect(simulateDFA(binaryEndingIn01DFA, '0').accepted).toBe(false);
    expect(simulateDFA(binaryEndingIn01DFA, '1').accepted).toBe(false);
    expect(simulateDFA(binaryEndingIn01DFA, '10').accepted).toBe(false);
    expect(simulateDFA(binaryEndingIn01DFA, '010').accepted).toBe(false);
    expect(simulateDFA(binaryEndingIn01DFA, '100').accepted).toBe(false);
  });

  it('reports error on invalid alphabet symbol', () => {
    const res = simulateDFA(binaryEndingIn01DFA, '012');
    expect(res.accepted).toBe(false);
    expect(res.error).toContain('Symbol \'2\' at index 2 is not in alphabet');
  });
});

describe('TOC — Additional DFA Implementations', () => {
  it('dfaRegistry contains all three DFAs', () => {
    expect(dfaRegistry.length).toBe(3);
    expect(dfaRegistry.map((d) => d.id)).toEqual([
      'toc.dfa.binary-ending-in-01',
      'toc.dfa.even-ones',
      'toc.dfa.divisible-by-3',
    ]);
  });

  it('evenOnesDFA accepts strings with even number of 1s', () => {
    expect(simulateDFA(evenOnesDFA, '0').accepted).toBe(true);
    expect(simulateDFA(evenOnesDFA, '11').accepted).toBe(true);
    expect(simulateDFA(evenOnesDFA, '1010').accepted).toBe(true);
    expect(simulateDFA(evenOnesDFA, '0000').accepted).toBe(true);
  });

  it('evenOnesDFA rejects strings with odd number of 1s', () => {
    expect(simulateDFA(evenOnesDFA, '1').accepted).toBe(false);
    expect(simulateDFA(evenOnesDFA, '10').accepted).toBe(false);
    expect(simulateDFA(evenOnesDFA, '111').accepted).toBe(false);
  });

  it('divisibleBy3DFA accepts binary values divisible by 3', () => {
    // 0 (binary "0") = 0, divisible by 3
    expect(simulateDFA(divisibleBy3DFA, '0').accepted).toBe(true);
    // 3 (binary "11") = 3, divisible by 3
    expect(simulateDFA(divisibleBy3DFA, '11').accepted).toBe(true);
    // 6 (binary "110") = 6, divisible by 3
    expect(simulateDFA(divisibleBy3DFA, '110').accepted).toBe(true);
    // 9 (binary "1001") = 9, divisible by 3
    expect(simulateDFA(divisibleBy3DFA, '1001').accepted).toBe(true);
  });

  it('divisibleBy3DFA rejects binary values not divisible by 3', () => {
    // 1 (binary "1") = 1, not divisible by 3
    expect(simulateDFA(divisibleBy3DFA, '1').accepted).toBe(false);
    // 2 (binary "10") = 2, not divisible by 3
    expect(simulateDFA(divisibleBy3DFA, '10').accepted).toBe(false);
    // 4 (binary "100") = 4, not divisible by 3
    expect(simulateDFA(divisibleBy3DFA, '100').accepted).toBe(false);
  });

  it('handles empty string input correctly', () => {
    const res = simulateDFA(binaryEndingIn01DFA, '');
    expect(res.trace.length).toBe(0);
    expect(res.accepted).toBe(false);
    expect(res.explanation).toContain('not accepted');
  });
});

describe('COA — TinyCPU Simulator', () => {
  it('assembles and executes default accumulation loop program', () => {
    const instructions = assembleProgram(defaultTinyCPUProgram);
    expect(instructions.length).toBeGreaterThan(0);

    const result = runTinyCPU(instructions);
    expect(result.haltedNormally).toBe(true);
    // 3 + 2 + 1 = 6 stored in R0
    expect(result.finalState.registers.r0).toBe(6);
    expect(result.finalState.registers.r1).toBe(0);
    expect(result.trace.length).toBeGreaterThan(0);
  });

  it('detects pipeline RAW hazard in instruction sequence', () => {
    const code = `
      MOV R0, 5
      ADD R1, R0
      HALT
    `;
    const instructions = assembleProgram(code);
    const result = runTinyCPU(instructions);
    expect(result.trace.some((t) => t.hazardDetected !== undefined)).toBe(true);
  });

  it('programRegistry contains all built-in programs', () => {
    expect(programRegistry.length).toBe(3);
    expect(programRegistry.map((p) => p.id)).toEqual([
      'coa.tinycpu.sum-3-2-1',
      'coa.tinycpu.factorial',
      'coa.tinycpu.fibonacci',
    ]);
    expect(programRegistry[0].code).toBe(defaultTinyCPUProgram);
  });

  it('defaultTinyCPUProgram produces expected result when assembled', () => {
    const instructions = assembleProgram(defaultTinyCPUProgram);
    expect(instructions.length).toBeGreaterThan(0);
    expect(instructions.some((i) => i.opcode === 'HALT')).toBe(true);
  });
});

describe('DAA — Complexity and Operation Counting', () => {
  it('compares operations between Linear Search and Binary Search', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
    const metrics = compareSearchOperations(arr, 16);
    expect(metrics.linearOperations).toBe(16);
    expect(metrics.binaryOperations).toBeLessThanOrEqual(5); // log2(16) + 1
    expect(metrics.theoreticalLinear).toBe('O(N)');
    expect(metrics.theoreticalBinary).toBe('O(log N)');
  });
});

describe('COA — Cache Hierarchy Simulation', () => {
  it('cacheConfigs contains all pre-built configurations', () => {
    expect(cacheConfigs['direct-mapped-1KB-16B']).toBeDefined();
    expect(cacheConfigs['direct-mapped-4KB-16B']).toBeDefined();
    expect(cacheConfigs['2-way-set-assoc-1KB-16B']).toBeDefined();
    expect(cacheConfigs['4-way-set-assoc-4KB-16B']).toBeDefined();
    expect(cacheConfigs['8-way-set-assoc-8KB-16B-FIFO']).toBeDefined();
  });

  it('direct-mapped cache has lower associativity than set-associative', () => {
    const dm = cacheConfigs['direct-mapped-1KB-16B'];
    const sa = cacheConfigs['2-way-set-assoc-1KB-16B'];
    expect(dm.associativity).toBe(1);
    expect(sa.associativity).toBe(2);
    expect(dm.replacementPolicy).toBe('LRU');
    expect(sa.replacementPolicy).toBe('LRU');
  });

  it('FIFO config uses FIFO replacement policy', () => {
    const fifoConfig = cacheConfigs['8-way-set-assoc-8KB-16B-FIFO'];
    expect(fifoConfig.replacementPolicy).toBe('FIFO');
  });

  it('sequential access pattern shows high hit rate after first access', () => {
    // Same block repeated — all hits after first miss
    const config = cacheConfigs['direct-mapped-4KB-16B'];
    const addresses = [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3]; // All in same block
    const result = simulateCache(config, addresses, undefined);
    expect(result.totalAccesses).toBe(12);
    expect(result.hits).toBeGreaterThan(0);
    expect(result.misses).toBeGreaterThan(0);
    expect(result.hitRate).toBeGreaterThan(0.5);
  });

  it('repeated access to same block is a hit', () => {
    const config = cacheConfigs['direct-mapped-4KB-16B'];
    const addresses = [0, 0, 0, 0];
    const result = simulateCache(config, addresses);
    expect(result.hits).toBe(3); // First is miss, next 3 are hits
    expect(result.misses).toBe(1);
    expect(result.trace[0].hit).toBe(false);
    expect(result.trace[1].hit).toBe(true);
  });

  it('trace contains set index and tag information', () => {
    const config = cacheConfigs['direct-mapped-4KB-16B'];
    const result = simulateCache(config, [0]);
    expect(result.trace.length).toBe(1);
    expect(result.trace[0].setIndex).toBeGreaterThanOrEqual(0);
    expect(result.trace[0].tag).toBe(0); // Address 0 → tag 0 for 4KB cache with 16B block, 256 sets
    expect(result.trace[0].hit).toBe(false); // Cold miss
  });

  it('LRU eviction works on thrashing pattern', () => {
    // Two blocks that map to the same set in a direct-mapped cache
    const config = cacheConfigs['direct-mapped-1KB-16B'];
    // 1KB cache, 16B block = 64 sets, 64 bytes per set
    // Addresses 0 (tag=0, set=0) and 1024 (tag=1, set=0) map to same set
    // Each access is a cold/compulsory miss, and they evict each other
    const addresses = [0, 1024, 0, 1024, 0, 1024]; // Thrashing between two blocks
    const result = simulateCache(config, addresses);
    expect(result.misses).toBe(6); // All misses due to thrashing
    expect(result.trace[0].hit).toBe(false); // cold miss
    expect(result.trace[2].hit).toBe(false); // evicted by address 1024
    expect(result.trace[4].hit).toBe(false); // evicted again
  });
});
