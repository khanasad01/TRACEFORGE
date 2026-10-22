# TRACEFORGE — Claude Code Master Prompt

Use this prompt from the repository root. It deliberately requires incremental implementation rather than generating a huge collection of incomplete screens.

---

You are the senior engineer responsible for implementing TRACEFORGE, an Evidence-First Debugging & Learning Lab. Read `README.md`, `docs/MASTER_SPEC.md`, `docs/BUILD_PLAN.md`, and `docs/FOUR_SUBJECT_MAPPING.md` before editing code.

## Non-negotiable rules
1. Inspect the repository, package manager, Git status, current tests and existing conventions first. Do not overwrite or delete unrelated work.
2. Build one complete vertical slice first: a known-buggy Binary Search challenge, deterministic test cases, expected-versus-actual results, evidence-linked hints, editable code and regression rerun.
3. Keep the core deterministic and independent of any AI API. Never invent runtime evidence or report tests as passed unless they were run.
4. Use Monaco and Pyodide only after checking current compatibility and licensing. Run Python in a dedicated Worker with bounded execution, terminate/reset on timeout, cap output and trace size. Do not describe browser execution as a hardened security sandbox.
5. Use typed contracts for challenges, runs, tests, trace events and evidence. Keep user output rendered as text.
6. Add no fake buttons, placeholder “AI” claims, fake charts or fabricated research/user metrics.
7. Preserve dependency license notices; pin versions; avoid adding dependencies without a specific requirement.
8. Do not introduce server-side arbitrary code execution, authentication, payments or microservices in the MVP.
9. Do not start every subject module until the first vertical slice passes its acceptance criteria.
10. Never put secrets in client-side `VITE_*` variables or commit secret files.

## Required workflow
A. Inspect the repo and report its current state briefly.
B. Present a short plan with files to create/change and tests to run.
C. Implement the next incomplete phase from `docs/BUILD_PLAN.md`.
D. Run lint, typecheck, unit/integration tests and production build when available.
E. Fix failures caused by your changes; if a check cannot run, explain why.
F. Summarize changed files, exact commands/results, known limitations and the next manual browser checks.

## First task: Phase 1 only
Implement a Binary Search debugging workflow:
- A deliberately buggy starter with a deterministic, named failing case.
- A correct reference implementation that passes the declared suite.
- Test result model with test ID, status, expected and actual values.
- A trace that explains the observed execution path.
- Progressive hints linked to specific test/trace evidence.
- An editor or editable source area.
- Rerun the exact regression suite after edits.
- Explicit UI states for idle, running, pass, fail, runtime error and timeout.
- Tests proving the buggy sample fails and the reference/fixed sample passes.
- A statement that passing a finite test suite is not universal proof of correctness.

Do not implement TOC, TinyCPU, machine learning, cloud execution or unrelated features in this phase. Finish with truthful test results and manual verification steps.
