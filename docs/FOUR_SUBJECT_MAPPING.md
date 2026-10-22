# TRACEFORGE — Four-Subject Concept Mapping

This document maps concepts to actual product behavior. A concept counts as “implemented” only when there is working code, a reproducible example and a test. Merely mentioning a concept in the report does not count.

## 1. AI Foundations & Machine Learning

| Concept | Planned feature | Evidence of implementation | Priority |
|---|---|---|---|
| AI agent loop | Observe run → select diagnostic rule → suggest next step | Deterministic diagnostic engine tests | MVP |
| Knowledge representation | Rule catalog: symptom, evidence predicate, hint, confidence | Typed rule definitions and fixtures | MVP |
| Forward chaining | Apply rules whose evidence predicates are satisfied | Unit tests for rule activation | MVP/V1 |
| Backward chaining | Start from a hypothesis and ask which evidence would support it | Guided diagnostic checklist | V1 |
| BFS/DFS/A* | Optional state-space challenge or search visualization | Known graph fixtures and path-cost checks | V1 |
| Regression/classification | Optional experiment only if labelled data and evaluation set exist | Held-out evaluation and baseline | V2 / not required |
| Gradient descent/XGBoost | Not needed for the MVP diagnostic core | Add only if there is a real prediction task | Defer |

**Important:** Rule-based diagnosis is an AI foundations/knowledge-representation demonstration; it is not machine learning. Do not claim a trained ML model unless one is actually trained and evaluated.

## 2. Design & Analysis of Algorithms (DAA)

| Concept | Planned feature | Evidence of implementation | Priority |
|---|---|---|---|
| Algorithm correctness | Expected output versus actual output on named test cases | Passing/failing fixtures | MVP |
| Edge cases | Empty input, singleton, duplicates, absent target, boundaries | Regression test suite | MVP |
| Linear vs binary search | Compare result and operation counts | Deterministic counts and explanation | V1 |
| Sorting | Compare selected sorting algorithms | Output tests and operation counter | V1 |
| Time complexity / Big-O | Display theoretical complexity with assumptions | Reviewed algorithm metadata and tests | V1 |
| Divide and conquer | Explain binary search recursion/iteration and halving | Trace and lesson | V1 |
| Greedy / dynamic programming / graph algorithms | Not committed until official syllabus is reviewed | Map to actual syllabus and product value | Defer |

The exact DAA syllabus has not yet been verified. Confirm module-by-module mapping from the official course outline before academic submission.

## 3. Theory of Computation (TOC)

| Concept | Planned feature | Evidence of implementation | Priority |
|---|---|---|---|
| FSM | Step a state machine through input symbols | Transition traces and accept/reject tests | V1 |
| Regular expressions | Match curated patterns and explain accepted strings | Positive/negative fixtures | V1 |
| Regex ↔ FSM | Demonstrate conversion only if supported by selected engine | Equivalence fixtures for bounded examples | Later |
| CFG | Parse a string and display parse tree for curated grammar | Valid/invalid grammar fixtures | V1 |
| PDA / stack | Visualize stack push/pop for nested input | Stack trace tests | Later |
| Turing machine | Step a deliberately bounded teaching machine | Transition tests and step limit | Later |

Do not label a regex matcher as an FSM simulator unless explicit state transitions are executed and shown. Do not claim full CFG support from a parser configured only for curated grammars.

## 4. Computer Organization & Architecture (COA)

| Concept | Planned feature | Evidence of implementation | Priority |
|---|---|---|---|
| Binary/number representation | Show values in supported bases | Conversion unit tests | V2 |
| Registers | TinyCPU register state | Golden instruction traces | V2 |
| ISA | Documented educational instruction set | Opcode/operand validation tests | V2 |
| Datapath/control | Show conceptual fetch/decode/execute/write-back stages | Deterministic state transitions | V2 |
| Pipelining | Visualize stages per cycle under stated assumptions | Golden pipeline fixtures | V2 |
| Hazards/stalls | Data/control hazard examples and mitigation | Hand-verified examples | V2 |
| Cache/memory hierarchy | Optional later model | Hit/miss fixture tests | Defer |
| GPU/AI accelerators | Not required for a small mini-project MVP | Include only if time and course outcomes justify | Defer |

The TinyCPU is an educational model. Clearly state whether pipeline behavior is an illustrative model or cycle-accurate; default is illustrative.

## 5. Cross-subject end-to-end example

1. **DAA:** Binary Search should find a target in a sorted array.
2. **Test evidence:** A named boundary case fails; expected and actual results are captured.
3. **AI foundations:** A rule checks observed bounds/trace and selects a relevant hint.
4. **TOC (separate lab):** The learner explores a finite-state machine using explicit transitions.
5. **COA (separate lab):** The learner steps a small instruction sequence and sees register changes.

The four subjects integrate at the platform level; do not pretend every single bug-debugging run uses all four subjects at once.

## 6. Academic evidence checklist

- [ ] Official module/topic name copied from the official syllabus.
- [ ] Feature exists and is runnable.
- [ ] At least one test or reproducible example exists.
- [ ] Screenshot/demo evidence captured by the student after running the app.
- [ ] Explanation distinguishes implemented, planned and deferred topics.
- [ ] No fabricated student validation, benchmarks or test results.
