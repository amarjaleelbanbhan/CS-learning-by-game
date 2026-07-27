# The TOA Game Design Bible

**Status:** living document. Supersedes nothing — it sits alongside `00-PRODUCT-VISION.md`
(why this exists) and `02-ARCHITECTURE.md` (how the code is organised). This file answers
**what the game is** and **what rules every mission must obey**.

---

## 1. The one rule

> **Do not explain first. Let the player discover first.**

Every mission is built as:

```
Experience → Failure → Curiosity → Explanation → Practice → Mastery
```

Concretely, a mission may not open with a definition. It opens with a _situation_ the
player cannot yet handle. The theory is the reward for having struggled, not the price of
admission.

**Test for this rule:** delete the mission's prose. If the player can still attempt the
task and find out they were wrong, the mission obeys the rule. If deleting the prose makes
the task impossible, the mission is a textbook page with a button.

### Corollaries

| #   | Rule                                                             | Why                                                                                                                                                             |
| --- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Grade the language, never the drawing.**                       | Two DFAs that accept the same strings are the same answer. This is the project's crown jewel; it is non-negotiable.                                             |
| 2   | **A wrong answer must produce a counterexample**, not a verdict. | "Wrong" teaches nothing. "Your machine accepts `010`, the target language does not" teaches the whole concept.                                                  |
| 3   | **Hints are earned, never offered.**                             | Hint tiers unlock on failed attempts. A player who has not tried cannot buy the answer.                                                                         |
| 4   | **No XP for watching.**                                          | If the player cannot fail it, it is not a mission. Passive playback may exist _inside_ a mission as a reward or a reference, never as the completion criterion. |
| 5   | **The player must be able to be wrong in an interesting way.**   | A task with one obvious action is a cutscene. Design the plausible wrong answers first, then the right one.                                                     |
| 6   | **Content is data, never a React component.**                    | Missions are authored as declarative lessons + graded tasks. A new topic must not require a new bespoke component.                                              |

---

## 2. Structure

```
World → District → Mission → Stage → Task → Assessment
```

- **World** — a computational class (finite machines, context-free, unrestricted). Worlds
  are ordered by _computational power_, not by syllabus convenience.
- **District** — a themed location inside a world, holding related missions.
- **Mission** — one playable unit with a narrative frame and a completion criterion.
- **Stage** — a step in the FR-LESSON-1 flow (brief, intuition, challenge, summary, …).
- **Task** — one thing the player _does_. A stage may hold several.
- **Assessment** — how a task is graded. Owned by the assessment engine, never by UI.

`Concept` is a **parallel** axis, not a level in this tree: a prerequisite DAG used for
mastery tracking and unlock reasoning. One mission teaches one primary concept and may
reinforce others.

---

## 3. The Chomsky hierarchy is the map

The world map is not a list of chapters. It is the hierarchy itself, drawn as nested
regions of increasing power. As the player ascends, the map literally grows outward, and
each new world visibly _contains_ the previous one.

| World | Name                          | Class  | Machine     | Core question                                           |
| ----- | ----------------------------- | ------ | ----------- | ------------------------------------------------------- |
| 0     | Computational Universe        | —      | —           | What is a problem?                                      |
| 1     | Symbols & Languages           | —      | —           | What is a language?                                     |
| 2     | Finite Automata               | Type 3 | DFA         | What can memory-less machines decide?                   |
| 3     | Nondeterministic Machines     | Type 3 | NFA / ε-NFA | Does guessing add power? (No — and that is the lesson.) |
| 4     | Regular Languages             | Type 3 | regex ↔ FA  | Three notations, one class.                             |
| 5     | The Limits of Finite Machines | —      | —           | What _cannot_ be done with finite memory?               |
| 6     | Grammar Kingdom               | Type 2 | CFG         | Generating instead of recognising.                      |
| 7     | Parse Tree Forest             | Type 2 | CFG         | Structure, not just membership.                         |
| 8     | Ambiguity Dungeon             | Type 2 | CFG         | When structure is not unique.                           |
| 9     | Pushdown Kingdom              | Type 2 | PDA         | One stack buys you matching.                            |
| 10    | Context-Free World            | Type 2 | CFG ↔ PDA   | The equivalence, and the new limit.                     |
| 11    | Chomsky Tower                 | all    | —           | The hierarchy revealed as one picture.                  |
| 12    | Recursive Functions           | —      | —           | Computation without machines.                           |
| 13    | Turing Machine World          | Type 0 | TM          | Unbounded memory.                                       |
| 14    | Computability                 | Type 0 | TM          | Decidable vs recognisable.                              |
| 15    | The Impossible                | —      | —           | The halting problem.                                    |

**World 5 and World 15 are the emotional spine.** Both are moments where the player tries
to do something and discovers it _cannot be done_. World 5 (pumping lemma) is the
rehearsal; World 15 (halting problem) is the finale — the player is asked to build a
universal predictor, and the game walks them into the contradiction they constructed
themselves.

---

## 4. Task taxonomy

Every task in the game is one of these twelve verbs. This list is closed: a new mission
picks a verb, it does not invent one.

