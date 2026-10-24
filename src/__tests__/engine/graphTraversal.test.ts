import { describe, expect, it } from 'vitest';
import {
  parseUndirectedAdjacencyList,
  traverseGraph,
} from '../../engine/graphTraversal';

const graph = parseUndirectedAdjacencyList(`A: B, C
B: D
C: D
D:
E:`);

describe('deterministic graph traversal', () => {
  it('performs breadth-first traversal with real frontier and visit traces', () => {
    const result = traverseGraph(graph, 'A', 'BFS');
    expect(result.order).toEqual(['A', 'B', 'C', 'D']);
    expect(result.reachableCount).toBe(4);
    expect(result.vertexCount).toBe(5);
    expect(result.trace[0].discovered).toEqual(['B', 'C']);
    expect(result.trace[0].frontier).toEqual(['B', 'C']);
    expect(result.trace[0].visited).toEqual(['A']);
  });

  it('performs depth-first traversal in adjacency-list neighbor order', () => {
    const result = traverseGraph(graph, 'A', 'DFS');
    expect(result.order).toEqual(['A', 'B', 'D', 'C']);
    expect(result.algorithm).toBe('DFS');
    expect(result.trace.map((step) => step.current)).toEqual(result.order);
  });

  it('terminates on cycles and keeps disconnected vertices outside the traversal', () => {
    const cyclic = parseUndirectedAdjacencyList('A: B\nB: C\nC: A\nZ:');
    const result = traverseGraph(cyclic, 'A', 'BFS');
    expect(result.order).toEqual(['A', 'B', 'C']);
    expect(result.vertexCount).toBe(4);
    expect(result.trace).toHaveLength(3);
  });

  it('parses isolated vertices and rejects malformed input and unknown starts', () => {
    expect(traverseGraph(parseUndirectedAdjacencyList('solo:'), 'solo', 'DFS').order)
      .toEqual(['solo']);
    expect(() => parseUndirectedAdjacencyList('A -> B')).toThrow(/expected/);
    expect(() => traverseGraph(graph, 'missing', 'BFS')).toThrow(/not in the graph/);
  });
});
