# Story 1.3: Build the reusable Plugin Visual component

Status: ready-for-dev

> **Note (2026-07-26):** the registry has grown from 6 to 10 plugins since this story was written (Overdrive, Flanger, Phaser, Chorus added — see `web/lib/registry/logicPro.ts`); references to "six" below are stale and updated in place. Separately, live design discussion with the founder leans toward **bespoke per-plugin-type layouts** rather than AC2's "one generic component" — that's a real, not-yet-resolved change to this story's core approach, blocked on the founder providing reference images for each plugin (only Compressor has one so far). Do not start Task 1 until that's resolved.

## Story

As a user viewing my results,
I want each plugin shown as a Logic-style visual (not a plain settings list),
so that it's immediately recognizable as "what I'll build in Logic Pro."

## Acceptance Criteria

1. Given a plugin's registry definition (`PluginRegistryEntry`) and the actual generated control values for it (`ControlValue[]`), when the `PluginVisual` component renders them, then it draws one consistent, generic visual treatment — a header with the plugin's display name, and a grid of knob/toggle-style controls — styled in VocAligner's own design tokens, laid out in the spirit of the reference Compressor UI (`docs/images.md/Compressor_plugin.png`).
2. Given this is the MVP's single default treatment, when any of the ten current registry plugins (Channel EQ, Compressor, DeEsser 2, ChromaVerb, Tape Delay, Pitch Correction, Overdrive, Flanger, Phaser, Chorus) are passed in, then the *same* component instance renders all of them correctly — no per-plugin-type branching or bespoke sub-components. **(See note above — this AC is under active reconsideration.)**
3. Given a control's value and its registry definition, when rendered, then only the literal value (+ unit, if any) is shown — never `PluginInstance.rationale`, never `ControlValue.confidence`, never the registry entry's `education` object. (FR7 — no rationale/explanation text in MVP.)
4. Given the component is built in this story, when it's used, then it takes sample/fixture data matching the real schema shapes — it has no dependency on a live Generation or the results page's data-fetching; that wiring is Story 1.4.

## Tasks / Subtasks

- [ ] Task 1: Build `PluginVisual` component (AC: 1, 2)
  - [ ] Create `web/app/components/PluginVisual.tsx`, props: `{ plugin: PluginRegistryEntry; values: ControlValue[] }`.
  - [ ] Render a header (plugin `displayName`) and a responsive grid of controls — one entry per item in `values` (not per item in `plugin.controls`; a Generation may use only a subset of a plugin's possible controls — see Dev Notes).
  - [ ] For each control, look up its `ControlDefinition` from `plugin.controls` by matching `parameter`, to get `type`/`unit`/`min`/`max` for formatting.
  - [ ] Reuse the existing `formatParameterLabel` helper from `web/app/results/page.tsx` for turning `parameter` (e.g. `makeupGain`) into a display label ("Makeup Gain") — do not reimplement this.
- [ ] Task 2: Per-control widgets by `type` (AC: 1, 3)
  - [ ] `"number"` (the only type any current registry plugin actually uses): render as a circular knob-style control — label above, literal value + unit below (e.g. "−18 dB", "4:1" for unitless ratios). If `min`/`max` are both defined on the definition, compute a needle/indicator rotation with a small pure helper function (see Task 3); if not defined, render the knob without a positioned indicator.
  - [ ] `"boolean"`: render as an on/off toggle pill (label + "On"/"Off"), matching the reference image's Limiter toggle style. (No current registry entry uses this — support it because the schema allows it, but don't over-invest polish here.)
  - [ ] `"string"`: render as a label/value pill (parameter label + the string value). The schema has no enumerated list of allowed string values (`controlDefinitionSchema` has no options list), so this is a simple display, not a multi-choice selector.
- [ ] Task 3: Knob rotation helper (AC: 1)
  - [ ] Extract a pure function, e.g. `getKnobRotationDeg(value: number, min: number, max: number): number`, clamping and linearly interpolating the value across a standard knob sweep (e.g. −135° to +135°).
  - [ ] Add `PluginVisual.helpers.test.ts` (or similar) unit-testing this pure function directly with Vitest — no DOM/component rendering required, so this works with the existing test setup as-is. See testing note below for what's explicitly *not* tested in this story.
- [ ] Task 4: Styling compliance (AC: 1)
  - [ ] Use only the stable, already-established design tokens/semantic classes (see Dev Notes for exactly which ones) — never a raw hex value or raw Tailwind palette utility, per Architecture AD-6.
  - [ ] If a genuinely new color is needed (e.g. a meter/knob-fill accent), add a new `--color-*` token to `globals.css` first, then a semantic class for it — don't reach for Tailwind's built-in palette directly.

## Dev Notes