| Verb           | Player does                                          | Graded by                                                | Difficulty band |
| -------------- | ---------------------------------------------------- | -------------------------------------------------------- | --------------- |
| **Observe**    | Runs a machine, watches state change                 | Nothing — always a _stage_, never a completion criterion | —               |
| **Predict**    | Commits to an outcome before revealing it            | Exact/numeric match against simulation                   | 1–2             |
| **Complete**   | Fills the missing piece of a nearly-finished machine | Equivalence after filling                                | 2               |
| **Construct**  | Builds from a blank canvas                           | Language equivalence                                     | 2–4             |
| **Simulate**   | Hand-executes a machine, step by step                | Trace comparison                                         | 2–3             |
| **Debug**      | Finds and fixes a planted flaw                       | Equivalence + did they find _the_ flaw                   | 2–4             |
| **Draw**       | Produces a structure (parse tree, derivation)        | Structural validity + yield                              | 3–4             |
| **Convert**    | Transforms between representations                   | Equivalence across representations                       | 3–5             |
| **Classify**   | Decides which class a language belongs to            | Choice + justification                                   | 3–5             |
| **Prove**      | Assembles a proof (pumping decomposition, reduction) | Step validity + contradiction reached                    | 4–5             |
| **Experiment** | Free sandbox, no goal                                | Ungraded by design                                       | —               |
| **Boss**       | Multi-stage, no hints, time or attempt pressure      | Composite                                                | 5               |

**Predict is the highest-leverage verb in the game** and costs almost nothing to add: ask
for the answer _before_ showing the simulation. It converts any Observe stage into a real
task. Apply it aggressively.

---

## 5. Mechanic library

Reusable, subject-agnostic components. A mission composes these; it does not write new
ones.

**Built (reuse, do not rebuild):** machine simulator · automaton graph view · playback
scrubber · tape view · DFA builder canvas (states, transitions, start/accept, undo/redo) ·
string tester · hint ladder · prediction lock-in · counterexample display.

**To build:** grammar editor · production editor · derivation explorer · parse tree
builder · stack simulator · PDA builder · TM tape editor · TM builder · proof builder ·
pumping decomposition tool · drag-and-drop matcher · ordering puzzle · language classifier
· recursion / call-stack visualiser.

Each mechanic is registered as a **lesson widget** (id → component) so declarative content
can reference it. A mechanic never contains educational content; content is passed in.

---

## 6. Difficulty

| Band | Meaning                                                | Hints            | Failure |
| ---- | ------------------------------------------------------ | ---------------- | ------- |
| 1    | Onboarding. Cannot really fail.                        | Free             | None    |
| 2    | One concept, one step.                                 | After 1 attempt  | Soft    |
| 3    | One concept, multiple steps, or two concepts combined. | After 2 attempts | Real    |
| 4    | Multi-step with a non-obvious insight.                 | After 3 attempts | Real    |
| 5    | Boss. Composite skills, no hints, attempt pressure.    | None             | Real    |

**Curve rule:** no jump greater than +1 band between a mission and its prerequisite. The
current game violates this between Calibration (1) and Perimeter Security (2→ effectively
3, since it goes from watching to blank-canvas construction); Complete- and Debug-verb
missions exist to fill exactly these gaps.

---

## 7. Assessment contract

All grading flows through one pipeline, owned by `engine-assessment`:

```
raw input → normalize → validate → grade → diagnose → feedback
```

- **normalize** — parse the raw UI value into a typed answer. Returns null if
  uninterpretable (a typo, not a wrong answer).
- **validate** — structural problems that are not yet _wrong answers_ ("this DFA has no
  start state"). Reported differently from incorrectness.
- **grade** — produce a `Verdict`: outcome, score, mistakes, counterexample.
- **diagnose** — name the _specific_ misconception, not just the error.
- **feedback** — player-facing language derived from the diagnosis.

A grader is a `Grader<TAnswer, TSpec>`. Adding a topic means adding a grader, not editing
a switch statement. **No mission may grade inline in a React component** — the regex
mission's original inline grading is the anti-pattern this rule exists to prevent.

---

## 8. Progression

XP is not a participation trophy. Reward is proportional to **agency**:

| Verb                               | XP multiplier                     |
| ---------------------------------- | --------------------------------- |
| Observe / Experiment               | 0× (never a completion criterion) |
| Predict                            | 0.6×                              |
| Complete / Simulate                | 0.8×                              |
| Construct / Debug / Draw / Convert | 1.0×                              |
| Classify / Prove                   | 1.2×                              |
| Boss                               | 1.5×                              |

Hint use reduces award. Retries do not — failing and recovering is the intended path and
must never be punished harder than quitting.

---

## 9. Accessibility (non-negotiable, NFR-A11Y-1..4)

- Reduced motion honoured everywhere; animation is never the only channel.
- Colour is never the sole signal — accept/reject also carry an icon and a label.
- Every interactive canvas has a keyboard path and a screen-reader alternative. A machine
  the player can build must be describable as a transition table.
- Audio muted by default.
- Every formula carries a spoken form; every widget carries alt text. Both are enforced by
  content validation in CI, not by review.

---

## 10. Definition of done

A mission is done when the player can **attempt it, fail it, understand why, retry, and
succeed** — and the grader, the feedback, the progress tracking and the tests all exist.
Compiling is not done. Rendering is not done.
