# Project ARC Reactor — UI/UX & Design System

## 1. Design Language: "Arc Lab HUD"

Mood: **Tony Stark's workshop meets Apple precision meets 3Blue1Brown clarity.** Dark, cinematic, energetic — but the _content_ (the automaton, the math) is always the brightest thing on screen. The chrome glows; the lesson shines.

Anti-goal: a UI so busy it competes with learning. Effects earn their place by directing attention (e.g., a glow that says "this state is active"), never as ambient noise.

## 2. Design Tokens

Tokens live in `packages/ui/tokens` and are the single source of truth (consumed by Tailwind config + CSS variables; plugins may override a subset).

### Color

```
--bg-void:        #05070D   /* deepest background */
--bg-panel:       #0B1220   /* glass panel base */
--bg-elevated:    #111A2E
--arc-cyan:       #38E1FF   /* primary energy / accent */
--arc-blue:       #2D7BFF   /* primary action */
--arc-gold:       #FFC24B   /* XP / rewards */
--success:        #36F2A6   /* accept */
--danger:         #FF5C7A   /* reject / error */
--violet:         #9B6BFF   /* AI tutor / special */
--text-hi:        #EAF2FF
--text-mid:       #9DB0CE
--text-low:       #5C6E8C
--grid-line:      rgba(56,225,255,0.08)
```

Semantic mapping: `accept = success`, `reject = danger`, `active-state = arc-cyan glow`, `epsilon = violet`. **Never rely on color alone** (NFR-A11Y-2): accept also shows a ✓ + double-ring; reject shows ✕ + dashed ring.

### Typography

- Display/HUD: `Orbitron` / `Rajdhani` (sci-fi headings, sparingly).
- UI & body: `Inter`.
- Code/strings/automata labels: `JetBrains Mono`.
- Math: KaTeX default.
- Scale (rem): 0.75 / 0.875 / 1 / 1.25 / 1.5 / 2 / 3 / 4. Line-height 1.5 body, 1.2 display.

### Spacing & Radius

- Spacing scale (px): 4, 8, 12, 16, 24, 32, 48, 64.
- Radius: sm 8, md 12, lg 20, pill 999. Panels use `lg`.
- Glass: `backdrop-blur(16px)` + 1px `arc-cyan @ 12%` border + subtle inner glow.

### Elevation / Glow

- e0 flat; e1 panel (soft shadow); e2 floating window (shadow + faint cyan rim); e3 modal/celebration (strong glow).

### Motion tokens

```
--dur-fast: 120ms   --dur-base: 240ms   --dur-slow: 480ms   --dur-cine: 900ms
--ease-out: cubic-bezier(.16,1,.3,1)        /* enters */
--ease-inout: cubic-bezier(.65,0,.35,1)     /* moves */
--ease-energy: cubic-bezier(.34,1.56,.64,1) /* playful pop (rewards) */
```

## 3. Motion Principles

1. **Motion is explanation.** A transition animates because the _concept_ moves (a token traversing an edge). Decorative motion stays subliminal (slow particle drift, arc-reactor pulse).
2. **Continuity over cuts.** State changes morph; objects don't teleport. The subset-construction view _grows_ the DFA rather than swapping diagrams.
3. **Always interruptible & replayable.** Every animation has play/pause/step/scrub. The user controls time.
4. **Reduced-motion is first-class.** `prefers-reduced-motion` → cross-fades + instant step transitions, all info preserved (NFR-A11Y-1).
5. **Library split:** Framer Motion for component/layout transitions; GSAP timelines for complex orchestrated lab sequences; Canvas/R3F for particles & energy. The `animation-engine` produces keyframes; adapters drive each library.

## 4. Layout System

- **HUD Shell:** persistent top bar (logo, breadcrumb, ArcRing XP, streak flame, coins) + collapsible left lab/skill rail + right AI Tutor dock. Center is the stage/lab canvas.
- **Lesson Runner:** stage progress as a horizontal "energy conduit"; current stage glows. Content column max-width ~72ch; visualization gets the wide canvas.
- **Lab layout:** canvas (flex-1) + right inspector panel (properties, transition table, controls) + bottom timeline.
- **Responsive:** ≥1280 full 3-pane; 768–1279 dock/rail collapse to overlays; <768 stage-stacked, labs go single-column with bottom-sheet controls and touch gestures.

## 5. Core Components (Design System — `packages/ui`)

| Component                                    | Purpose                                                          | Key states                         |
| -------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------- |
| `<Panel variant=glass\|solid>`               | Container surface                                                | default/hover/active               |
| `<HoloButton intent=primary\|ghost\|danger>` | Actions                                                          | rest/hover/active/loading/disabled |
| `<ArcRing value max>`                        | XP / progress ring with energy fill                              | animated fill                      |
| `<HudCard>`                                  | Mission / achievement card                                       | locked/available/completed         |
| `<NeonBadge>`                                | Achievement / streak                                             | unlocked vs locked (desaturated)   |
| `<StatPill icon>`                            | Coins, XP, streak                                                | —                                  |
| `<TimelineScrubber>`                         | Scrub simulation                                                 | playing/paused/scrubbing           |
| `<MathBlock>` / `<MathInline>`               | KaTeX                                                            | —                                  |
| `<Callout intent>`                           | Intuition / warning / mistake                                    | info/warn/tip                      |
| `<Celebration>`                              | Reward burst (particles + sound, respects reduced-motion & mute) | —                                  |
| `<Toast>` `<Modal>` `<Tabs>` `<Tooltip>`     | Standard primitives (a11y-correct)                               | —                                  |

All primitives: keyboard-operable, focus-visible rings in `arc-cyan`, ARIA-labeled, theme-token-driven.

## 6. Lab/Viz Components (`packages/viz`)

`<AutomatonGraph>`, `<SubsetConstructionView>`, `<ProductDfaView>`, `<RegexStudio>`, `<GrammarStudio>`, `<ParseTreeView>`, `<PdaStackView>`, `<PumpingLemmaLab>`, `<TransitionTable>` (accessible alt view), `<SimulationControls>`. These consume engine models only — no algorithms inside.

## 7. State, Empty, Loading, Error

Every data-driven surface defines four states. Loading = skeletal HUD shimmer in `arc-cyan @ low`. Empty = friendly JARVIS prompt + primary CTA. Error = recoverable message + retry, never a dead end.

## 8. Sound Design

Subtle, optional, **muted by default** (NFR-A11Y-3): soft "power-up" on correct, low "fault" tone on wrong, reactor hum on lab entry, reward chime on level-up. Global mute + per-category volume in prefs.

## 9. Accessibility Checklist (gates handoff)

- Contrast ≥ 4.5:1 (text), ≥ 3:1 (UI/graphics).
- Non-color signaling for accept/reject/active/epsilon.
- Full keyboard path through lessons, labs, practice.
- Reduced-motion + textual transition-table alternative for every automaton.
- Focus management on modals/celebrations; no keyboard traps.
- Screen-reader live-region narrates simulation steps.

## 10. Theming & Unlockables

Themes are token overrides (`arc-cyan` default; e.g., "Stark Gold", "Quantum Violet"). Unlockable themes plug in via `inventory_items` + plugin `theme` overrides — no code change to re-skin.
