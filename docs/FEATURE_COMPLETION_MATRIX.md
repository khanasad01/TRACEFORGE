# TRACEFORGE — Feature Completion Matrix

Status reflects executable code and automated tests in the current repository.

| Subject | Implemented and verified scope | Remaining original-scope gaps |
|---|---|---|
| AI Foundations | BFS, DFS, UCS, Greedy Best-First, A*; Minimax Tic-Tac-Toe; rule-based forward/backward chaining Knowledge Lab; interpretable logistic regression with a deterministic held-out evaluation, learned weights, loss trace, and classification metrics | No additional gap identified in the currently specified AI scope |
| DAA | Binary Search debugging and evidence export; Bubble, Insertion, and Merge Sort; BFS/DFS graph traversal with editable adjacency list and frontier/visited traces | Additional syllabus-specific algorithm challenges require an authoritative syllabus |
| TOC | Three DFA examples; Thompson epsilon-NFA for a documented regex subset; curated CNF/CYK parser; bounded PDA for aⁿbⁿ; bounded single-tape unary increment Turing Machine | General-purpose grammar and automata editors are outside the current curated examples |
| COA | Sequential 8-bit TinyCPU; independent five-stage IF/ID/EX/MEM/WB timing model with no-forwarding RAW stalls; byte input queue and output stream; cache hierarchy simulator | Pipeline is a timing model, not a functional/cycle-accurate processor; branch paths are not dynamically simulated in the pipeline |

Current verification: `npm test` — 266 passed across 30 files; `npm run lint`, `npm run typecheck`, and `npm run build` all passed.
