# TRACEFORGE

**Evidence-First Debugging & Learning Lab**  
**Tagline:** Don't just fix the bug. Prove why it failed.

TRACEFORGE is a learning-focused developer tool for computer-science students. It is designed to connect a reproducible program failure to evidence, guided understanding, algorithm analysis, and a verified fix—rather than returning an unexplained answer.

> **Repository status (2026-10-22):** Documentation foundation is present, but the application has **not been scaffolded yet**. There is currently no `package.json`, `src/` application code, test suite, or CI workflow. The features below are planned behavior, not claims about an implemented app. The first build milestone is a small, testable Binary Search debugging vertical slice.

## Product promise

Given a supported program and a defined test case, TRACEFORGE should help a learner:
1. reproduce a failure;
2. compare expected and actual behavior;
3. inspect a deterministic execution trace;
4. receive an evidence-linked hint;
5. edit the solution and rerun regression tests;
6. understand the limits of what the tests prove.

The product must never claim that a program is universally correct merely because a finite test suite passes.

## Four-subject integration

| Subject | Planned executable learning capability |
|---|---|
| AI Foundations & Machine Learning | Rule/knowledge-based diagnostics, goal-directed hints, selected search methods; ML only when labelled data and a measurable use case exist |
| Design & Analysis of Algorithms (DAA) | Algorithm challenges, correctness/edge-case checks, operation counts, complexity comparisons |
| Theory of Computation (TOC) | FSM transitions, regular-expression matching, tokenization and grammar-based parsing |
| Computer Organization & Architecture (COA) | Educational instruction execution, registers, datapath concepts and basic pipeline-hazard simulation |

The exact DAA module mapping must be checked against the official course syllabus before academic submission. The educational CPU is a simplified simulator, not a claim about exact modern processor behavior.

## MVP focus

The first milestone is one complete Binary Search debugging workflow:
- a known-buggy starter program and deterministic test cases;
- expected-versus-actual result display;
- reproducible evidence and an execution trace;
- progressive hints linked to the observed failure;
- editable solution and regression-test rerun;
- honest reporting of tests run and tests passed.

After this works end-to-end, expand in small increments to algorithm comparisons, TOC tools and TinyCPU.

## Proposed technology direction

- React + TypeScript + Vite for the web application.
- Monaco Editor for the code editor UI.
- Pyodide in a dedicated Web Worker for the initial browser-based Python prototype, with execution and resource limits.
- Own canonical evidence/trace schema so UI, diagnostics and tests are not coupled to a third-party tool's data model.
- Automata/parser dependencies only after a small proof of integration and a license review.

Browser execution is not a hardened server sandbox. Do not send arbitrary user code to a privileged server process. If server-side multi-language execution is introduced later, design a separate isolated execution service and review security and licensing (including Judge0's GPL-3.0 license) before adoption.

## Repository map

Current tracked files:
- `README.md` — project overview and current status.
- `docs/MASTER_SPEC.md` — product, architecture, data contracts, rules, security and decisions.
- `docs/BUILD_PLAN.md` — incremental implementation roadmap and acceptance gates.
- `docs/FOUR_SUBJECT_MAPPING.md` — concept-to-feature mapping, assumptions and scope boundaries.
- `docs/CLAUDE_CODE_MASTER_PROMPT.md` — repository-aware, phase-based implementation instructions.
- `.env.example` — safe template with no real secrets.
- `.gitignore` — ignores local environment files and generated artifacts.

**Not yet present:** `package.json`, `src/`, tests, CI workflow, and a license file. These must be deliberately added/decided during the app bootstrap; do not assume the application can run yet.

## Local development

**The app is not runnable yet.** Because `package.json` and application source have not been added, `npm install` and `npm run dev` are not available at this stage. First complete Phase 0 of `docs/BUILD_PLAN.md` to scaffold the app and define scripts. After that scaffold exists, use:

```bash
npm install
npm run dev
```

Quality checks (only after the matching scripts are implemented):

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Do not treat a command as passed until it has actually been run and its exit status checked.

## Engineering principles

1. **Evidence before explanation.** Store inputs, expected output, actual output, run status and trace as structured data.
2. **Deterministic core first.** The analyzer and test runner must work without an external AI API.
3. **Pedagogy over answer copying.** Hints should reveal reasoning progressively.
4. **Bounded execution.** Apply time, memory, input-size and worker lifecycle limits.
5. **Explicit uncertainty.** Distinguish observed facts, inferred causes and hypotheses.
6. **Scope honesty.** A small verified implementation is better than many placeholder modules.
7. **Dependency discipline.** Pin versions, preserve license notices and adopt a dependency only for a concrete need.
8. **Student privacy.** Do not collect source code or analytics unnecessarily; do not ship secrets in client-side environment variables.

## Contributing and changes

Keep changes small and auditable. Every feature should include acceptance criteria and tests. Do not add nonfunctional controls or fabricated diagnostics. When behavior changes, update the documentation and examples in the same change.

## Current next step

Complete the Binary Search vertical slice and pass its unit, integration, type-check and build gates before expanding to the four subject labs.
