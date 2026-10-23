# TRACEFORGE

**Evidence-First Debugging & Multi-Subject Learning Lab**  
**Tagline:** Don't just fix the bug. Prove why it failed.

TRACEFORGE is an educational laboratory for computer-science students and instructors. It connects reproducible computational experiments to concrete execution evidence, step-by-step traces, and conceptual understanding across four core computer science subjects.

---

## 1. Integrated Four-Subject Coverage

| Subject | Interactive Lab | Working Features & Evidence Engine | Status |
|---|---|---|---|
| **AI Foundations** | **Search & Reasoning Lab** | Interactive 6x6 grid environment with obstacles; five search algorithms — BFS, DFS, UCS, Greedy Best-First, and A* (informed heuristic search with Manhattan distance); real-time frontier, explored states, path cost $g(n)$, heuristic $h(n)$, and step-by-step expansion trace; rule-based forward-chaining diagnostic inference; Tic-Tac-Toe game with Minimax + alpha-beta pruning (AI never loses). | **Implemented & Tested** |
| **Design & Analysis of Algorithms (DAA)** | **Algorithm Debugging & Complexity Lab** | Editable Binary Search off-by-one debugging challenge; safe AST-interpreted sandbox (Acorn ESTree parser); 9 deterministic test cases; genuine execution trace; progressive hints; empirical operation counting comparing Binary Search ($O(\log N)$) vs. Linear Search ($O(N)$). | **Implemented & Tested** |
| **Theory of Computation (TOC)** | **Automata Lab** | Interactive Deterministic Finite Automaton (DFA) simulator with three built-in automata: binary strings ending in "01", even number of 1s, and divisible-by-3; formal 5-tuple $(Q, \Sigma, \delta, q_0, F)$ definition viewer; interactive input strings and presets; deterministic cycle-by-cycle state transition trace and accept/reject decision evidence; visual state diagram showing start, accept, and final states. | **Implemented & Tested** |
| **Computer Organization & Architecture (COA)** | **TinyCPU Simulator** | Educational 8-bit instruction set simulator with Program Counter (PC), 4 registers (R0–R3), zero flag, and 16-byte RAM; Fetch-Decode-Execute micro-architectural cycles; ISA supporting `MOV`, `ADD`, `SUB`, `LOAD`, `STORE`, `JMP`, `JZ`, `HALT`; three built-in example programs (sum loop, factorial, Fibonacci) with program selector; editable assembly; Read-After-Write (RAW) pipeline hazard detection. | **Implemented & Tested** |

---

## 2. Architecture & Design Principles

1. **Independent Deterministic Domain Engines**: Pure TypeScript domain logic separated cleanly from the React UI (`src/engine/`):
   - `aiSearch.ts`: Breadth-First Search & A* Search with Manhattan heuristic.
   - `binarySearch.ts` & `safeInterpreter.ts`: Acorn-based sandboxed AST interpreter for student Binary Search submissions.
   - `daaComparison.ts`: Empirical step counter comparing logarithmic vs. linear complexity.
   - `tocDFA.ts`: Deterministic finite automaton transition engine.
   - `tinyCPU.ts`: 8-bit educational CPU with memory and pipeline hazard tracker.
2. **Deterministic Evidence Contracts**: Every state change, transition, or instruction generates a concrete, verifiable step trace.
3. **Strict Bounded Execution**: Every interpreter, state-space search, and CPU simulator enforces explicit step limits (e.g., 500 steps) to prevent browser freezes.
4. **Lightweight Client Bundle**: Fast, offline browser execution without multi-megabyte dependencies (entire production bundle is ~311 kB uncompressed, ~98 kB gzip).

---

## 3. Running Locally

```bash
# Install dependencies
npm ci

# Start development server
npm run dev

# Run full test suite (85 automated tests across 9 test files)
npm test

# Run ESLint (enforced at 0 warnings)
npm run lint

# Run TypeScript compiler checks
npm run typecheck

# Production build
npm run build
```

---

## 4. Subject Mapping & Academic Syllabus Status

- **AI Foundations**: State space search (BFS/A*) and rule-based forward-chaining diagnostic inference are fully implemented and verified. Machine learning / neural training is intentionally deferred as noted in `docs/FOUR_SUBJECT_MAPPING.md`.
- **DAA**: Divide-and-conquer binary search, off-by-one boundary bugs, and operation-counting comparisons ($O(\log N)$ vs $O(N)$) are fully implemented and tested.
- **TOC**: Regular language acceptance, 5-tuple DFA definitions, and step-by-step state transition traces are fully implemented. Pushdown Automata and Turing machines remain planned for future iterations.
- **COA**: Educational instruction execution, register files, PC, branching on zero flag, and pipeline RAW hazard detection are fully implemented. Three built-in example programs (sum loop, factorial, Fibonacci) with program selector. Multilevel cache hierarchies remain planned for future iterations.
