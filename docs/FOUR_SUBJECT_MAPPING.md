# TRACEFORGE — Four-Subject Concept Mapping

This document maps concepts to actual product behavior. A concept counts as “implemented” only when there is working code, a reproducible example and an automated test.

---

## 1. AI Foundations & Search

| Concept | Implemented Feature | Evidence & Tests | Status |
|---|---|---|---|
| State-Space Search | 6x6 grid with start (0,0), goal (5,5), and obstacles | `src/engine/aiSearch.ts` | **Implemented** |
| Uninformed Search (BFS) | FIFO queue expansion, layer-by-layer exploration, guaranteed unweighted shortest path | `src/__tests__/engine/fourSubjects.test.ts` | **Implemented** |
| Informed Search (A*) | Priority queue with evaluation function $f(n) = g(n) + h(n)$ using Manhattan distance; full trace with all expansion steps (no truncation) | `src/engine/aiSearch.ts`, `src/__tests__/engine/fourSubjects.test.ts` | **Implemented** |
| DFS (Depth-First Search) | LIFO frontier (stack), explores deep before backtracking; demonstrates non-optimality on grid search | `src/engine/aiSearch.ts`, `src/__tests__/engine/fourSubjects.test.ts` | **Implemented** |
| UCS (Uniform-Cost Search) | Lowest-cost-first expansion with priority queue; optimal for weighted graphs | `src/engine/aiSearch.ts`, `src/__tests__/engine/fourSubjects.test.ts` | **Implemented** |
| Greedy Best-First Search | Heuristic-only $h(n)$ priority queue; fast but not guaranteed optimal | `src/engine/aiSearch.ts`, `src/__tests__/engine/fourSubjects.test.ts` | **Implemented** |
| Knowledge Representation & Forward Chaining | Rule-based diagnostic forward chaining over evidence report to generate hints | `src/diagnostics/engine.ts`, `src/__tests__/diagnostics/engine.test.ts` | **Implemented** |
| Knowledge Representation & Backward Chaining | Goal-directed proof search with rule/fact trace; unsupported goals and cycles terminate safely | `src/engine/inference.ts`, `src/components/KnowledgeLab.tsx`, `src/__tests__/engine/inference.test.ts` | **Implemented** |
| Minimax with Alpha-Beta Pruning | Optimal game-playing algorithm for perfect-information two-player games (Tic-Tac-Toe); alpha-beta pruning eliminates subtrees that cannot affect the decision | `src/engine/aiSearch.ts`, `src/components/TicTacToeLab.tsx`, `src/__tests__/engine/fourSubjects.test.ts`, `src/__tests__/ui/ticTacToe.test.tsx` | **Implemented** |
| Interpretable Classification | Two-feature logistic regression trained by batch gradient descent; per-epoch loss/weight evidence; deterministic stratified holdout with confusion counts, accuracy, precision, recall, and F1; interactive profile predictions | `src/engine/logisticRegression.ts`, `src/components/InterpretableMLLab.tsx`, `src/__tests__/engine/logisticRegression.test.ts` | **Implemented (synthetic dataset)** |

*Note: The rule-based diagnostic engine represents classical AI knowledge representation, not statistical machine learning. The classifier's small synthetic dataset is instructional and does not validate real student outcomes.*

---

## 2. Design & Analysis of Algorithms (DAA)

| Concept | Implemented Feature | Evidence & Tests | Status |
|---|---|---|---|
| Divide & Conquer Correctness | Buggy starter vs. fixed reference implementation on 9 deterministic test cases | `src/engine/binarySearch.ts`, `src/__tests__/engine/binarySearch.test.ts` | **Implemented** |
| Sorting Algorithms | Bubble, Insertion, and Merge Sort with algorithm-generated comparison, swap/write, and merge traces | `src/engine/sorting.ts`, `src/__tests__/engine/sorting.test.ts` | **Implemented** |
| Graph Traversal | Deterministic BFS/DFS over an editable undirected adjacency list with traversal-order, frontier, discovery, and visited evidence | `src/engine/graphTraversal.ts`, `src/components/GraphTraversalLab.tsx`, `src/__tests__/engine/graphTraversal.test.ts` | **Implemented** |
| Boundary & Edge Cases | Empty array, singletons, left/right array bounds, missing targets, duplicates | `src/challenges/binarySearch/challenge.ts`, `src/__tests__/engine/regression.test.ts` | **Implemented** |
| Operation Counting Comparison | Live comparison of operation steps: Binary Search ($O(\log N)$) vs. Linear Search ($O(N)$) | `src/engine/daaComparison.ts`, `src/__tests__/engine/fourSubjects.test.ts` | **Implemented** |
| Theoretical vs. Empirical Complexity | Displaying empirical step counts alongside theoretical Big-O notation | `src/App.tsx`, `src/__tests__/engine/fourSubjects.test.ts` | **Implemented** |
| Evidence Export | Download reproducible evidence report as JSON (run ID, code hash, test results, trace, diagnostics) | `src/App.tsx` | **Implemented** |
| Dynamic Programming / Greedy | Additional syllabus topics | To be mapped from official course syllabus | **Planned** |

