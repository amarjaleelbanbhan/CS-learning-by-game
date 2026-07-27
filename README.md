# Project ARC Reactor

> The Future of Computer Science Education. — V1 subject: **Theory of Automata**.

A game-first learning platform where you _solve_ automata problems rather than watch them
explained. This repository is a **reusable CS Learning Engine**; Theory of Automata is the
first subject _plugin_.

The design principle throughout is 90% problem-solving / 10% visualization: you are given a
problem and a blank canvas, and the visualization is the reward for solving it — never the
lesson itself.

## Status

Playable, with **7 of 38 planned topics live**. Sign-in, cloud progress sync, the career
system, the living world, and the deterministic ARIA mentor all work end to end.

See **[docs/ROADMAP.md](docs/ROADMAP.md)** for audited per-phase completion status and
known technical debt — that file is the single source of truth for what is really done.

## Quick start

Requires **Node ≥ 20** and **pnpm 11**.

```bash
pnpm install
pnpm --filter @arc/web dev     # http://localhost:3000
```

The app runs fully offline in **guest mode** with no configuration — progress is kept in
localStorage. Supabase is optional and only adds cross-device sync.

## Optional: cloud sync

Copy `apps/web/.env.local.example` to `apps/web/.env.local` and fill in your Supabase
project URL and publishable (anon) key, then apply the migrations in
`supabase/migrations/` in filename order.

For magic-link sign-in to work, add `{your-origin}/auth/callback` to the project's
**Redirect URLs** in the Supabase dashboard (Authentication → URL Configuration).
Without it, Supabase refuses the redirect after the emailed link is clicked.

Auth is passwordless — the app never handles, stores, or transmits a password.

## Layout

```
apps/web/                    # Next.js 15 app — HUD shell, missions, Engineer Console
packages/
  shared/                    # Result, branded ids, seeded RNG, guards
  plugin-sdk/                # frozen SubjectPlugin contract + registry
  engine-core/               # Trace + event bus primitives
  engine-automata/           # DFA/NFA models, acceptance, subset construction,
                             #   minimization, equivalence, regex/Thompson
  engine-simulation/         # step traces for DFA/NFA runs
  engine-animation/          # timeline / playback timing
  engine-assessment/         # equivalence grading, hint ladder, mistake analysis
  engine-game/               # generic unlock graph
  engine-progress/           # ranks, reputation, certifications, blueprints
  engine-analytics/          # player statistics aggregation
  engine-ai/                 # ARIA: deterministic mentor, optional LLM enhancement
  engine-world/              # NPCs, dialogue, world events, department personality
  design-system/             # Tailwind preset + design tokens
  plugin-automata/           # V1 subject plugin: curriculum, career, world content
  engine-lesson/  engine-visualization-model/  viz/    # scaffolded, not yet implemented
docs/                        # vision, requirements, architecture, design system, roadmap
supabase/migrations/         # schema + row-level security policies
```

## Develop

```bash
pnpm build        # turbo: builds packages in dependency order
pnpm typecheck
pnpm test         # vitest across all packages (incl. property tests)
pnpm lint
pnpm boundaries   # dependency-cruiser: enforces engine purity / inward-only deps
pnpm format:check
```

CI runs all of the above on every push and pull request.

Engine packages are **pure TypeScript** — no React, Next, Supabase, or DOM — and no engine
may import a subject plugin. That boundary is what keeps the platform reusable for a second
subject, and it is enforced in CI by `pnpm boundaries`, not by convention.

## License

MIT — see [LICENSE](LICENSE).
