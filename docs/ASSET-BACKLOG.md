# Asset Backlog

The repo ships **zero binary assets** by design so far: every visual is CSS/SVG/React Flow
and every sound is a Web Audio oscillator. That is enough to build and prove gameplay, and
nothing here blocks development. This file records where commissioned assets would raise
the ceiling, so the AAA presentation goal is tracked rather than forgotten.

Priority is by *gameplay impact per unit of art*, not by visual ambition.

| # | Area | Today | What real assets would add | Priority |
| - | ---- | ----- | -------------------------- | -------- |
| 1 | **District identity** | Emoji + CSS gradient cards | Painted key art per district (Security, Quantum Lab, Archive, Regex Workshop, Grammar Tower, Stack Reactor, Pumping Dungeon). The map is the player's mental model of the Chomsky hierarchy — it carries the most meaning per pixel. | High |
| 2 | **Music** | None | One ambient loop per world, shifting as computational power increases. Silence is the single biggest "this is a prototype" tell. | High |
| 3 | **SFX** | 6 synthesized oscillator tones | Designed accept/reject/step/place/undo/victory set. Current tones are functional and correctly muted by default, but they read as programmer art. | High |
| 4 | **Victory / failure moments** | CSS crest + Framer Motion | Particle bursts, screen-space FX, a real promotion cinematic. Reward feel is where a game earns replay. | Medium |
| 5 | **NPC portraits** | Text chips + modal | Character art for the existing roster. Dialogue and relationship logic already exist and are unused visually. | Medium |
| 6 | **UI iconography** | Unicode glyphs (✓ ✕ 🔒 ◈) | A coherent icon set. Unicode is accessible and consistent but visually generic. | Medium |
| 7 | **Automata rendering** | React Flow default nodes/edges | Custom node art per machine class — finite states vs stack frames vs tape cells should look like different kinds of machine. | Medium |
| 8 | **Cutscenes** | Text boot sequence | Animated intro and a Halting Problem finale. World 15 is the narrative climax and currently has no medium to land it. | Low (until content exists) |
| 9 | **Voice** | None | ARIA voice lines. The mentor is fully deterministic, so lines are enumerable and could be recorded rather than synthesized. | Low |
| 10 | **Fonts** | System/Tailwind stack | Licensed display face for the sci-fi identity. | Low |

## Constraints any asset work must respect

- **Reduced motion** (NFR-A11Y-1) — every animation needs a still fallback.
- **Colour is never the only signal** (NFR-A11Y-2) — art may not encode accept/reject in hue alone.
- **Audio muted by default** (NFR-A11Y-3) — music must not autoplay.
- **Screen-reader parity** (NFR-A11Y-4) — decorative art must be `aria-hidden`; meaningful art needs alt text.
- Bundle budget: art must not regress LCP/TTI targets.
