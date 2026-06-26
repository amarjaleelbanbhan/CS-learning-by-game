# Project ARC Reactor — Software Architecture

## 1. Architectural Style

**Clean / Hexagonal Architecture** organized as a **monorepo of engine packages + a Next.js app + subject plugins**.

Dependency rule (inward only):

```
            ┌───────────────────────────────────────────────┐
            │              apps/web (Next.js)               │   ← UI, routing, Supabase wiring, AI proxy
            └───────────────────────────────────────────────┘
                              │ depends on
            ┌───────────────────────────────────────────────┐
            │   subject plugins  (plugin-automata, …)        │   ← lesson data, lab configs, problem generators
            └───────────────────────────────────────────────┘
                              │ depends on
   ┌────────────────────────────────────────────────────────────────┐
   │  ENGINES (framework-agnostic, pure TS)                          │
   │  core · automata · animation · simulation · lesson · game ·     │
   │  progress · assessment · ai · analytics · visualization-model   │
   └────────────────────────────────────────────────────────────────┘
                              │ depends on
            ┌───────────────────────────────────────────────┐
            │  packages/shared  (types, utils, result, ids)  │
            └───────────────────────────────────────────────┘
```

**Key invariant:** engine packages contain **zero React, zero Next, zero Supabase, zero DOM**. They are pure TypeScript, fully unit-testable in isolation, and could run in Node, a web worker, or another framework. UI packages render engine _models_; they never embed algorithms.

## 2. The Engines

Each engine is a package with a narrow public API (a port). The app and plugins program against these ports.

| Engine                  | Responsibility                                                                                                                                                                                                                             | Notably excludes                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- |
| **core**                | Cross-cutting domain primitives: `Result<T,E>`, ids, event bus, command/step abstractions, RNG (seeded).                                                                                                                                   | UI, persistence                 |
| **automata**            | The math: DFA/NFA/ε-NFA/PDA/CFG/Regex data models + algorithms (acceptance, ε-closure, subset construction, minimization, product, equivalence, Thompson construction, regex↔NFA, grammar derivations, parse trees, pumping-lemma checks). | rendering, animation timing     |
| **simulation**          | Turns an automaton + input into an ordered, deterministic **trace** of computation steps (frames). Pure data; no timing.                                                                                                                   | tweening, pixels                |
| **animation**           | Timeline / tween model: takes a trace or scene description → time-indexed keyframes. Adapters drive Framer Motion / GSAP.                                                                                                                  | knowledge of automata semantics |
| **visualization-model** | Layout: graph auto-layout (force/hierarchical), node/edge geometry, camera model. Produces render-ready coordinates consumed by React Flow / SVG / Canvas.                                                                                 | actual DOM                      |
| **lesson**              | Lesson schema, stage state machine (XState), validation of declarative lesson content, stage gating.                                                                                                                                       | specific subject content        |
| **assessment**          | Problem model, answer-checking (incl. automata equivalence grading), scoring, hint ladder model.                                                                                                                                           | AI calls                        |
| **game**                | XP/level curve, coins, achievements rules, streak logic, skill-tree unlock graph.                                                                                                                                                          | persistence                     |
| **progress**            | Mastery model, completion %, spaced-repetition scheduling. Pure functions over progress state.                                                                                                                                             | DB                              |
| **ai**                  | Provider-agnostic tutor abstraction: prompt builders, Socratic hint policy, grounding/validation hooks. Talks to an injected `LLMClient` port.                                                                                             | the actual HTTP/key (injected)  |
| **analytics**           | Aggregation of events into learning metrics.                                                                                                                                                                                               | tracking transport              |

### Why split simulation / animation / visualization-model

The same computation trace must be: (a) checked for correctness, (b) shown as an SVG graph animation, (c) shown as a timeline scrubber, and (d) described textually for screen readers. Separating _what happened_ (simulation), _where things are_ (visualization-model), and _when/how it moves_ (animation) keeps each independently testable and reusable.

## 3. Plugin System

A **subject plugin** is a package that registers itself with the app via a manifest. It contributes **data and configuration**, not engine code.

```ts
// packages/plugin-sdk
export interface SubjectPlugin {
  id: string; // "automata"
  title: string;
  modules: ModuleManifest[]; // ordered curriculum
  labs: LabRegistration[]; // lab id → lazy React component + engine config
  problemGenerators: GeneratorRegistration[];
  skillTree: SkillTreeSpec;
  theme?: Partial<ThemeTokens>;
}
```

The app discovers plugins through a registry. Adding "Data Structures" later means shipping `plugin-data-structures` implementing `SubjectPlugin` — **no change to engines or the app shell**. This directly satisfies the "reusable CS Learning Engine" mandate.

## 4. State Management Strategy

