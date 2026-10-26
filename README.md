# TRACEFORGE

**Evidence-First Debugging & Multi-Subject Learning Lab**  
**Tagline:** Don't just fix the bug. Prove why it failed.

TRACEFORGE is an educational laboratory for computer-science students and instructors. It connects reproducible computational experiments to concrete execution evidence, step-by-step traces, and conceptual understanding across four core computer science subjects.

## What changed (UI Redesign)
- Unified design token system (`src/styles/tokens.css`) — all 19 component stylesheets migrated
- WCAG AA contrast verified across all token pairs  
- Accessible Tooltip on algorithm controls (AI, Sorting, Graph labs)
- Animated operation counters in SortingLab (reduced-motion safe)
- Expandable evidence panel in TestResultPanel
- TicTacToe board layout fixed
- 292 tests across 34 files (was 117 across 10)

---

## 1. Integrated Four-Subject Coverage

| Subject | Interactive Lab | Working Features & Evidence Engine | Status |
|---|---|---|---|
| **AI Foundations** | **Search, Reasoning, Knowledge & ML Lab** | Five grid-search strategies; Minimax + alpha-beta Tic-Tac-Toe; forward/backward-chaining Knowledge Representation Lab; interpretable logistic regression with learned weights, training trace, held-out predictions, and evaluation metrics. | **Implemented & Tested** |
| **Design & Analysis of Algorithms (DAA)** | **Algorithm Debugging & Complexity Lab** | Editable Binary Search debugging challenge and evidence export; empirical Binary vs. Linear Search comparison; Bubble, Insertion, and Merge Sort; BFS/DFS graph traversal with frontier and visited-state evidence. | **Implemented & Tested** |
| **Theory of Computation (TOC)** | **Automata & Formal Languages Lab** | Three DFA simulators; Thompson epsilon-NFA compilation/simulation for a documented regex subset; CYK parse tree and trace for a curated CNF grammar; bounded PDA stack simulation for aⁿbⁿ; bounded single-tape unary increment Turing Machine. | **Implemented & Tested (scoped examples)** |
| **Computer Organization & Architecture (COA)** | **TinyCPU Architecture Labs** | Sequential 8-bit TinyCPU with editable assembly; separate five-stage cycle-by-cycle pipeline timing model with RAW stalls; interactive byte input/output instructions; cache hierarchy simulator. | **Implemented & Tested (scoped models)** |

---

## 2. Architecture & Design Principles

1. **Independent Deterministic Domain Engines**: Pure TypeScript domain logic separated cleanly from the React UI (`src/engine/`):
   - `aiSearch.ts`: Breadth-First Search & A* Search with Manhattan heuristic.
   - `binarySearch.ts` & `safeInterpreter.ts`: Acorn-based sandboxed AST interpreter for student Binary Search submissions.
   - `sorting.ts`: Bubble, Insertion, and Merge Sort with execution-derived operation traces.
   - `graphTraversal.ts`: deterministic BFS/DFS with editable adjacency lists and actual frontier traces.
   - `logisticRegression.ts`: two-feature logistic classifier trained with gradient descent and evaluated on a deterministic stratified holdout set.
   - `daaComparison.ts`: Empirical step counter comparing logarithmic vs. linear complexity.
   - `tocDFA.ts`, `tocNFA.ts`, `tocCFG.ts`, `tocPDA.ts`, and `tocTM.ts`: DFA/NFA execution, regex compilation, curated CNF parsing, bounded PDA simulation, and a simplified Turing Machine.
   - `tinyCPU.ts` and `tinyCPUPipeline.ts`: sequential 8-bit CPU with byte I/O and a separate five-stage no-forwarding pipeline timing model.
2. **Deterministic Evidence Contracts**: Every state change, transition, or instruction generates a concrete, verifiable step trace.
3. **Strict Bounded Execution**: Every interpreter, state-space search, and CPU simulator enforces explicit step limits (e.g., 500 steps) to prevent browser freezes.
4. **Lightweight Client Bundle**: Fast, offline browser execution without multi-megabyte dependencies (production JavaScript bundle is approximately 411 kB uncompressed, 124 kB gzip).

---

## 3. Running Locally

```bash
# Install dependencies
npm ci

# Start development server
npm run dev

# Run full test suite (292 automated tests across 34 test files)
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

- **AI Foundations**: Five search strategies, Minimax Tic-Tac-Toe, forward/backward-chaining Knowledge Representation, and an interpretable two-feature logistic-regression experiment are implemented. Its small synthetic dataset is an educational example, not a validated real-world model.
- **DAA**: Binary Search debugging, evidence export, search operation comparison, three traced sorting algorithms, and BFS/DFS graph traversal are implemented. Other syllabus-specific algorithms remain dependent on scope confirmation.
- **TOC**: DFA, a documented regular-expression subset compiled to epsilon-NFA, a curated CNF parser, one bounded PDA example, and one bounded single-tape Turing Machine example are implemented. The grammar and machine sets are curated educational examples, not general grammar/machine editors.
- **COA**: Sequential instruction execution, register files, PC, branching, byte input/output, a separate five-stage pipeline timing model with RAW stalls, and cache hierarchy simulation are implemented. The pipeline does not dynamically execute branches or model a complete cycle-accurate CPU.
