# TRACEFORGE — Four-Subject Concept Mapping

This document maps concepts to actual product behavior. A concept counts as “implemented” only when there is working code, a reproducible example and an automated test.

---

## 1. AI Foundations & Search

| Concept | Implemented Feature | Evidence & Tests | Status |
|---|---|---|---|
| State-Space Search | 6x6 grid with start (0,0), goal (5,5), and obstacles | `src/engine/aiSearch.ts` | **Implemented** |
| Uninformed Search (BFS) | FIFO queue expansion, layer-by-layer exploration, guaranteed unweighted shortest path | `src/__tests__/engine/fourSubjects.test.ts` | **Implemented** |
| Informed Search (A*) | Priority queue with evaluation function $f(n) = g(n) + h(n)$ using Manhattan distance | `src/__tests__/engine/fourSubjects.test.ts` | **Implemented** |
| Knowledge Representation & Forward Chaining | Rule-based diagnostic forward chaining over evidence report to generate hints | `src/diagnostics/engine.ts`, `src/__tests__/diagnostics/engine.test.ts` | **Implemented** |
| Regression/Neural Models | Held-out training/evaluation sets | Deferred until specific syllabus dataset requirements are provided | **Deferred** |

*Note: The rule-based diagnostic engine represents classical AI knowledge representation and forward chaining, not statistical machine learning.*

---

## 2. Design & Analysis of Algorithms (DAA)

| Concept | Implemented Feature | Evidence & Tests | Status |
|---|---|---|---|
| Divide & Conquer Correctness | Buggy starter vs. fixed reference implementation on 9 deterministic test cases | `src/engine/binarySearch.ts`, `src/__tests__/engine/binarySearch.test.ts` | **Implemented** |
| Boundary & Edge Cases | Empty array, singletons, left/right array bounds, missing targets, duplicates | `src/challenges/binarySearch/challenge.ts`, `src/__tests__/engine/regression.test.ts` | **Implemented** |
| Operation Counting Comparison | Live comparison of operation steps: Binary Search ($O(\log N)$) vs. Linear Search ($O(N)$) | `src/engine/daaComparison.ts`, `src/__tests__/engine/fourSubjects.test.ts` | **Implemented** |
| Theoretical vs. Empirical Complexity | Displaying empirical step counts alongside theoretical Big-O notation | `src/App.tsx`, `src/__tests__/engine/fourSubjects.test.ts` | **Implemented** |
| Dynamic Programming / Greedy | Additional syllabus topics | To be mapped from official course syllabus | **Planned** |

---

## 3. Theory of Computation (TOC)

| Concept | Implemented Feature | Evidence & Tests | Status |
|---|---|---|---|
| Deterministic Finite Automata (DFA) | Formal 5-tuple $(Q, \Sigma, \delta, q_0, F)$ simulation engine | `src/engine/tocDFA.ts`, `src/components/TOCAutomataLab.tsx` | **Implemented** |
| Regular Language Acceptance | Accepts language $L = (0+1)^*01$ with 3 states; tests for accepted, rejected, and invalid inputs | `src/__tests__/engine/fourSubjects.test.ts` | **Implemented** |
| State Transition Trace | Cycle-by-cycle trace showing fromState, symbol, toState, remainingInput, and intermediate accept state | `src/components/TOCAutomataLab.tsx` | **Implemented** |
| Pushdown Automata (PDA) | Stack-based language recognition ($a^n b^n$) | Deferred to future lab module | **Planned** |
| Turing Machines | Tape and transition function | Deferred to future lab module | **Planned** |

---

## 4. Computer Organization & Architecture (COA)

| Concept | Implemented Feature | Evidence & Tests | Status |
|---|---|---|---|
| Educational CPU Simulation | Program Counter (PC), 4 General Purpose Registers (R0–R3), Zero Flag (Z), 16-byte RAM | `src/engine/tinyCPU.ts`, `src/components/TinyCPULab.tsx` | **Implemented** |
| Instruction Set Architecture (ISA) | `MOV`, `ADD`, `SUB`, `LOAD`, `STORE`, `JMP`, `JZ`, `HALT` | `src/__tests__/engine/fourSubjects.test.ts` | **Implemented** |
| Micro-architectural Cycle | Fetch → Decode → Execute cycle trace recording full machine state before and after each instruction | `src/engine/tinyCPU.ts` | **Implemented** |
| Pipeline Hazard Tracking | Read-After-Write (RAW) data dependency hazard detection and stall advisory | `src/__tests__/engine/fourSubjects.test.ts` | **Implemented** |
| Cache Hierarchy | Direct-mapped / associative cache hit/miss simulation | Deferred | **Planned** |

*Note: TinyCPU is an educational simulator for conceptual understanding, not a cycle-accurate commercial hardware model.*
