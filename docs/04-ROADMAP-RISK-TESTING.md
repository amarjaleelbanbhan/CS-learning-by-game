# Project ARC Reactor — Roadmap, Milestones, Risk, Performance & Testing

## 1. Development Roadmap (12 phases, each production-ready before advancing)

| Phase | Name                            | Exit criteria (Definition of Done)                                                                                                 |
| ----- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1     | **Requirements & specs**        | This docs set approved; lesson + automata schemas drafted.                                                                         |
| 2     | **System architecture**         | Monorepo scaffolded (pnpm+Turbo), package boundaries + CI lint/test green, `plugin-sdk` contract frozen.                           |
| 3     | **Foundations**                 | `engine-automata` (DFA/NFA + acceptance + ε-closure) with property tests; Supabase schema + RLS + auth working.                    |
| 4     | **Design system**               | `packages/ui` tokens + primitives + motion presets; Storybook; a11y baseline.                                                      |
| 5     | **Viz + Animation engine**      | `<AutomatonGraph>` + simulation trace + `<TimelineScrubber>`; deterministic replay; 60fps verified.                                |
| 6     | **Lesson + Game engines**       | LessonRunner stage machine renders a declarative mission end-to-end; XP/level/streak/skill-tree unlock working + persisted.        |
| 7     | **AI Tutor**                    | Server-proxied tutor with Socratic hint ladder + grounding validation + caching + rate limits.                                     |
| 8     | **Assessment + Practice**       | Problem model, automata-equivalence auto-grading, generators, hint ladder, adaptive difficulty.                                    |
| 9     | **TOA modules (the 38 topics)** | All labs (DFA, NFA, **NFA→DFA**, Product, Regex, Grammar, ParseTree, PDA, PumpingLemma, Ops) + authored lessons for all 38 topics. |
| 10    | **Testing & a11y hardening**    | ≥80% engine coverage; Playwright critical flows; WCAG 2.1 AA audit pass.                                                           |
| 11    | **Optimization**                | Perf budgets met (LCP/TTI/fps/step-latency); bundle code-split per lab.                                                            |
| 12    | **Deployment**                  | Vercel + Supabase prod, GitHub Actions CI/CD, monitoring, error tracking, launch.                                                  |

### Phasing of the 38 topics within Phase 9 (build order by dependency)

1. **Foundations:** Languages, Strings, Substrings, Reverse of Strings, Regular Languages, Kleene Closure, Operations on Regular Languages.
2. **Machines:** Simple/Complex Automata, Transition Graph, Formal & Inductive Definition, DFA, Transition Function.
3. **Nondeterminism:** NFA, Formal Def of NFA, NFA & Regular Languages, **NFA→DFA**, NFA→equivalent NFA, Product of DFA, Concatenation.
4. **Expressions & grammars:** Regular Expressions, Grammars, Linear/Regular/Right-Linear/Left-Linear, CFG, CFL.
5. **Stacks & trees:** PDA, Derivation Order, Parse Trees, Partial Derivation Trees.
6. **Limits of regularity:** Non-Regular Languages, Pigeonhole Principle, Pigeonhole+DFA, Pumping Lemma, Applications of Pumping Lemma.

## 2. Milestones (demo-able)

- **M1 — "It computes" (end Phase 3):** type a string, watch a hard-coded DFA accept/reject. Proof the core math is right.
- **M2 — "It's beautiful" (end Phase 5):** animated, scrubable simulation in the Arc Lab HUD at 60fps.
- **M3 — "It teaches" (end Phase 6):** one full mission (DFA ending in `01`) playable end-to-end with XP/unlock.
- **M4 — "It tutors" (end Phase 8):** AI hints + auto-graded practice + adaptive difficulty.
- **M5 — "The flagship" (mid Phase 9):** NFA→DFA subset-construction visualizer shipped.
- **M6 — "V1 launch" (end Phase 12):** all 38 topics live in production.

## 3. Risk Analysis

