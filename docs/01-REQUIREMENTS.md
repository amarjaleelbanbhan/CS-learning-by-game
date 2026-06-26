# Project ARC Reactor — Requirements

## A. Functional Requirements

IDs are grouped by domain. `MUST` = V1 scope, `SHOULD` = V1 if time allows, `LATER` = post-V1.

### FR-AUTH — Identity & Profile

- **FR-AUTH-1 (MUST)** User can sign up / sign in via Supabase Auth (email+password, magic link, OAuth Google).
- **FR-AUTH-2 (MUST)** User has a profile: display name, avatar, level, XP, coins, streak, created date.
- **FR-AUTH-3 (MUST)** Anonymous "guest" mode lets a visitor try labs without an account; progress is local until they sign up (then migrated).
- **FR-AUTH-4 (SHOULD)** Account deletion + data export (GDPR-style).

### FR-LESSON — Lesson / Mission Engine

- **FR-LESSON-1 (MUST)** Each topic is a _mission_ defined as structured data, rendered through a fixed **lesson flow**:
  `Mission Brief → Story → Intuition → Visualization → Animation → Interactive Simulation → Sandbox → Guided Practice → Challenge → Boss Battle → Summary → Memory Tricks → Common Mistakes → Revision → Unlock Reward`.
- **FR-LESSON-2 (MUST)** Lesson content is **declarative** (JSON/MDX-like schema), not hard-coded React per lesson, so new lessons need no engine changes.
- **FR-LESSON-3 (MUST)** Stage progress is tracked; a stage can require completion before the next unlocks.
- **FR-LESSON-4 (SHOULD)** Lessons support KaTeX math, callouts, and embedded interactive widgets by reference.

### FR-VIZ — Visualization & Simulation Engine

- **FR-VIZ-1 (MUST)** Render automata (DFA/NFA/PDA/Transition Graphs) as interactive node-edge graphs with drag, zoom, pan.
- **FR-VIZ-2 (MUST)** Simulate a string against an automaton with: per-character stepping, play/pause, speed control, current-state glow, transition highlight, accept/reject result.
- **FR-VIZ-3 (MUST)** NFA simulation shows **parallel branch execution**; dead branches fade, accepting branches glow.
- **FR-VIZ-4 (MUST)** Timeline scrubber + step-mode for every simulation.
- **FR-VIZ-5 (MUST)** Deterministic, replayable simulations (same input → same animation).

### FR-LAB — Specific Labs

- **FR-LAB-DFA (MUST)** Build/edit DFAs; test strings; guided "what to remember → states" scaffolding.
- **FR-LAB-NFA (MUST)** Build NFAs incl. ε-transitions; visualize nondeterminism.
- **FR-LAB-SUBSET (MUST)** **NFA→DFA subset construction** visualizer with ε-closure highlighting, incremental subset build, dedup, step/replay. _(Flagship.)_
- **FR-LAB-PRODUCT (MUST)** Product/intersection of two DFAs: side-by-side, animated Cartesian product, acceptance explanation.
- **FR-LAB-REGEX (MUST)** Regex Studio: live syntax highlight, expression tree, Thompson-construction automaton.
- **FR-LAB-GRAMMAR (MUST)** Grammar Studio: edit productions, highlight variables/terminals, animate derivations.
- **FR-LAB-PARSE (MUST)** Parse Tree Lab: grow trees node-by-node; step through derivations; replay.
- **FR-LAB-PDA (MUST)** PDA Lab: animated stack push/pop, input pointer, state transitions, acceptance.
- **FR-LAB-PUMP (MUST)** Pumping Lemma Lab: pick string, split x·y·z, vary pumping count i, watch the contradiction.
- **FR-LAB-OPS (SHOULD)** Regular-language operations visualizer (union, intersection, concat, star, plus, complement, reverse, difference).

### FR-PRACTICE — Practice & Assessment

- **FR-PRAC-1 (MUST)** AI-generated unlimited practice per topic with adaptive difficulty.
- **FR-PRAC-2 (MUST)** Interactive question types: draw DFA/NFA, fix a broken automaton, complete missing transitions, convert NFA→DFA, transform grammar, solve pumping lemma, classify strings (accept/reject), MCQ.
- **FR-PRAC-3 (MUST)** **Auto-grading** of automata via formal equivalence checking against a reference (not pixel comparison).
- **FR-PRAC-4 (MUST)** Immediate, specific feedback; tiered hints.
- **FR-PRAC-5 (SHOULD)** Boss battles: timed/multi-part challenges that gate lab unlocks.