| Concern                                                            | Tool                          | Rationale                                                                                                                                 |
| ------------------------------------------------------------------ | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Lesson stage flow, simulation playback, lab editing modes          | **XState**                    | These are genuine state machines (idle→playing→paused→done, building→testing); statecharts prevent impossible states and are inspectable. |
| Cross-component app state (user, current mission, game HUD, theme) | **Zustand**                   | Lightweight, no boilerplate, selector-based re-renders.                                                                                   |
| Server data (progress, profile, leaderboard)                       | **TanStack Query + Supabase** | Caching, optimistic updates, retry/idempotency for progress writes.                                                                       |
| Ephemeral component UI                                             | React local state             | Don't globalize what doesn't need it.                                                                                                     |

Rule: **engines hold no React state**. XState machines wrap engine calls; engines stay pure.

## 5. AI Tutor Architecture

```
Client (chat UI) ──► /api/ai/tutor (Next.js Route Handler, server-only)
                         │  builds prompt via ai-engine prompt builders
                         │  injects lesson context + student state
                         ▼
                    LLMClient port ──► Claude API (key server-side only)
                         │
                         ▼  (grounding)
              ai-engine validates any generated automaton/answer
              against the automata-engine BEFORE returning to client
```

- **Server proxy only.** No provider keys client-side (NFR-SEC-2).
- **Socratic policy** lives in `ai-engine` as a deterministic hint ladder; the LLM fills content but the _policy_ (don't reveal answer yet) is enforced in code.
- **Grounding:** when the tutor proposes "here's a DFA for L", the automata-engine verifies it accepts/rejects correctly before display. Hallucinated automata are caught, not shown.
- **Caching:** identical (topic, difficulty, seed) generations are cached in Supabase to control cost (NFR-COST-1).
- **Streaming** responses for perceived latency.

## 6. Default Model

Use the latest, most capable Claude model for the tutor: **`claude-opus-4-8`** for diagnosis/explanation; a faster model (e.g. `claude-haiku-4-5-20251001`) for cheap autocompletion-style hints and bulk problem generation. Model id is config, injected through the `LLMClient` port so it is swappable.

## 7. Rendering Strategy (per object count)

| Scenario                                                             | Renderer                                                   |
| -------------------------------------------------------------------- | ---------------------------------------------------------- |
| Interactive automata graphs (drag/edit), ≤ ~150 nodes                | **React Flow** (SVG) + custom node/edge components         |
| Heavy particle/energy/arc-reactor effects, large parallel-branch NFA | **Canvas / React Three Fiber** layer behind/over the graph |
| Math                                                                 | **KaTeX**                                                  |
| Charts (analytics)                                                   | **D3** (lightweight, tree-shaken)                          |

A `<VizSurface>` abstraction picks the renderer based on a complexity heuristic, so labs don't hard-code it.

## 8. Folder Structure (Monorepo — pnpm + Turborepo)

```
arc-reactor/
├─ apps/
│  └─ web/                          # Next.js (App Router)
│     ├─ app/
│     │  ├─ (marketing)/            # landing, about
│     │  ├─ (auth)/                 # sign-in, sign-up, callback
│     │  ├─ (app)/                  # authed shell
│     │  │  ├─ dashboard/
│     │  │  ├─ map/                 # skill tree / lab map
│     │  │  ├─ learn/[subject]/[module]/[mission]/   # lesson runner
│     │  │  ├─ lab/[labId]/         # standalone lab launcher
│     │  │  ├─ practice/[topic]/
│     │  │  └─ profile/
│     │  └─ api/
│     │     ├─ ai/tutor/route.ts
│     │     ├─ ai/generate/route.ts
│     │     └─ progress/route.ts
│     ├─ components/                # app-specific composition (not the design-system library)
│     ├─ lib/                       # supabase client, query client, plugin registry wiring
│     └─ styles/
├─ packages/
│  ├─ shared/                       # types, Result, ids, guards, seeded RNG
│  ├─ engine-core/
│  ├─ engine-automata/
│  ├─ engine-simulation/
│  ├─ engine-animation/
│  ├─ engine-visualization-model/
│  ├─ engine-lesson/
│  ├─ engine-assessment/
│  ├─ engine-game/
│  ├─ engine-progress/
│  ├─ engine-ai/
│  ├─ engine-analytics/
│  ├─ ui/                           # design system: tokens, primitives, HUD components, motion presets
│  ├─ viz/                          # React renderers: VizSurface, AutomatonGraph, StackView, ParseTreeView, TimelineScrubber
│  ├─ plugin-sdk/                   # SubjectPlugin contract + registry
│  └─ plugin-automata/              # V1 subject: lessons, lab configs, generators, skill tree
├─ supabase/
│  ├─ migrations/                   # SQL schema + RLS policies
│  └─ seed/
├─ tests/
│  └─ e2e/                          # Playwright
├─ .github/workflows/               # CI/CD
├─ turbo.json
├─ pnpm-workspace.yaml
└─ tsconfig.base.json
```

### Inside an engine package (consistent shape)

```
engine-automata/
├─ src/
│  ├─ models/        # DFA.ts, NFA.ts, PDA.ts, CFG.ts, Regex.ts (data + invariants)
│  ├─ algorithms/    # subsetConstruction.ts, minimize.ts, product.ts, equivalence.ts, thompson.ts ...
│  ├─ index.ts       # public port (curated exports)
│  └─ internal/      # not exported
├─ test/             # unit + property-based (fast-check)
└─ package.json
```

## 9. Database Design (PostgreSQL via Supabase)

All user-data tables carry `user_id uuid references auth.users` and an RLS policy `user_id = auth.uid()`.

```sql
-- Identity / profile
profiles            (id uuid PK = auth.uid, display_name, avatar_url, level int, xp int,
                     coins int, current_streak int, longest_streak int, last_active date,
                     prefs jsonb, created_at, updated_at)

-- Curriculum (content; readable by all, writable by service role)
subjects            (id text PK, title, "order" int, meta jsonb)
modules             (id text PK, subject_id fk, title, "order" int, meta jsonb)
missions            (id text PK, module_id fk, title, "order" int,
                     content jsonb,            -- declarative lesson (all stages)
                     xp_reward int, unlock_requires text[])   -- mission ids

-- Progress (per user)
mission_progress    (user_id fk, mission_id fk, status enum(locked,available,in_progress,completed),
                     stage_state jsonb,        -- which stages done
                     score numeric, attempts int, started_at, completed_at,
                     PRIMARY KEY(user_id, mission_id))
topic_mastery       (user_id fk, topic_id text, mastery numeric,    -- 0..1, decays
                     last_reviewed_at, due_at, PRIMARY KEY(user_id, topic_id))

-- Gamification
achievements        (id text PK, title, description, icon, rule jsonb)   -- content
user_achievements   (user_id fk, achievement_id fk, unlocked_at, PRIMARY KEY(user_id, achievement_id))
inventory_items     (id text PK, kind enum(theme,badge,cosmetic), title, cost int, meta jsonb)
user_inventory      (user_id fk, item_id fk, acquired_at, equipped bool, PRIMARY KEY(user_id, item_id))

-- Practice / assessment
problem_attempts    (id uuid PK, user_id fk, topic_id text, problem jsonb, answer jsonb,
                     correct bool, hints_used int, time_ms int, created_at)
generated_problems  (id uuid PK, topic_id text, difficulty int, seed text,
                     payload jsonb, created_at)        -- cache for AI generations

-- AI
ai_conversations    (id uuid PK, user_id fk, context jsonb, created_at)
ai_messages         (id uuid PK, conversation_id fk, role, content, tokens int, created_at)

-- Analytics (append-only event log)
events              (id bigint PK, user_id fk, type text, payload jsonb, ts timestamptz)
```

Notes:

- **Lesson content is data (`missions.content jsonb`)** — satisfies FR-LESSON-2. Authoring tooling validates it against the `engine-lesson` schema in CI.
- `events` is the analytics source of truth; dashboards aggregate from it (and/or materialized views).
- Indexes: `mission_progress(user_id)`, `topic_mastery(user_id, due_at)`, `events(user_id, ts)`, `generated_problems(topic_id, difficulty, seed)`.

## 10. Component Hierarchy (high level)

```
<AppShell>                         # HUD frame: nav, arc-reactor XP ring, streak, coins, AI dock
├─ <SubjectMap>                    # skill-tree of labs/missions (unlock graph)
├─ <LessonRunner>                  # drives the stage state machine (XState)
│  ├─ <StageMissionBrief/> <StageStory/> <StageIntuition/>
│  ├─ <StageVisualization/> ──┐
│  ├─ <StageSimulation/>      │ all mount widgets from packages/viz
│  ├─ <StageSandbox/>         │
│  ├─ <StageGuidedPractice/> <StageChallenge/> <StageBossBattle/>
│  ├─ <StageSummary/> <StageMemoryTricks/> <StageCommonMistakes/> <StageRevision/>
│  └─ <StageUnlockReward/>    ┘  (celebration + game-engine award)
├─ Lab widgets (packages/viz):
│  ├─ <VizSurface>                 # chooses SVG/Canvas/3D renderer
│  ├─ <AutomatonGraph>             # React Flow nodes/edges, drag-edit, glow
│  ├─ <SimulationControls>         # play/pause/step/speed + <TimelineScrubber>
│  ├─ <SubsetConstructionView>     # flagship NFA→DFA
│  ├─ <ProductDfaView> <RegexStudio> <GrammarStudio> <ParseTreeView>
│  ├─ <PdaStackView> <PumpingLemmaLab>
│  └─ <TransitionTable>            # accessible textual alternative
├─ <PracticePlayer>                # renders a problem + answer widget + hint ladder
├─ <AiTutorDock>                   # streaming chat, context-aware, hint policy
└─ <AnalyticsDashboard>            # D3 charts of mastery/time/mistakes
```

Design-system primitives (`packages/ui`): `<Panel>` (glass), `<HoloButton>`, `<ArcRing>`, `<HudCard>`, `<NeonBadge>`, motion presets, `<MathBlock>` (KaTeX), tokens.