---

## 3. Theory of Computation (TOC)

| Concept | Implemented Feature | Evidence & Tests | Status |
|---|---|---|---|
| Deterministic Finite Automata (DFA) | Formal 5-tuple $(Q, \Sigma, \delta, q_0, F)$ simulation engine with three built-in automata: binary ending in "01", even number of 1s, divisible-by-3 | `src/engine/tocDFA.ts`, `src/components/TOCAutomataLab.tsx` | **Implemented** |
| Regular Language Acceptance | Accepts languages for all three DFAs; tests for accepted, rejected, invalid alphabet, and empty string inputs | `src/__tests__/engine/fourSubjects.test.ts` | **Implemented** |
| State Transition Trace | Cycle-by-cycle trace showing fromState, symbol, toState, remainingInput, and intermediate accept state | `src/components/TOCAutomataLab.tsx` | **Implemented** |
| Multi-Automaton Exploration | DFA selector dropdown with definition viewer (states, alphabet, start, accept) and visual state diagram showing start/accept/final states | `src/components/TOCAutomataLab.tsx` | **Implemented** |
| Nondeterministic Finite Automata | Thompson epsilon-NFA execution using epsilon-closure state sets and a per-input-symbol trace | `src/engine/tocNFA.ts`, `src/components/TOCNFALab.tsx` | **Implemented** |
| Regular Expression Compilation | Documented subset of literals, concatenation, union, Kleene star, grouping, and epsilon compiled to an NFA | `src/engine/tocNFA.ts`, `src/__tests__/engine/tocNFA.test.ts` | **Implemented (documented subset)** |
| Context-Free Grammar Parsing | CYK recognition for curated Chomsky Normal Form grammar for $a^n b^n$, with parse tree and chart-evaluation evidence | `src/engine/tocCFG.ts`, `src/components/TOCCFGLab.tsx` | **Implemented (curated CNF only)** |
| Pushdown Automata | Bounded nondeterministic PDA configuration search with explicit stack traces; built-in machine recognizes $a^n b^n$ | `src/engine/tocPDA.ts`, `src/components/TOCPDALab.tsx` | **Implemented (one curated PDA)** |
| Turing Machines | Bounded deterministic single-tape machine with read/write/head-move trace; built-in unary increment experiment | `src/engine/tocTM.ts`, `src/components/TOCTuringMachineLab.tsx` | **Implemented (one simplified machine)** |

---

## 4. Computer Organization & Architecture (COA)

| Concept | Implemented Feature | Evidence & Tests | Status |
|---|---|---|---|
| Educational CPU Simulation | Program Counter (PC), 4 General Purpose Registers (R0–R3), Zero Flag (Z), 16-byte RAM | `src/engine/tinyCPU.ts`, `src/components/TinyCPULab.tsx` | **Implemented** |
| Instruction Set Architecture (ISA) | `MOV`, `ADD`, `SUB`, `LOAD`, `STORE`, `JMP`, `JZ`, `IN`, `OUT`, `HALT`; input underflow is an explicit runtime error | `src/engine/tinyCPU.ts`, `src/__tests__/engine/tinyCPUIO.test.ts` | **Implemented** |
| Sequential Instruction Trace | Per-instruction state changes, execution effects, and output log | `src/engine/tinyCPU.ts`, `src/components/TinyCPULab.tsx` | **Implemented** |
| Five-Stage Pipeline Timing | IF/ID/EX/MEM/WB occupancy each cycle; RAW stalls and bubbles without forwarding; WB is visible to ID in the same cycle | `src/engine/tinyCPUPipeline.ts`, `src/__tests__/engine/tinyCPUPipeline.test.ts`, `src/components/TinyCPUPipelineLab.tsx` | **Implemented (timing model)** |
| Interactive I/O Experiment | Editable byte input stream and program, actual IN/OUT execution, output log, and per-step trace | `src/components/TinyCPUIOLab.tsx`, `src/__tests__/ui/tinyCPUIOLab.test.tsx` | **Implemented** |
| Cache Hierarchy | Direct-mapped and set-associative cache simulation with LRU/FIFO replacement policies, configurable size/block/associativity, hit-miss tracking with detailed trace, and thrashing pattern demonstration | `src/engine/cacheSim.ts`, `src/__tests__/engine/fourSubjects.test.ts` | **Implemented** |

*Note: The pipeline timing model schedules the listed instruction stream and does not dynamically execute branches or model forwarding or a complete cycle-accurate processor.*