### FR-AI — AI Tutor ("JARVIS")

- **FR-AI-1 (MUST)** Conversational tutor scoped to the current lesson/lab context.
- **FR-AI-2 (MUST)** Generates examples and practice on demand.
- **FR-AI-3 (MUST)** Diagnoses a student's submitted automaton/answer and explains _why_ it's wrong.
- **FR-AI-4 (MUST)** **Socratic hint policy** — never reveals the full answer immediately; escalates hint specificity on request.
- **FR-AI-5 (MUST)** Adapts difficulty based on recent performance.
- **FR-AI-6 (SHOULD)** Grounded responses: tutor output is validated against the engine (e.g., a generated DFA is checked before being shown).

### FR-GAME — Gamification & Progression

- **FR-GAME-1 (MUST)** XP, levels, coins awarded for mission/stage completion.
- **FR-GAME-2 (MUST)** Achievements & badges; daily streak.
- **FR-GAME-3 (MUST)** Skill tree / lab map; completing topics unlocks the next laboratory.
- **FR-GAME-4 (MUST)** Completion % per module and overall.
- **FR-GAME-5 (SHOULD)** Inventory, unlockable themes, victory animations, sound effects, celebrations.
- **FR-GAME-6 (LATER)** Leaderboards / social.

### FR-PROGRESS — Persistence & Analytics

- **FR-PROG-1 (MUST)** All progress, XP, mastery persisted to Supabase per user; synced across devices.
- **FR-PROG-2 (MUST)** Learning analytics dashboard: time per topic, mastery, mistake patterns, streak.
- **FR-PROG-3 (SHOULD)** Spaced-repetition revision queue driven by mastery decay.

## B. Non-Functional Requirements

### Performance

- **NFR-PERF-1** Sustained **60 fps** during animations on a mid-range 2021 laptop; graceful degradation (reduced particles) below.
- **NFR-PERF-2** Initial route LCP < 2.5s on broadband; lab interactive (TTI) < 3.5s.
- **NFR-PERF-3** Simulation step latency < 16ms for automata up to ~100 states / 300 transitions.
- **NFR-PERF-4** Code-split per lab; no lab's bundle loads until entered.

### Reliability & Correctness

- **NFR-REL-1** All automata algorithms (acceptance, subset construction, equivalence, minimization, product) covered by unit tests with property-based testing against brute-force oracles.
- **NFR-REL-2** Simulations are deterministic and replayable.
- **NFR-REL-3** No data loss: progress writes are idempotent and retried; offline edits reconcile.

### Security & Privacy

- **NFR-SEC-1** Supabase **Row Level Security** on every user-data table; users access only their own rows.
- **NFR-SEC-2** AI calls proxied through server routes; provider API keys never reach the client.
- **NFR-SEC-3** AI prompt-injection guardrails; tutor cannot exfiltrate other users' data or system prompts.
- **NFR-SEC-4** Rate limiting on AI and generation endpoints.

### Accessibility (WCAG 2.1 AA target)

- **NFR-A11Y-1** `prefers-reduced-motion` respected; all animations have a static/stepped fallback.
- **NFR-A11Y-2** Color is never the only signal (accept/reject also use shape/icon/label); contrast ≥ 4.5:1 for text.
- **NFR-A11Y-3** Keyboard operable; sound effects optional and muted by default with a clear toggle.
- **NFR-A11Y-4** Screen-reader descriptions for automata state (textual transition tables as an alternative view).

### Usability & Responsiveness

- **NFR-UX-1** Fully responsive ≥ 360px; labs adapt (touch drag, pinch zoom) on tablets.
- **NFR-UX-2** Every long-running action has loading/empty/error states.

### Maintainability & Scalability

- **NFR-MAINT-1** Clean Architecture; engines depend on abstractions, not on TOA specifics or React.
- **NFR-MAINT-2** Strict TypeScript (`strict: true`, no implicit `any`).
- **NFR-MAINT-3** Plugin boundary: a new subject ships as a package without modifying core engines.
- **NFR-MAINT-4** ≥ 80% unit coverage on engine/algorithm packages; smoke E2E on critical flows.

### Cost

- **NFR-COST-1** All infrastructure on free tiers / OSS (Supabase free, Vercel hobby, OSS libs). AI usage rate-limited and cached to stay within budget.