- **Design priority, not a lower bar.** Per `docs/DESIGN_SYSTEM.md`'s Functional Pages section: the results page's background stays calm/simple by design, but the Plugin Visual itself is the product's actual payoff moment — it earns the same design care as the landing page hero, not less because it sits on a "functional" page. Take the time to make the knob/toggle styling genuinely feel premium (matching the brand personality: calm, confident, not flashy), not just structurally correct.
- **What to take from the reference image, and what to deliberately leave out.** `docs/images.md/Compressor_plugin.png` is a dark-themed mockup of a *hypothetical, much richer* plugin UI. Take from it: the overall panel/header treatment, the circular-knob-with-value-label control style, and the on/off toggle-pill style. **Do not implement these parts of the image** — they either have no backing data in the current schema, or are explicitly out of MVP scope:
  - The circuit-type tab row ("Platinum Digital / Studio VCA / Studio FET / …") — nothing in `ControlDefinition` models a plugin "variant" or list of selectable modes. Not buildable against real data; skip it.
  - The meter/gain-reduction graph area — no data exists for this. Skip it.
  - The "AI suggested" badge — optional, skip unless trivial; not a requirement.
  - **"Why these settings?" and "Explain this chain ↗"** — these are literally the future **Setting Rationale Hover** / Confidence Score features (see Architecture Deferred, PRD §5/§6.2). FR7 explicitly says no rationale/explanation text in MVP. Do not add these buttons or any equivalent.
  - The dark theme itself — VocAligner's design language is light, warm-sunset (`docs/DESIGN_SYSTEM.md`). Recreate the *layout*, not the *color scheme*, of the reference.
- **A tempting trap: `education` is NOT for this component.** Every `PluginRegistryEntry` in `web/lib/registry/logicPro.ts` carries a rich `education` object (`whyUsed`, `whatToListenFor`, `commonMistakes`, `adjustmentGuidance`) — real, well-written explanatory text that's sitting right there in the data you're already reading. **Do not render any of it.** This is exactly the content the future Setting Rationale Hover feature will surface — for MVP, FR7 requires literal values only. Leave `education` untouched by this component.
- **All ten current registry plugins use `type: "number"` controls only** (2–5 controls each: Channel EQ has 4, Compressor has 5, DeEsser 2 has 2, ChromaVerb has 3, Tape Delay has 3, Pitch Correction has 2, Overdrive has 3, Flanger has 4, Phaser has 4, Chorus has 3). Design the grid to reflow cleanly across that 2–5 range. `boolean`/`string` types are schema-supported but currently unused anywhere in real data — support them for correctness, don't gold-plate them.
- **Stable design tokens to use** (confirmed still in active use, not exploration churn): `--foreground`/`text-foreground`, `--muted`/`text-muted`, `--supporting`/`text-supporting`, `--background`/`bg-background`, `--brand-accent`/`text-brand-accent`/`bg-brand-accent` (the real VocAligner gold — note this is *not* the same as shadcn's own `--accent`, which is an unrelated neutral surface color; see the comment directly above both definitions in `globals.css`). **Do not use** any of `--wash-*`, `--vivid-*`, `--muted-gold`/`-coral`/`-lavender`, or `--dusk-panel*` — these are active landing-page design-exploration tokens that may be deleted once that work settles, and have nothing to do with this component.
- **Data shapes** (already defined, do not modify): `PluginRegistryEntry` and `ControlDefinition` in `web/lib/registry/types.ts`; `ControlValue` and `PluginInstance` in `web/lib/schema/chain.ts`. This story only reads these types — it does not touch the registry, schema, or pipeline.
- **This component has no live-data dependency.** Build and verify it against fixture data shaped like the real types (e.g. a sample Compressor `PluginRegistryEntry` + a sample `ControlValue[]` with threshold/ratio/attack/release/makeupGain values). Story 1.4 is the one that wires it to a real Generation on the results page.

### Project Structure Notes

- New file: `web/app/components/PluginVisual.tsx` (sibling to the existing `Wordmark.tsx`, `Mark.tsx` in the same directory).
- New test file: `web/app/components/PluginVisual.helpers.test.ts` (or co-located equivalent) — tests the pure knob-rotation helper only.
- **Testing note (same constraint as Story 1.2):** this codebase has no component-rendering test infrastructure yet (no jsdom/React Testing Library configured in `vitest.config.ts`). Do not add one as a side effect of this story — that's a separate infra decision for the founder to make deliberately. Test only the pure, DOM-free logic (the knob-rotation helper, and any other pure formatting functions you extract). Visual correctness is verified manually (e.g. temporarily rendering the component with fixture data via the dev server) rather than via an automated render test.
- Naming: PascalCase for the component file (matches `Wordmark.tsx`/`Mark.tsx`), camelCase for any extracted helper functions.

### References

- [Source: _bmad-output/planning-artifacts/prds/prd-VocAligner-2026-07-23/prd.md#FR-6, FR-7, §3 Glossary "Plugin Visual"]
- [Source: _bmad-output/planning-artifacts/architecture/architecture-VocAligner-2026-07-23/ARCHITECTURE-SPINE.md#AD-6]
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 1: See a Real Vocal Chain, Not a Preview / Story 1.3]
- [Source: docs/images.md/Compressor_plugin.png]
- [Source: web/lib/registry/logicPro.ts]
- [Source: web/lib/registry/types.ts]
- [Source: web/lib/schema/chain.ts]
- [Source: web/app/results/page.tsx (existing `formatParameterLabel`/`CATEGORY_LABELS` helpers to reuse)]
- [Source: web/app/globals.css (token comments distinguishing stable vs. exploration tokens)]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
