# Story 1.3: Build the bespoke Plugin Visual components

Status: in-progress

> **Progress (2026-07-30):** Task 0 (registry correction for Overdrive/Flanger/Phaser/Chorus), Task 2 (Channel EQ), and Task 3 (Pitch Correction) are complete — see Dev Agent Record below. Task 1 (the other 8 knob-based visuals: Compressor, DeEsser 2, ChromaVerb, Tape Delay, Overdrive, Flanger, Phaser, Chorus) and the remainder of Task 4 (styling compliance for those 8) are deliberately deferred to a follow-up pass, per the founder's explicit scoping — Channel EQ and Pitch Correction were the two plugins already fully validated through the mockup process, the other 8 were not.

> **Resolution (2026-07-29):** the original "one generic component" approach (AC2 below, superseded) was reversed by the founder after reviewing real Logic Pro screenshots for all 10 registry plugins — a generic knob-grid didn't read as premium or recognizable. The bespoke direction was validated through an iterative static-mockup process (not live component code) for the two plugins that needed real new engineering — Channel EQ and Pitch Correction — before this story was reopened for implementation. See `docs/DESIGN_SYSTEM.md`'s Plugin Visual Fidelity Standards section and `docs/plugin-references.md` for everything that process produced. This rewrite supersedes the story's original AC/Tasks/Dev Notes in full.

## Story

As a user viewing my results,
I want each plugin shown as a Logic-style visual matching that specific plugin's real interface,
so that it's immediately recognizable as "what I'll build in Logic Pro."

## Acceptance Criteria

1. Each of the 10 registry plugins (Channel EQ, Compressor, DeEsser 2, ChromaVerb, Tape Delay, Pitch Correction, Overdrive, Flanger, Phaser, Chorus) renders as its own bespoke visual matching its real Logic Pro panel (`docs/images.md/*_plugin.png`), styled in VocAligner's own design tokens — not one generic template reused across types. `[SUPERSEDES original AC2]`
2. Compressor, DeEsser 2, ChromaVerb, Tape Delay, Overdrive, Flanger, Phaser, and Chorus are knob-based — each gets a bespoke layout/proportions matching its real panel, but stays within the existing flat `ControlValue[]` data shape (no schema change for these 8).
3. Channel EQ renders as a real computed frequency-response curve (not a knob grid) — see the Channel EQ section in Dev Notes for the full, already-validated spec.
4. Pitch Correction renders a keyboard that highlights the notes actually in the researched Root Note + Scale/Chord (not a literal black/white piano, not per-example hardcoding) — see the Pitch Correction section in Dev Notes.
5. Every control shows its literal value only — never `PluginInstance.rationale`, `ControlValue.confidence`, or the registry's `education` object (FR7 — no rationale/explanation text in MVP).
6. All 10 components take sample/fixture data matching the real schema shapes — no dependency on a live Generation or the results page's data-fetching yet; that wiring is Story 1.4.

## Tasks / Subtasks

- [x] Task 0: Correct known-inaccurate registry parameters before styling around them (AC: 1)
  - [x] Checked all 4 (Overdrive, Flanger, Phaser, Chorus) against their reference screenshots, not just Phaser. Corrected parameter names/units/ranges/defaults in `web/lib/registry/logicPro.ts`. Phaser needed the most work: removed the invented "Intensity" knob, added `stages`/`rate1`/`rate2`/`ceiling`/`floor`/`sweepMode`/`feedback`/`warmth`/`mix` matching the real dual-LFO/Sweep/Feedback-section layout.
  - [x] Committed separately (`532b45c`) before any visual work began.
- [ ] Task 1: Build the 8 knob-based bespoke visuals (AC: 1, 2, 5) — **deferred to a follow-up pass**
  - [ ] Compressor, DeEsser 2, ChromaVerb, Tape Delay, Overdrive, Flanger, Phaser, Chorus. Each is its own component (or a shared knob-rendering base parameterized per plugin's layout — dev's call), reading `{ plugin: PluginRegistryEntry; values: ControlValue[] }` same as the original single-component design.
  - [ ] Match each plugin's real panel proportions/knob arrangement from its reference screenshot — this is a layout/styling task per plugin, not a new rendering paradigm. Reuse one knob-rendering treatment (rotation math, value label style) across all 8 rather than reinventing per plugin.
  - [x] `formatParameterLabel` extracted to `web/lib/format/parameterLabel.ts` (done now since `results/page.tsx` already needed the import updated); `results/page.tsx` updated to import from there.
  - [x] `getKnobRotationDeg(value, min, max)` built as a pure, unit-tested helper (`web/lib/controls/knobRotation.ts`) — built now because Pitch Correction's Response/Tolerance knobs needed it; ready for the other 8's knobs to reuse.
  - [ ] Per-control widgets by `type` for the 8 knob-based plugins specifically (`"boolean"` toggle pill, `"string"` label/value pill) — not yet built.
