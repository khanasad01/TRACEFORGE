# TRACEFORGE Build Plan

**Strategy:** Build one complete, testable vertical slice before expanding. Estimates assume one student developer using Claude Code and part-time effort; calendar time is indicative, not a guarantee.

## Phase 0 — Repository baseline (0.5–1 day)
- [ ] Confirm Node.js LTS, npm, Git and editor.
- [ ] Add Vite + React + TypeScript scaffold if the repo does not already have one.
- [ ] Configure lint, format, typecheck, test and build scripts.
- [ ] Add CI workflow and dependency lockfile.
- **Gate:** clean install and production build pass.

## Phase 1 — Binary Search vertical slice (2–4 days)
- [ ] Define challenge metadata, buggy starter, correct reference and named tests.
- [ ] Add deterministic test harness and normalized result model.
- [ ] Render editor, test cases, expected/actual values and status.
- [ ] Add regression rerun after edit.
- **Gate:** seeded bug fails at least one named case; reference solution passes all declared tests.

## Phase 2 — Evidence and coaching (2–4 days)
- [ ] Add versioned evidence envelope and bounded trace events.
- [ ] Add rule-based diagnosis based only on run evidence.
- [ ] Add progressive hints and source/evidence references.
- [ ] Distinguish observed fact from suspected cause.
- **Gate:** each displayed diagnosis maps to a test or trace event; no fake “AI found” claims.

## Phase 3 — Browser Python runtime (2–5 days)
- [ ] Prototype Pyodide in a dedicated Web Worker.
- [ ] Define supported Python subset and dependency/package limits.
- [ ] Add wall-clock deadline, worker termination/recreation, output and trace caps.
- [ ] Test infinite loop, large output, thrown exception, invalid source and worker crash.
- **Gate:** timeout does not freeze the UI; document that this is not a hardened server sandbox.

## Phase 4 — DAA lab (3–5 days)
- [ ] Add linear search, binary search and 1–2 sorting algorithms.
- [ ] Count operations using explicit counting rules.
- [ ] Show complexity as theoretical analysis, separate from measured counts.
- [ ] Test empty/singleton/duplicate/worst-case inputs.
- **Gate:** expected outputs and counters match hand-checked fixtures.

## Phase 5 — TOC lab (3–6 days)
- [ ] Implement FSM state transition runner and acceptance/rejection traces.
- [ ] Add regex examples and clear distinction between regex syntax and FSM execution.
- [ ] Add curated CFG parsing/parse tree (consider Lark in a Python service or another compatible parser).
- [ ] Defer PDA/Turing-machine work until scope and time are confirmed.
- **Gate:** known accepted/rejected strings and grammar fixtures pass.

## Phase 6 — TinyCPU (4–7 days)
- [ ] Specify educational instruction set, registers, memory and instruction semantics.
- [ ] Implement single-step interpreter and trace output.
- [ ] Add pipeline visualization as a separate model with documented assumptions.
- [ ] Test arithmetic, branch, memory bounds, stalls and hazard cases.
- **Gate:** golden traces are deterministic; never imply cycle-accurate real CPU simulation.

## Phase 7 — Student pilot (2–3 days)
- [ ] Ask 5–8 students to use the MVP without coaching.
- [ ] Measure time to evidence, task completion, hint usefulness and errors.
- [ ] Record actual observations; do not invent quotes or metrics.
- [ ] Prioritize only high-frequency/high-severity issues.
- **Gate:** summarize results and decide what to improve next.

## Suggested first 48 hours
1. Read `docs/MASTER_SPEC.md` and check project constraints.
2. Bootstrap app only if missing; preserve existing files.
3. Create a Binary Search bug with a reproducible failing test.
4. Display expected versus actual output.
5. Add a minimal regression rerun.
6. Run lint, typecheck, tests and build; document the real output.

## Release checklist
- [ ] Acceptance criteria linked to implementation.
- [ ] No nonfunctional buttons or fabricated diagnostics.
- [ ] Timeouts and large output handled.
- [ ] User code/output rendered as text, not unsafe HTML.
- [ ] No secrets committed or bundled into the client.
- [ ] Dependency versions and licenses checked.
- [ ] README commands tested on a clean install.
- [ ] Known limitations visible to user and evaluator.
