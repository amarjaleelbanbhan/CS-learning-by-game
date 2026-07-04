# Project ARC Reactor — UI/UX Review Logs

This file logs ongoing review findings, design feedback, game-feel recommendations, and implementation statuses.

---

Date: 2026-06-29
Screen: HUD TopBar
Severity: High
Category: UX / Game Feel
Observation: The audio mute button is currently rendered with raw text emojis (🔇/🔊), which breaks the high-tech immersive visual style of the Arc Lab HUD.
Recommendation: Replace emoji characters with customizable SVG speaker and audio wave icons that respond dynamically to state and hover.
Implementation Status: Implemented
Expected Player Impact: Higher visual consistency and professional UI polish.
Estimated Effort: 30m

---

Date: 2026-06-29
Screen: Boot Sequence Visor
Severity: High
Category: Motion / Atmosphere
Observation: Startup log lines appear instantaneously, making the terminal sequence look like a web-page refresh rather than a simulated hardware boot sequence.
Recommendation: Implement character typewriter animations for log entries and overlay subtle scanlines.
Implementation Status: Implemented
Expected Player Impact: Instant immersive hook during the intro.
Estimated Effort: 1h

---

Date: 2026-06-29
Screen: Simulation Visor
Severity: Medium
Category: UI/UX Feedback
Observation: The accepted/rejected banners are flat CSS boxes with simple tick/cross text. In a laboratory simulation setting, this feedback should feel like a security gate clearance scan.
Recommendation: Style clearance outcomes as tactical HUD notifications. Add scanning grid animations for ACCEPTED and flashing alert pulses for REJECTED.
Implementation Status: Implemented
Expected Player Impact: Clearer, more satisfying gameplay loops and cognitive rewards.
Estimated Effort: 1.5h

---

Date: 2026-06-29
Screen: Engineer Console — ID Card
Severity: High
Category: UI Designer / Art Director
Observation: The ID Card is a static panel. It doesn't look like a real holographic military badge or personnel dossier.
Recommendation: Add micro-metadata (e.g. system status, sector ID), a glowing sweep-line effect over the progress bar, and container scanline patterns.
Implementation Status: Implemented
Expected Player Impact: Higher sense of progression and character context.
Estimated Effort: 1h

---

Date: 2026-06-29
Screen: Simulation Playback Controls
Severity: Medium
Category: UI/UX Feedback
Observation: Scrubber controls use raw text symbols (⟲, ⏮, ⏸, ▶, ⏭) which display unevenly across operating systems and browsers.
Recommendation: Replace media controls with precise vector SVGs that scale and highlight on active simulation states.
Implementation Status: Implemented
Expected Player Impact: Standardized, robust media playback controls that feel premium.
Estimated Effort: 45m

---

Date: 2026-06-29
Screen: Home Page Hero
Severity: High
Category: Motion / Atmosphere
Observation: The Reactor Core in the landing hero is completely static (animate=false), which contradicts the fantasy of a powered "Arc Reactor" system and lacks visual interest.
Recommendation: Add continuous, alternating rotation animations to each of the concentric reactor rings, creating an ambient mechanical spinning effect.
Implementation Status: Implemented
Expected Player Impact: Immersion and visual wow factor upon landing on the home page.
Estimated Effort: 30m

---

Date: 2026-06-29
Screen: Career Terminal — Tabs
Severity: Medium
Category: UI/UX Feedback
Observation: Sub-navigation tabs are flat standard buttons without visual cues or transitions, making the Career dashboard feel like a static web form.
Recommendation: Redesign tabs to look like holographic console elements with unique prefix codes, apply Framer Motion's layoutId for sliding active backdrop highlights, and hook up playSfx sound feedback on interaction.
Implementation Status: Implemented
Expected Player Impact: High-tech console immersion, tactile feedback on navigation, and smoother transitions.
Estimated Effort: 1h

---

Date: 2026-06-29
Screen: Career Terminal — Certifications
Severity: Medium
Category: UI Designer
Observation: Earned and unearned certifications are presented as simple flat bullet-style items with plain text descriptions.
Recommendation: Style certifications as glowing tactical cards. Replace plain status text with custom vector SVGs (glowing checkmark for certified, padlocks for locked) and add a glowing pulse shadow (shadow-accept) for completed certificates.
Implementation Status: Implemented
Expected Player Impact: Satisfying visual reward and recognition for completing certification-eligible courses.
Estimated Effort: 1h

---

Date: 2026-06-29
Screen: Career Terminal — Blueprints
Severity: High
Category: UI Designer / Game Feel
Observation: The blueprint list uses raw unicode emojis (🗝️ and 🔒) in a flat border layout, which breaks the immersive high-tech aesthetic.
Recommendation: Swap raw emojis with customized sci-fi SVG icons (vector lock and floating blueprint data-cube) and overlay a blueprint schematic grid pattern on the card background.
Implementation Status: Implemented
Expected Player Impact: Immersion-boosting visuals that make unlocking blueprints feel like acquiring actual game tech.
Estimated Effort: 1.5h

---

Date: 2026-06-29
Screen: Career Terminal — Laboratory
Severity: Medium
Category: UI Designer / UX
Observation: Laboratory equipment and decorations are presented as static text blocks with simple labels.
Recommendation: Convert lists to active diagnostic nodes. Introduce blinking status LED lights (glowing green pulse for ONLINE modules and dark grey/amber for OFFLINE modules) along with high-tech monospace hexadecimal identifiers (e.g. UNIT_0x0A).
Implementation Status: Implemented
Expected Player Impact: Immersive feeling of managing a real laboratory diagnostic terminal.
Estimated Effort: 1h

---

Date: 2026-06-29
Screen: Academy Map
Severity: High
Category: Motion / Game Feel
Observation: The world map contains raw unicode emojis (🔒 and ✓) for mission status, and lacks interactive audio cues when clicking through nodes.
Recommendation: Replace unicode symbols with sleek vector SVGs and trigger synthesized playSfx clicks on selecting nodes.
Implementation Status: Implemented
Expected Player Impact: Standardized visual polish across the world map, unified game audio feedback.
Estimated Effort: 1h

---

Date: 2026-06-29
Screen: NFA to DFA Lab
Severity: Medium
Category: UI Designer / UX Feedback
Observation: The subset expansion step container and DFA states telemetry box are plain and static, lacking dynamic feedback when steps advance.
Recommendation: Restyle the DFA states counter with corner reticles and neon themes. Add a left-side glowing accent bar that flashes via animation triggers when playback frames increment.
Implementation Status: Implemented
Expected Player Impact: Clearer step-by-step progress tracking, higher immersive AAA console feel.
Estimated Effort: 45m

---

Date: 2026-06-29
Screen: Celebration Screens & Map Empty District States
Severity: High
Category: Visual FX / Immersion
Observation: Completion prompts used raw emojis, breaking the sci-fi immersion. Empty map districts were just plain text.
Player Impact: Replaced emojis with rotating mechanical vector crests and particle effects. Placed a secure grid overlay on empty districts.
Suggested Improvement: Implement a reusable VictoryCrest component and construct a beautiful construction panel in empty districts.
Implementation Complexity: Low.
Architecture Impact: None.
Status: Implemented

---