- [x] Task 2: Build the Channel EQ visual (AC: 1, 3, 5)
  - [x] `web/app/components/ChannelEqVisual.tsx` + `web/lib/eq/channelEqCurve.ts` (curve math, band resolution, axis/collision helpers) built against the already-validated spec directly.
  - [x] Extended `logicPro.ts`'s Channel EQ entry to the real 8-band structure — 22 flat, namespaced controls (`bandNFrequency`/`bandNGain`/`bandNQ`/`bandNSlope`). Note beyond the original Dev Notes spec below: bands 1/8 turned out to need Q *in addition to* Slope, not instead of it — confirmed against the reference screenshot's three-line band readout and Story 1.3's own prose spec ("Band 1: 20.0 Hz, 0.0 dB, 12 dB/Oct, Q 0.71"), which the condensed Dev Notes table below had flattened away. 24dB/Oct is modeled as two cascaded 12dB/Oct biquad stages at the band's own resolved Q (cascaded dB responses sum), not a fixed Butterworth constant.
- [x] Task 3: Build the Pitch Correction visual (AC: 1, 4, 5)
  - [x] `web/app/components/PitchCorrectionVisual.tsx` + `web/lib/pitch/scaleIntervals.ts` (full interval table + lookup) built against the already-validated spec directly.
  - [x] Added `rootNote`/`scale` (string controls) to Pitch Correction's registry entry, plus corrected `response`'s default (122ms, was 50ms) and replaced the invented `amount`/% control with the real `tolerance`/Cent control — found while extending the entry, same FR-6 correctness principle as Task 0.
- [ ] Task 4: Styling compliance, all 10 (AC: 1) — **complete for Channel EQ and Pitch Correction; not yet applicable to the other 8 (Task 1 deferred)**
  - [x] Channel EQ and Pitch Correction use only stable tokens (`--brand-accent`, `--border`, `--foreground`, `--muted`, `--supporting`, `--background`) — no raw hex/Tailwind palette utilities, no new tokens needed.

## Dev Notes

