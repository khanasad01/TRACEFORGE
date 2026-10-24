export type GraphTraversalAlgorithm = 'BFS' | 'DFS';

export interface TraversalGraph {
  adjacency: Record<string, string[]>;
}

export interface GraphTraversalStep {
  step: number;
  current: string;
  frontier: string[];
  discovered: string[];
  visited: string[];
  action: string;
}

export interface GraphTraversalResult {
  algorithm: GraphTraversalAlgorithm;
  start: string;
  order: string[];
  reachableCount: number;
  vertexCount: number;
  trace: GraphTraversalStep[];
}

const VERTEX_PATTERN = /^[A-Za-z0-9_-]+$/;

function addVertex(graph: Record<string, string[]>, vertex: string): void {
  if (!graph[vertex]) graph[vertex] = [];
}

function addUndirectedEdge(
  graph: Record<string, string[]>,
  vertex: string,
  neighbor: string,
): void {
  addVertex(graph, vertex);
  addVertex(graph, neighbor);
  if (!graph[vertex].includes(neighbor)) graph[vertex].push(neighbor);
  if (!graph[neighbor].includes(vertex)) graph[neighbor].push(vertex);
}

/** Parses one undirected adjacency-list entry per line, e.g. `A: B, C`. */
export function parseUndirectedAdjacencyList(source: string): TraversalGraph {
  const graph = Object.create(null) as Record<string, string[]>;
  const declarations = new Set<string>();

  source.split(/\r?\n/).forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line) return;

    const separator = line.indexOf(':');
    if (separator < 0 || line.indexOf(':', separator + 1) >= 0) {
      throw new Error(`Line ${index + 1}: expected "vertex: neighbor, neighbor".`);
    }

    const vertex = line.slice(0, separator).trim();
    if (!VERTEX_PATTERN.test(vertex)) {
      throw new Error(`Line ${index + 1}: invalid vertex "${vertex}". Use letters, numbers, "_" or "-".`);
    }
    if (declarations.has(vertex)) {
      throw new Error(`Line ${index + 1}: vertex "${vertex}" is declared more than once.`);
    }
    declarations.add(vertex);
    addVertex(graph, vertex);

    const neighbors = line.slice(separator + 1).trim();
    if (!neighbors) return;

    for (const neighbor of neighbors.split(/[,\s]+/).filter(Boolean)) {
      if (!VERTEX_PATTERN.test(neighbor)) {
        throw new Error(`Line ${index + 1}: invalid neighbor "${neighbor}".`);
      }
      addUndirectedEdge(graph, vertex, neighbor);
    }
  });

  if (Object.keys(graph).length === 0) {
    throw new Error('Enter at least one vertex in the adjacency list.');
  }
  return { adjacency: graph };
}

export function traverseGraph(
  graph: TraversalGraph,
  start: string,
  algorithm: GraphTraversalAlgorithm,
): GraphTraversalResult {
  const vertices = Object.keys(graph.adjacency);
  if (vertices.length === 0) throw new Error('Cannot traverse an empty graph.');
  if (!graph.adjacency[start]) throw new Error(`Start vertex "${start}" is not in the graph.`);

  for (const [vertex, neighbors] of Object.entries(graph.adjacency)) {
    if (new Set(neighbors).size !== neighbors.length) {
      throw new Error(`Vertex "${vertex}" has duplicate neighbors.`);
    }
    for (const neighbor of neighbors) {
      if (!graph.adjacency[neighbor]) {
        throw new Error(`Neighbor "${neighbor}" of "${vertex}" is not in the graph.`);
      }
    }
  }

  const frontier = [start];
  const discovered = new Set([start]);
  const order: string[] = [];
  const trace: GraphTraversalStep[] = [];

  while (frontier.length > 0) {
    const current = algorithm === 'BFS' ? frontier.shift()! : frontier.pop()!;
    order.push(current);
    const newlyDiscovered: string[] = [];

    for (const neighbor of graph.adjacency[current]) {
      if (discovered.has(neighbor)) continue;
      discovered.add(neighbor);
      newlyDiscovered.push(neighbor);
    }

    if (algorithm === 'BFS') {
      frontier.push(...newlyDiscovered);
    } else {
      frontier.push(...newlyDiscovered.reverse());
    }

    trace.push({
      step: trace.length + 1,
      current,
      frontier: [...frontier],
      discovered: newlyDiscovered,
      visited: [...order],
      action: `Visit ${current}; discover ${newlyDiscovered.length ? newlyDiscovered.join(', ') : 'no new vertices'}.`,
    });
  }

  return {
    algorithm,
    start,
    order,
    reachableCount: order.length,
    vertexCount: vertices.length,
    trace,
  };
}