| #   | Risk                                                           | Likelihood | Impact | Mitigation                                                                                                                            |
| --- | -------------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | **Scope explosion** (38 topics × 15 stages × 10 labs)          | High       | High   | Engine-first; declarative lessons so content scales without code; ruthless MUST/SHOULD/LATER triage; topic build order by dependency. |
| R2  | **Animation perf collapse** on big NFAs                        | Med        | High   | Separate simulation(data) from animation(timing); Canvas/R3F for heavy effects; LOD/particle degradation; perf budgets in CI.         |
| R3  | **AI hallucinates wrong automata/proofs**                      | Med        | High   | Grounding: validate every AI-produced automaton/answer via `engine-automata` before showing; policy enforced in code, not the prompt. |
| R4  | **AI cost overrun**                                            | Med        | Med    | Cache generations by (topic,difficulty,seed); cheap model for bulk hints; rate limits; quotas per user.                               |
| R5  | **Auto-grading false negatives** (correct answer marked wrong) | Med        | High   | Grade by formal _language equivalence_, not graph shape; minimize+compare; property tests against brute force.                        |
| R6  | **Over-design vs. clarity** (HUD distracts)                    | Med        | Med    | Content-brightest rule; usability tests; reduced-motion path; design critiques each phase.                                            |
| R7  | **Engine/plugin boundary erodes** (TOA leaks into core)        | Med        | Med    | Lint rule + dependency-cruiser to forbid disallowed imports; CI fails on violation.                                                   |
| R8  | **Single-developer/throughput**                                | High       | Med    | Strict phase gates; vertical slice (M3) early to de-risk integration.                                                                 |
| R9  | **Accessibility bolted on late**                               | Med        | Med    | A11y in the design-system DoD (Phase 4), not Phase 10 only; textual alt views built with each lab.                                    |
| R10 | **Free-tier limits** (Supabase/Vercel)                         | Low        | Med    | Monitor quotas; append-only events with retention; static-first rendering.                                                            |

## 4. Performance Strategy

- **Budgets enforced in CI:** LCP < 2.5s, TTI < 3.5s, route JS < 200KB gzip initial, lab chunks lazy. fps ≥ 60; step latency < 16ms (NFR-PERF).
- **Rendering:** memoized React Flow nodes; virtualize large transition tables; offload layout/heavy graph algorithms to a **Web Worker**; `requestAnimationFrame`-driven timelines; GPU-friendly transforms (`transform`/`opacity` only).
- **Data:** TanStack Query caching; optimistic + idempotent progress writes; Supabase indexes (§ DB design).
- **Assets:** next/font, SVG sprites, code-split per lab/plugin, dynamic import of D3/R3F.
- **Adaptive quality:** detect dropped frames → reduce particle count / disable blur (graceful degradation).

## 5. Testing Strategy (test pyramid)

- **Unit (Vitest) — the foundation.** Engines tested in isolation; ≥80% coverage on `engine-automata`, `engine-simulation`, `engine-assessment`, `engine-game`, `engine-progress`.
- **Property-based (fast-check):** automata algorithms checked against brute-force oracles — e.g., subset-construction DFA accepts exactly the same strings as the source NFA over all strings up to length k; minimize preserves language; product = intersection.
- **Contract tests:** every plugin's lesson `content` validated against `engine-lesson` schema in CI; `plugin-sdk` contract tests.
- **Component (Vitest + Testing Library / Storybook interaction):** UI primitives + viz components render engine models correctly; a11y assertions (axe).
- **Integration:** LessonRunner stage machine transitions; AI route grounding (mock LLM, assert invalid automata are rejected); progress persistence round-trip.
- **E2E (Playwright):** critical journeys — sign up → first mission → simulate string → earn XP → unlock next lab; practice attempt + hint ladder; NFA→DFA flagship walkthrough. Visual-regression snapshots on key lab frames.
- **Non-functional:** Lighthouse CI (perf/a11y budgets); load test AI/generate endpoints; reduced-motion + keyboard-only audit.
- **CI gates (GitHub Actions):** typecheck → lint (incl. dependency-boundary rule) → unit/property → component → build → e2e smoke → Lighthouse. Merge blocked on red.

## 6. Definition of Ready / Done

- **Ready:** requirement has an ID, acceptance criteria, owning engine, and test plan.
- **Done:** code + tests (meeting coverage) + docs + a11y check + perf within budget + reviewed + CI green.

---

## Next Step

This is the **design package** (deliverables 1–14). On approval, begin **Phase 2 (scaffold the monorepo)** — no application coding starts before then, per the mandate. Recommend a thin **vertical slice toward Milestone M3** early to de-risk engine↔UI integration.