- **Design priority, not a lower bar.** Per `docs/DESIGN_SYSTEM.md`'s Functional Pages section: the results page's background stays calm/simple by design, but the Plugin Visual itself is the product's actual payoff moment — it earns the same design care as the landing page hero. This is also *why* the original generic-component plan was reversed — it didn't clear that bar.
- **General fidelity rules (apply to all 10, see `docs/DESIGN_SYSTEM.md`'s Plugin Visual Fidelity Standards for the full text):** always build against the real reference screenshot, don't just aim for "in the spirit of" it; verify a plugin's neutral/rest state actually renders as neutral before checking it against applied data; never let a generic charting/UI-library default (data-point markers, default gridline spacing) slip in where the real plugin has its own specific visual language; custom icons only, never placeholder glyphs.
- **`education` is NOT for this component, for any plugin.** Every `PluginRegistryEntry` carries a rich `education` object (`whyUsed`, `whatToListenFor`, etc.) — do not render any of it. That's the future Setting Rationale Hover feature's content; FR7 requires literal values only for MVP.
- **Stable design tokens** (confirmed still in active use): `--foreground`/`text-foreground`, `--muted`/`text-muted`, `--supporting`/`text-supporting`, `--background`/`bg-background`, `--brand-accent`/`text-brand-accent`/`bg-brand-accent`. **Do not use** `--wash-*`, `--vivid-*`, `--muted-gold`/`-coral`/`-lavender`, or `--dusk-panel*` — landing-page exploration tokens, unrelated to this work.
- **Data shapes** (already defined; extend Channel EQ's and Pitch Correction's registry entries per Tasks 2/3, don't otherwise modify): `PluginRegistryEntry`/`ControlDefinition` in `web/lib/registry/types.ts`; `ControlValue`/`PluginInstance` in `web/lib/schema/chain.ts`. `PluginInstance.controls` is a sparse array — a plugin instance only includes the controls actually set, not necessarily every control the registry defines for that type. This matters directly for Channel EQ (see below).
- **No live-data dependency for any of the 10 in this story.** Build and verify against fixture data shaped like the real types. Story 1.4 wires this to a real Generation on the results page.

### Channel EQ — full spec (already validated via mockup)

- **8 real bands**, not 4: frequency/gain/Q per band, except bands 1 and 8 which use a dB/Octave slope instead of Q. Real default values (pulled directly from a neutral-state Logic screenshot, see `docs/plugin-references.md`):
  Band 1: 20.0 Hz, 0.0 dB, 12 dB/Oct, Q 0.71 · Band 2: 75.0 Hz, 0.0 dB, Q 1.00 · Band 3: 100 Hz, 0.0 dB, Q 0.60 · Band 4: 250 Hz, 0.0 dB, Q 0.30 · Band 5: 1040 Hz, 0.0 dB, Q 0.41 · Band 6: 2500 Hz, 0.0 dB, Q 0.20 · Band 7: 7500 Hz, 0.0 dB, Q 1.00 · Band 8: 20000 Hz, 0.0 dB, 24 dB/Oct, Q 0.71.
- **A band absent from `PluginInstance.controls[]` must contribute zero to the curve** — never fall back to rendering it at the registry's stored default frequency. This was a real bug found during the mockup process: computing a "disabled" band's filter response at its parked default frequency instead of skipping it entirely produced a curve that wasn't flat even at rest. Build the neutral-state check first (all bands absent/default) and confirm it's a dead flat line before layering in applied data.
- **The curve is computed client-side from real filter-response math** (biquad/RBJ Cookbook formulas per band type — low-cut, low-shelf, bell/peaking, high-shelf, high-cut), not an approximation. This is deterministic rendering of already-generated data, not something the AI produces.
- **Shading fills between the curve and the 0dB line**, not between the curve and the chart floor — above the curve fills down to 0, below fills up to 0, no fill where the curve is exactly at 0.
- **Dual-scale gain axis**: tight ~5dB spacing near 0, wider/coarser spacing further down (matching the real plugin's own asymmetric scale) — not one uniform linear scale, which buries small real moves (±1.5-4.4dB is typical) against a wide range.
- **Frequency axis labels sit on the 0dB center line** (matching the real plugin), with full log-scale intermediate labels (30/40/.../90, 200/.../900, 2k/.../9k), not just the 5 major decade marks — and with collision handling so labels don't overlap each other or the gain axis's own labels at the chart's right edge.
- **No dot/point markers on the curve** — the real plugin doesn't have them; they read as a generic charting-library default.

### Pitch Correction — full spec (already validated via mockup)

- **Highlight notes computed from Root Note + Scale/Chord**, never hardcoded per example. `docs/plugin-references.md` has the full interval-pattern table (42 scale/chord types Logic supports, each as semitone offsets from the root) — look up the pattern, transpose onto the root, apply to the 12-key layout.
- **Verify against more than one root/scale combination before considering this done** — a C Major test case alone will pass even with an incorrect implementation, since C Major's notes happen to be exactly the white keys.
- **Every key uses one of exactly two flat colors** — one for in-scale, one for faded/out-of-scale — identical regardless of whether the key is naturally black or white. Do not tint, darken, or blend the color differently for black keys; that produces an ambiguous muddy tone rather than a clear on/off read. Black vs. white identity is communicated by shape/size only (the traditional shorter, narrower key silhouette), never by color. Matches real Logic's own behavior (every key is the same blue in Chromatic Scale mode).
- **Match the real keyboard's proportions** — roughly 2.5:1 width:height for the keyboard block, a proper piano-key shape, not a flattened strip.
- **Drop the live "Correction: N Cent" meter** — in real Logic that's a real-time readout during playback, not a setting; in a static display it would only ever show a meaningless 0. Don't build a precise-looking meter for a number that never changes.

### Project Structure Notes

- New files: one component per plugin (or a shared knob-rendering base for the 8 simple ones + two bespoke components for Channel EQ and Pitch Correction — dev's call on the exact split), in `web/app/components/`, sibling to `Wordmark.tsx`/`Mark.tsx`.
- New shared module: `web/lib/format/parameterLabel.ts` (extracted from `results/page.tsx` per Task 1).
- New test files: pure-function helpers only (knob rotation, Channel EQ filter-response math, Pitch Correction interval lookup) — no DOM/component-rendering tests, per the existing testing constraint below.
- **Testing note (same constraint as Stories 1.2/1.3's original scope):** no component-rendering test infrastructure (jsdom/React Testing Library) exists in `vitest.config.ts`. Do not add one as a side effect of this story. Test pure, DOM-free logic only (knob rotation, filter-response math, interval-pattern lookup) with Vitest. Visual correctness is verified manually against the reference screenshots.
- Naming: PascalCase for component files, camelCase for extracted helper functions/modules.

### References

- [Source: _bmad-output/planning-artifacts/prds/prd-VocAligner-2026-07-23/prd.md#FR-6, FR-7, §3 Glossary "Plugin Visual"]
- [Source: _bmad-output/planning-artifacts/architecture/architecture-VocAligner-2026-07-23/ARCHITECTURE-SPINE.md#AD-6, Deferred "Bespoke per-plugin Plugin Visual designs"]
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 1: See a Real Vocal Chain, Not a Preview / Story 1.3]
- [Source: docs/DESIGN_SYSTEM.md#Plugin Visual Fidelity Standards]
- [Source: docs/plugin-references.md — per-plugin ground truth: default values, Channel EQ band data, Pitch Correction interval-pattern table]
- [Source: docs/images.md/*_plugin.png — one real reference screenshot per plugin]
- [Source: web/lib/registry/logicPro.ts, web/lib/registry/types.ts, web/lib/schema/chain.ts]
- [Source: web/app/results/page.tsx (existing `formatParameterLabel` helper to extract)]
- [Source: web/app/globals.css (token comments distinguishing stable vs. exploration tokens)]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5

### Debug Log References

- `npx tsc --noEmit`, `npx eslint .`, `npx vitest run` all clean after each step (42 tests passing across 7 files by the end).
- Fixed a regression caught by the existing test suite: `web/lib/ai/mockModelClient.ts`'s Channel EQ fixture used the pre-correction parameter names (`highPassFrequency` etc.), which the registry validation layer (`web/lib/validation/repairChain.ts`) now correctly rejected. Updated the mock fixture to the new `bandNFrequency`/`bandNGain` names.
- Verified both components visually via a temporary dev-server route rendering neutral + applied fixture data (Channel EQ neutral/applied; Pitch Correction C Major/G Major/E Min7) — screenshots matched the previously-validated mockup output. Route deleted after verification, per this story's own testing note.

### Completion Notes List

- Task 0: checked all 4 plugins (not just Phaser) against their reference screenshots; committed separately (`532b45c`) before any styling work.
- Channel EQ's real band 1/8 structure has both a Slope *and* a Q control (three data lines in the reference readout) — the condensed Dev Notes table below only showed Freq/Gain/Slope-or-Q, but Story 1.3's own prose spec listed all four values for Band 1. Added `band1Q`/`band8Q` to the registry and switched the 24dB/Oct cut-band math from a fixed Butterworth-Q constant to the band's own resolved Q, cascaded across two stages.
- Pitch Correction's registry entry had a second inaccuracy beyond the Task-0-named four plugins: `amount`/% had no real counterpart (real Logic exposes `tolerance` in Cents), and `response`'s default was 50ms instead of the real 122ms. Corrected both while adding `rootNote`/`scale`, since the entry was already being extended.
- `getKnobRotationDeg` (originally scoped to Task 1) was built now because Pitch Correction's own Response/Tolerance knobs needed real rotation math, not fixture placeholders. It's unit-tested and ready for the other 8 plugins' knobs to reuse.
- Task 1 (8 knob-based visuals) and the rest of Task 4 are explicitly deferred — not started.

### File List

- `web/lib/registry/logicPro.ts` (Task 0 correction, committed separately; Channel EQ/Pitch Correction extension)
- `web/lib/ai/mockModelClient.ts` (fixture fix, regression caught by existing tests)
- `web/lib/format/parameterLabel.ts` (new, extracted)
- `web/app/results/page.tsx` (updated to import the extracted helper)
- `web/lib/controls/knobRotation.ts` (new)
- `web/lib/controls/knobRotation.test.ts` (new)
- `web/lib/eq/channelEqCurve.ts` (new)
- `web/lib/eq/channelEqCurve.test.ts` (new)
- `web/lib/pitch/scaleIntervals.ts` (new)
- `web/lib/pitch/scaleIntervals.test.ts` (new)
- `web/app/components/ChannelEqVisual.tsx` (new)
- `web/app/components/PitchCorrectionVisual.tsx` (new)
