# TRACEFORGE

**Evidence-First CS Learning & Debugging Lab**

> "Don't just fix the bug. Prove why it failed."

🚀 **Live Demo:** [https://traceforge-asad.netlify.app](https://traceforge-asad.netlify.app)
📦 **GitHub:** [https://github.com/khanasad01/TRACEFORGE](https://github.com/khanasad01/TRACEFORGE)

---

## The Problem

Most CS learning tools show you **what** happened — a wrong answer, a failed test, a red X.

They don't show you **why**.

- You run Binary Search on a sorted array. It returns `-1`. **Why?**
- You implement Bubble Sort. It passes 4 out of 5 tests. **Which case breaks it?**
- You build a DFA. It rejects a valid string. **Which transition failed?**
- You write a cache policy. Hit rate is 40%. **Why is it missing so much?**

Without evidence, debugging is just guessing.

---

## The Solution

TRACEFORGE makes every execution **observable**. Every algorithm run produces a full evidence trail — not just a result, but proof.

| Instead of... | TRACEFORGE shows... |
|---------------|---------------------|
| ❌ "Wrong answer" | ✅ Expected `42`, got `-1` — here is the full trace |
| ❌ "Test failed" | ✅ Which boundary case broke, and exactly why |
| ❌ "Algorithm finished" | ✅ Every comparison, swap, and state transition |
| ❌ "Cache miss" | ✅ Which block was evicted, when, and why |

**Don't just fix the bug. Prove why it failed.**

---

## Four Subject Labs

| Lab | Topics Covered |
|-----|----------------|
| 🤖 **AI Foundations** | A\*, BFS, DFS, Greedy Search, Knowledge Base inference, Tic-Tac-Toe with Minimax + Alpha-Beta Pruning, Logistic Regression |
| ⚡ **DAA Lab** | Binary Search debugging, Bubble/Selection/Insertion/Merge/Quick Sort, Graph Traversal (BFS/DFS), operation counters, complexity analysis |
| 🔤 **TOC Lab** | DFA simulation, NFA + Regex, Context-Free Grammars, Pushdown Automata, Turing Machine |
| 🖥️ **COA Lab** | TinyCPU with registers and memory, Instruction Pipeline, Cache hierarchy simulation, I/O operations |

---

## Why It Feels Different

- **Evidence first** — every test failure shows expected vs actual, not just pass/fail
- **Execution traces** — see every step the algorithm took, not just the final answer
- **Progressive hints** — stuck? Get a nudge, not the full solution
- **Real engines** — no mock data, no fake results, every output comes from a real algorithm
- **Accessible interactions** — keyboard navigable, screen reader friendly, reduced-motion safe

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 18 + TypeScript + Vite |
| Styling | Raw CSS Modules + CSS custom properties (no Tailwind, no UI libraries) |
| Testing | Vitest + Testing Library — 292 tests across 34 files |
| Design | Unified token system, WCAG AA contrast verified |

---

## UI Design Highlights

- `src/styles/tokens.css` — 99 CSS custom properties, all 19 component stylesheets migrated
- **WCAG AA contrast** verified across all token pairs (4.5:1 minimum)
- **Dark technical workspace** with warm-orange accent (`#f97316`)
- **Accessible Tooltip** on algorithm controls — opens on hover and keyboard focus, closes on Escape
- **Animated operation counters** — count-up animation, jumps to final value with reduced-motion
- **Expandable evidence panel** — `aria-expanded`, keyboard navigable, interruptible transitions
- `prefers-reduced-motion` respected throughout

---

## Test Coverage

```
Test Files  34 passed (34)
Tests       292 passed (292)
Engines     ✅  AI · DAA · TOC · COA all verified
UI          ✅  Tooltip · AnimatedCounter · ExpandablePanel · all labs
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run all tests
npm test

# Production build
npm run build

# Verify WCAG contrast
node scripts/check-contrast.cjs
```

---

## Project Structure

```
src/
├── components/          # React lab components + shared UI
│   ├── Tooltip.tsx      # Accessible tooltip
│   ├── AnimatedCounter.tsx  # Reduced-motion-safe counter
│   └── ExpandablePanel.tsx  # Collapsible evidence panel
├── engine/              # Pure algorithm engines (no UI)
├── styles/
│   └── tokens.css       # 99 CSS custom properties
├── __tests__/
│   ├── engine/          # Algorithm correctness (pure logic)
│   └── ui/              # Component + interaction tests
└── types/               # Shared TypeScript types
```

---
## Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server at localhost:5173 |
| `npm test` | Run all 292 tests |
| `npm run build` | Production build (`tsc -b && vite build`) |
| `npm run lint` | ESLint with zero warnings policy |
| `npm run typecheck` | Full TypeScript check (`tsc -b`) |
| `node scripts/check-contrast.cjs` | WCAG AA contrast audit |

---

*TRACEFORGE — Evidence-first learning for AI, DAA, TOC and COA.*
*Built with React + TypeScript + Vite. No frameworks. No shortcuts. Just proof.*

---
