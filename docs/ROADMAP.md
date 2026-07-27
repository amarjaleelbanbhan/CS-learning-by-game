# Project ARC Reactor — Execution Roadmap (living document)

**This file tracks ACTUAL completion status.** The design-time plan lives in
[`04-ROADMAP-RISK-TESTING.md`](./04-ROADMAP-RISK-TESTING.md) and does not change; this
one is updated as work lands and is the single source of truth for "what is really done".

Last audited: 2026-07-27 · Branch `main` · **CI green on GitHub Actions** (build,
typecheck, lint, boundaries, test, format — 72/72 turbo targets)

> CI had never actually passed before this audit: `pnpm/action-setup` was hard-failing on
> a duplicate version declaration, and once that was fixed, pnpm 11 rejected the pinned
> Node 20. Every "green" claim prior to this was local-only.

---

## Status at a glance

| Phase | Name                     | Status         | Notes                                                       |
| ----- | ------------------------ | -------------- | ----------------------------------------------------------- |
| 1     | Requirements & specs     | ✅ Complete    | `docs/00`–`04` written and stable.                          |
| 2     | System architecture      | ✅ Complete    | pnpm+Turbo monorepo, `plugin-sdk` frozen, boundaries in CI. |
| 3     | Foundations              | ✅ Complete    | Engines, schema, RLS, and auth all working.                 |
| 4     | Design system            | 🟡 Partial     | Tokens + primitives shipped. No Storybook, no a11y audit.   |
| 5     | Viz + animation          | ✅ Complete    | GraphView, traces, scrubber, deterministic replay.          |
| 6     | Lesson + game engines    | 🟡 Partial     | Game/progress engines done. **`engine-lesson` is a stub.**  |
| 7     | AI Tutor                 | 🟡 Partial     | Deterministic mentor done. **No LLM client, no proxy.**     |
| 8     | Assessment + practice    | ✅ Complete    | Equivalence grading, hint ladder, mistake analysis.         |
| 9     | TOA modules (38 topics)  | 🔴 Early       | **7 of 38 topics live**; 17 more designed, not built.       |
| 10    | Testing & a11y hardening | 🟡 Partial     | Unit/property tests strong. **No E2E, no a11y audit.**      |
| 11    | Optimization             | 🔴 Not started | No perf budgets enforced, no Lighthouse CI.                 |
| 12    | Deployment               | 🔴 Not started | No deploy config, no monitoring, no error tracking.         |

Legend: ✅ complete · 🟡 partial · 🔴 not started

---

## Milestones

- [x] **M1 — "It computes"** — DFA accept/reject with correct core math.
- [x] **M2 — "It's beautiful"** — animated, scrubbable simulation in the Arc Lab HUD.
- [x] **M3 — "It teaches"** — full mission playable end-to-end with XP + unlock.
- [x] **M4 — "It tutors"** — hint ladder + auto-graded practice + adaptive difficulty.
- [x] **M5 — "The flagship"** — NFA→DFA subset construction, player-driven.
- [ ] **M6 — "V1 launch"** — all 38 topics live in production.

---

## Now: the critical path to a real product

The backend is no longer dead code: sign-in works and `profiles` / `mission_progress`
now sync. The remaining gaps, in order, are **content** (31 of 38 topics unbuilt) and
**production readiness** (no deployment, no E2E, no a11y audit).

Four of the six migrations are still unused, by deliberate design rather than oversight:
`career_progress`, `mentor_state` and `world_state` hold state that is either derived
from synced data or intentionally device-local (see "Known technical debt").

### P0 — Identity & persistence (FR-AUTH-1/2/3 are MUST)

- [x] **Session middleware.** `middleware.ts` refreshes the Supabase session via
      `getUser()` (only `getUser()` revalidates and rotates the token).
- [x] **Magic-link sign-in + `/auth/callback`.** FR-AUTH-1 satisfied without storing a
      single password. Callback constrains redirects to same-origin relative paths.
      (Google OAuth deferred: needs dashboard config outside the repo.)
- [x] **Cloud progress sync + guest migration (FR-AUTH-3).** Monotonic merge
      (max XP/coins, union of completions), so guest migration is free and no
      timestamps/vector clocks are needed. Local stays the source of truth.
- [ ] **Profile surface (FR-AUTH-2).** Display name / avatar on the Engineer Console.
      The `profiles` row exists and syncs, but nothing renders or edits it yet.

### P1 — Security & supply chain

- [x] **Dependency vulnerabilities.** All 20 advisories cleared: next 14→15.5.22,
      vitest 2→3.2.7, vite 5→6.4.3, esbuild 0.21→0.25.12. The Next upgrade also
      fixed a hard local blocker (`next start` crashed under Node 24).
- [x] **RLS migration lint.** Every table must have RLS enabled and an auth.uid()-scoped
      policy; blanket `using (true)` is rejected on user-owned tables. Runs offline in CI
      and is mutation-tested (removing a policy fails it).

### P2 — Content (the actual product value)

- [ ] **31 of 38 topics still unbuilt.** 17 are fully designed in the curriculum
      database (`status: 'designed'`) and need only UI; 14 are not yet specified.
      This is the bulk of remaining work and the gate on M6.

### P3 — Production readiness

- [x] **CI actually runs.** Was failing at the setup step on every push; now green
      across build, typecheck, lint, boundaries, test and format.
- [ ] **E2E tests (Playwright).** No coverage of the critical journeys.
- [ ] **a11y audit.** WCAG 2.1 AA is a stated requirement; never audited.
- [ ] **Deployment.** No Vercel config, no monitoring, no error tracking.
- [ ] **Perf budgets in CI.** LCP/TTI/bundle budgets specified, never enforced.

---

## Live content (7 of 38 topics)

| Mission ID                         | Title                      | District             |
| ---------------------------------- | -------------------------- | -------------------- |
| `toa.dfa-ends-01`                  | Calibration                | Security District    |
| `toa.build.dfa-ends-01`            | Perimeter Security         | Security District    |
| `toa.nfa-branching`                | Many Paths at Once         | Quantum Research Lab |
| `toa.design.nfa-determinize-01`    | Collapse the Superposition | Quantum Research Lab |
| `toa.nfa-to-dfa`                   | NFA → DFA (spectacle)      | Research Archive     |
| `toa.design.regex-construction-01` | Pattern Forge              | Regex Workshop       |
| `toa.design.dfa-minimization-01`   | (minimization)             | Security District    |

---

## Known technical debt

- **`engine-lesson` is still a Phase-2 stub.** Missions are hand-built React components
  rather than declarative data. `docs/02-ARCHITECTURE.md` treats lesson content as
  `jsonb` data validated in CI; that architecture is not yet realised. Every new mission
  therefore costs a bespoke component. This is the main reason Phase 9 is slow.
- **`engine-visualization-model` and `viz` are stubs.** Layout/geometry lives in
  `apps/web` instead, so it cannot be reused by another subject plugin.
- **No LLM client is injected into `engine-ai`.** The mentor is fully deterministic and
  works offline by design, but the optional language-enhancement path (and its
  server-side proxy, rate limits, and caching — Phase 7 DoD) does not exist.
- **`mentorStore` / `worldStore` are localStorage-only.** Their Supabase tables exist.
