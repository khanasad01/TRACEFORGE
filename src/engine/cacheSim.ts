/**
 * COA — Cache Hierarchy Simulator.
 *
 * Implements direct-mapped and set-associative cache simulation with:
 * - Configurable cache size, block size, and associativity
 * - LRU (Least Recently Used) and FIFO (First-In, First-Out) replacement policies
 * - Hit/miss tracking with detailed access trace
 * - Educational trace showing set index, tag, and eviction events
 *
 * This is an educational model demonstrating cache concepts, not a
 * cycle-accurate representation of real hardware cache controllers.
 */

export type ReplacementPolicy = 'LRU' | 'FIFO';

export interface CacheConfig {
  /** Total cache size in bytes. */
  size: number;
  /** Block/line size in bytes. */
  blockSize: number;
  /** Number of ways (associativity). 1 = direct-mapped. */
  associativity: number;
  /** Replacement policy when a set is full. */
  replacementPolicy: ReplacementPolicy;
  /** Number of addresses to simulate (for address generation). */
  maxTraceLength?: number;
}

export interface CacheTraceEntry {
  step: number;
  address: number;
  type: 'instruction' | 'data';
  hit: boolean;
  setIndex: number;
  tag: number;
  evicted: boolean;
  evictedTag?: number;
  action: string;
}

export interface CacheResult {
  config: CacheConfig;
  hits: number;
  misses: number;
  totalAccesses: number;
  hitRate: number;
  missRate: number;
  trace: CacheTraceEntry[];
  explanation: string;
}

/**
 * A single cache line in a set.
 */
interface CacheLine {
  tag: number;
  /** For LRU: lower = more recently used. For FIFO: insertion order. */
  order: number;
}

/**
 * Computes cache geometry from configuration.
 */
function computeGeometry(config: CacheConfig): {
  numSets: number;
  numBlocks: number;
  offsetBits: number;
  indexBits: number;
} {
  const numBlocks = config.size / config.blockSize;
  const numSets = numBlocks / config.associativity;
  const offsetBits = Math.log2(config.blockSize);
  const indexBits = Math.log2(numSets);

  return { numSets, numBlocks, offsetBits, indexBits };
}

/**
 * Simulates a cache on a sequence of memory addresses.
 *
 * @param config - Cache configuration
 * @param addresses - Array of memory addresses accessed (in order)
 * @param types - Optional: 'instruction' or 'data' for each address
 */
export function simulateCache(
  config: CacheConfig,
  addresses: number[],
  types: ('instruction' | 'data')[] = [],
): CacheResult {
  const { numSets, offsetBits, indexBits } = computeGeometry(config);
  const maxTrace = config.maxTraceLength ?? 200;

  // Initialize cache sets
  const sets: CacheLine[][] = Array.from({ length: numSets }, () => []);

  let hits = 0;
  let misses = 0;
  const trace: CacheTraceEntry[] = [];
  let orderCounter = 0;

  for (let i = 0; i < addresses.length; i++) {
    if (trace.length >= maxTrace) break;

    const address = addresses[i];
    const addrType = types[i] ?? 'data';
    const setIndex = (address >> offsetBits) & ((1 << indexBits) - 1);
    const tag = address >> (offsetBits + indexBits);

    const set = sets[setIndex];
    const hitIndex = set.findIndex((line) => line.tag === tag);
    const isHit = hitIndex >= 0;

    let evicted = false;
    let evictedTag: number | undefined;
    let action: string;

    if (isHit) {
      hits++;
      // Update LRU/FIFO order
      const line = set[hitIndex];
      if (config.replacementPolicy === 'LRU') {
        line.order = orderCounter++;
      }
      action = `HIT: tag=${tag} in set ${setIndex}`;
    } else {
      misses++;
      if (set.length < config.associativity) {
        // Set has room — insert
        set.push({ tag, order: orderCounter++ });
        action = `MISS (cold): tag=${tag} loaded into set ${setIndex}`;
      } else {
        // Set is full — evict
        evicted = true;
        if (config.replacementPolicy === 'LRU') {
          // Find least recently used (lowest order)
          let lruIdx = 0;
          for (let j = 1; j < set.length; j++) {
            if (set[j].order < set[lruIdx].order) lruIdx = j;
          }
          evictedTag = set[lruIdx].tag;
          set[lruIdx].tag = tag;
          set[lruIdx].order = orderCounter++;
          action = `MISS (LRU evict): evicted tag=${evictedTag}, loaded tag=${tag} in set ${setIndex}`;
        } else {
          // FIFO — evict oldest inserted (lowest order)
          let fifoIdx = 0;
          for (let j = 1; j < set.length; j++) {
            if (set[j].order < set[fifoIdx].order) fifoIdx = j;
          }
          evictedTag = set[fifoIdx].tag;
          set[fifoIdx].tag = tag;
          set[fifoIdx].order = orderCounter++;
          action = `MISS (FIFO evict): evicted tag=${evictedTag}, loaded tag=${tag} in set ${setIndex}`;
        }
      }
    }

    trace.push({
      step: i + 1,
      address,
      type: addrType,
      hit: isHit,
      setIndex,
      tag,
      evicted,
      evictedTag,
      action,
    });
  }

  const total = trace.length;
  const hitRate = total > 0 ? hits / total : 0;
  const missRate = total > 0 ? misses / total : 0;

  const assocLabel =
    config.associativity === 1
      ? 'direct-mapped'
      : `${config.associativity}-way set-associative`;

  return {
    config,
    hits,
    misses,
    totalAccesses: total,
    hitRate,
    missRate,
    trace,
    explanation: `Simulated ${assocLabel} cache (${config.size}B, ${config.replacementPolicy} replacement) on ${total} memory accesses: ${hits} hits, ${misses} misses, ${Math.round(hitRate * 100)}% hit rate.`,
  };
}

/**
 * Generates a sequence of memory addresses for testing.
 * Simulates a mix of instruction fetches and data accesses.
 */
export function generateAddressSequence(
  patterns: Array<{ base: number; stride: number; count: number; type: 'instruction' | 'data' }>,
): number[] {
  const addresses: number[] = [];

  for (const pattern of patterns) {
    for (let i = 0; i < pattern.count; i++) {
      addresses.push(pattern.base + i * pattern.stride);
    }
  }

  return addresses;
}

/**
 * Pre-built comparison configurations for educational demos.
 */
export const cacheConfigs: Record<string, CacheConfig> = {
  'direct-mapped-1KB-16B': {
    size: 1024,
    blockSize: 16,
    associativity: 1,
    replacementPolicy: 'LRU',
  },
  'direct-mapped-4KB-16B': {
    size: 4096,
    blockSize: 16,
    associativity: 1,
    replacementPolicy: 'LRU',
  },
  '2-way-set-assoc-1KB-16B': {
    size: 1024,
    blockSize: 16,
    associativity: 2,
    replacementPolicy: 'LRU',
  },
  '4-way-set-assoc-4KB-16B': {
    size: 4096,
    blockSize: 16,
    associativity: 4,
    replacementPolicy: 'LRU',
  },
  '8-way-set-assoc-8KB-16B-FIFO': {
    size: 8192,
    blockSize: 16,
    associativity: 8,
    replacementPolicy: 'FIFO',
  },
};
