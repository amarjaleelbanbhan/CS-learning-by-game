# Curriculum Ingestion Report — Project ARC Reactor

**Phase:** Knowledge Ingestion & Game Mission Generation (PROMPT 04.5)
**Source:** `docs/Knowladge/` (18 files)
**Output:** `packages/plugin-automata/src/curriculum/` (concepts, missions, question types, common mistakes)

This phase deliberately added **no new UI, no new gameplay systems, no new worlds** — only
structured, reusable content data, per directive. The Engineer Progression System
(PROMPT 05) remains paused until this report is reviewed.

---

## 1. Source material identity

The source course is **CS301-equivalent Theory of Automata at Sukkur IBA University**
(confirmed directly from extracted exam material): instructors Dr. Safdar, MS Faryal
Shamsi, and Dr. Hussain Mughal; batch BSCS-VI/IV; a Final Examination dated Spring 2026
with `Assignment_1` due **28 June 2026**. The lecture decks themselves are credited
"Courtesy Costas Busch — RPI," a widely-used open automata-theory course (the same
source used by many TOA courses worldwide) — so this game's first subject is grounded in
real, currently-active coursework, not invented content.

## 2. What was read (18/18 files attempted)

| File                                 | Format        | Result                                                                                                             |
| ------------------------------------ | ------------- | ------------------------------------------------------------------------------------------------------------------ |
| `4 - Languages.pdf`                  | PDF           | Full text extracted (28 slides)                                                                                    |
| `6 - DFA and RL (1).pdf`             | PDF           | Full text extracted (23 slides)                                                                                    |
| `7 - NFA.pdf`                        | PDF           | Full text extracted (80 slides)                                                                                    |
| `8 - NFA and RL (1).pdf`             | PDF           | Full text extracted (43 slides)                                                                                    |
| `10 - RE & RL.pdf`                   | PDF           | Full text extracted (38 slides)                                                                                    |
| `11 - Grammars.pdf`                  | PDF           | Full text extracted (71 slides)                                                                                    |
| `16 - CFG.pdf`                       | PDF           | Full text extracted (36 slides)                                                                                    |
| `Assignment_1 _TOA-CFG.doc`          | legacy `.doc` | **Full text extracted** via `antiword` (18 real graded questions)                                                  |
| `3 - Mathematical Preliminaries.ppt` | legacy `.ppt` | **Partial** — custom UTF-16LE string extractor recovered set-theory/induction fragments; shape-name noise filtered |
| `5 - DFA (2).ppt`                    | legacy `.ppt` | **Minimal new content** — almost entirely diagram shapes, topic already covered in full by the DFA PDF             |
| `9 - Properties RL [Autosaved].ppt`  | legacy `.ppt` | **Unrecoverable** — diagram/animation-only, no extractable text runs at all                                        |
| `WhatsApp Image ...7.39.14 PM.jpeg`  | image         | Read directly — Moodle screenshot, language-cardinality + palindrome exercises                                     |
| `WhatsApp Image ...7.39.15 PM.jpeg`  | image         | Read directly — Moodle "Construct Regular Expression" assignment, 17 regex exercises                               |
| `WhatsApp Image ...7.39.19 PM.jpeg`  | image         | Read directly — real quiz: DFA⊆NFA Venn question, RE+DFA construction battery, Moore→Mealy/NFA→DFA                 |
| `WhatsApp Image ...7.39.26 PM.jpeg`  | image         | Read directly — real quiz: FA/TG/NFA/Moore/Mealy property-classification table (graded, 5/5)                       |
| `b.jpeg`                             | image         | Read directly — DFA→RE conversion diagrams, automaton-operation identification exercise                            |
| `to.jpeg`                            | image         | Read directly — Final Exam cover page: pumping-lemma proofs, CFG simplification/CNF/ambiguity, PDA construction    |
| `Sipser 3rd.pdf`                     | PDF (13.4MB)  | Deliberately **not bulk-extracted** (copyright; treated as background reference only, per standing instruction)    |

No legacy-binary-format text extractor (`catppt`/LibreOffice/python-pptx-for-binary-ppt)
was available in this environment; `antiword` (present) fully solved the `.doc` case, and a
custom UTF-16LE scanner was written on the spot for the `.ppt` cases — see
`packages/plugin-automata/test/curriculum.test.ts` for how every gap below is enforced as
an honesty check rather than silently dropped.

## 3. Knowledge graph

**19 concepts**, in `packages/plugin-automata/src/curriculum/concepts.ts`, modeled as a
generic unlock-graph (`@arc/engine-game`'s `UnlockNode` shape — the same engine that drives
the Academy world map) so prerequisite cycles/dangling references are caught at test time,
not discovered at runtime. Root: `mathematical-preliminaries`. Leaves:
`chomsky-normal-form`, `pushdown-automata`, `regular-language-properties`.

Two concepts are explicitly **gap-flagged** (`sourceDocs` starts with `gap:`):

- `moore-mealy-machines` — no lecture deck exists anywhere in the source folder; confirmed
  taught only because it appears in the real exam.
- `regular-language-properties` (closure properties / pumping lemma) — the deck exists
  (`9 - Properties RL.ppt`) but is text-unrecoverable; confirmed taught via the assignment.
- `pushdown-automata` — no lecture deck exists at all; confirmed assigned via the
  assignment's PDA-construction questions (Q14, Q15c, Q18c/d/e).

These three gaps are the most actionable finding of this phase (see §7).

## 4. Mission database

**17 missions** in `packages/plugin-automata/src/curriculum/missions.ts`:

