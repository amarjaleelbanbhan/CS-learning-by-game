# Project ARC Reactor

> The Future of Computer Science Education. — V1 subject: **Theory of Automata**.

An AI-powered, visualization-first learning engine. This repository is a
**reusable CS Learning Engine**; Theory of Automata is the first subject _plugin_.

## Status

**Phase 2 — Monorepo scaffold** (complete). Foundations of `engine-automata`
(DFA/NFA + acceptance + subset construction) are in place with property tests.
See [docs/](docs/README.md) for the full design package and roadmap.

## Layout

```
apps/        # (Phase 5+) Next.js web app — the HUD shell + lesson runner
packages/
  shared/                    # Result, branded ids, seeded RNG, guards
  plugin-sdk/                # frozen SubjectPlugin contract + registry
  engine-core/               # Trace + event bus primitives
  engine-automata/           # DFA/NFA models, acceptance, subset construction
  engine-*                   # simulation, animation, viz-model, lesson, assessment,
                             #   game, progress, ai, analytics  (scaffolded)
  ui/  viz/                  # design system + React renderers (scaffolded)
  plugin-automata/           # V1 subject plugin (thin slice)
docs/        # vision, requirements, architecture, design system, roadmap
```

## Develop

```bash
pnpm install
pnpm build        # turbo: builds packages in dependency order
pnpm typecheck
pnpm test         # vitest across all packages (incl. property tests)
pnpm lint
pnpm boundaries   # dependency-cruiser: enforces engine purity / inward-only deps
```

Engine packages are **pure TypeScript** — no React, Next, Supabase, or DOM. This
boundary is enforced in CI by `pnpm boundaries`.