- **4 `status: 'live'`** — exact `MISSION_ID` matches to `apps/web/lib/campaign/academy.ts`
  (`toa.dfa-ends-01`, `toa.build.dfa-ends-01`, `toa.nfa-branching`, `toa.nfa-to-dfa`),
  documented here so the database is a complete campaign map, not just a backlog.
- **13 `status: 'designed'`** — fully specified (objective, victory/failure condition,
  Socratic hint ladder, visualization-trigger rule, XP/credits, achievements, estimated
  time, question-type tag, originality note) but **not implemented**. They slot into the
  four districts the Academy world map already reserves as "coming soon"
  (`regex-workshop`, `grammar-tower`, `stack-reactor`, `pumping-dungeon`), plus two
  extensions of already-live districts (`security-district` gets Moore/Mealy;
  `quantum-research-lab` gets a hands-on determinization companion to the existing
  spectacle).

Two missions carry a full **variation ladder** (easy → medium → hard → boss → legend →
daily → infinite) as a proof-of-pattern: `toa.design.regex-construction-01` and
`toa.design.pumping-lemma-01` (the latter is the intended Pumping Dungeon final boss).
Filling out variation ladders for the remaining 11 designed missions is scoped out of this
pass deliberately — it is pure content authoring with no architectural risk, and doing all
13 now would have ballooned this pass without proportional value.

**Originality discipline:** every mission's grammar/regex/automaton was written from
scratch for this game. Where a mission's _shape_ (not its content) mirrors a real
assignment/exam pattern, that is recorded verbatim in the mission's `originality` field —
e.g. the ambiguity-proof boss is "inspired by the structural pattern of Assignment_1
Q7–Q9" but uses an entirely different grammar.

## 5. Question-type taxonomy

**18 closed question types** in `question-types.ts`, each tagged `autoGradable: true/false`.
Notably, proof-style types (`regularity-proof`, `ambiguity-proof`,
`grammar-language-description`, `pda-construction`) are marked **not** auto-gradable —
this is an honest signal for future grading-engine work, not a gap to silently paper over
with a fake equivalence check.

## 6. Common-mistake catalogue (ARIA hint fodder)

**18 entries** across 12 concepts in `common-mistakes.ts`. Every `socraticHint` is enforced
by test to end in `?` — a structural guard against ARIA ever leaking the answer. Two
entries are directly corroborated by the source material: the real exam literally prints
"(Hint: Recall the formal definition)" next to a DFA⊆NFA-direction question, which is
strong evidence that getting the subset direction backwards is a genuine, common mistake
worth coding into the hint system now.

## 7. Coverage map & gaps

| District (existing in `academy.ts`) | Concepts covered                                                | Live missions | Designed missions |
| ----------------------------------- | --------------------------------------------------------------- | ------------- | ----------------- |
| Security District                   | DFA fundamentals & design, Moore/Mealy                          | 2             | 1                 |
| Quantum Research Lab                | NFA fundamentals, ε-transitions                                 | 1             | 1                 |
| Research Archive                    | Subset construction (spectacle)                                 | 1             | 0                 |
| Regex Workshop                      | Regular expressions, state elimination                          | 0             | 2                 |
| Grammar Tower                       | Grammars, regular grammars, CFG, ambiguity, simplification, CNF | 0             | 7                 |
| Stack Reactor                       | Pushdown automata **(gap)**                                     | 0             | 1                 |
| Pumping Dungeon                     | Closure properties, pumping lemma **(gap)**                     | 0             | 1                 |

**Confirmed missing source material** (cannot be closed by re-reading existing files —
needs new source docs from the user):

1. A real lecture deck for **Moore/Mealy machines**.
2. A readable version of **"Properties of Regular Languages"** (pumping lemma, closure) —
   the `.ppt` exists but is diagram-only; either a PDF equivalent or permission to source
   the standard Busch-RPI pumping-lemma slides separately would close this.
3. **Any** pushdown-automata lecture material — the assignment assumes PDA construction
   is taught, but no PDA deck exists in `docs/Knowladge/` at all.

## 8. Boss / side-quest ideas surfaced by this pass

- **Grammar Tower bosses:** the ambiguity-proof mission (`toa.design.cfg-ambiguity-01`) and
  the CNF-conversion mission (`toa.design.cfg-cnf-01`) are designed as the two
  district-capstone bosses — both require "show your work" submissions (two trees; a fully
  restructured grammar), not a single click-to-check answer.
- **Pumping Dungeon legend:** `toa.design.pumping-lemma-01` is designed as a "no
  visualization until after submission" mission — a deliberate, rare exception that makes
  the dungeon's signature feel be earning the proof unaided, with the worked example as a
  post-hoc reward rather than a hint.
- **Side-quest seed:** the real exam's classification table (FA/TG/NFA/Moore/Mealy ×
  start-states/final-states/edge-labels/determinism) is a strong "side-quest" format —
  fast, auto-gradable, and reusable as a recurring **daily** mission template across the
  whole automata subject rather than a one-off.

## 9. What happens next

Per the explicit phase boundary, **nothing here was wired into the live app**. The next
steps, in order, are:

1. User review of this report and the three confirmed content gaps (§7).
2. Resume PROMPT 05 (Engineer Progression System) — paused, not abandoned.
3. When ready to resume building labs: implement the 13 `designed` missions against
   `packages/plugin-automata/src/curriculum/missions.ts` as the single source of truth,
   district by district, starting with Regex Workshop (lowest difficulty, no content gaps).
