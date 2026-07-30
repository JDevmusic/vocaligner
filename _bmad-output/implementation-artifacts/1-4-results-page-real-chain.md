# Story 1.4: Results page renders the real generated chain

Status: ready-for-dev

## Story

As a user,
I want the results page to show the actual chain generated for my request,
so that I can see exactly what to recreate in Logic Pro.

## Acceptance Criteria

1. `[REVISED 2026-08-02 — Story 1.3 no longer builds one generic `PluginVisual`, see Dev Notes]` Given a valid `id` query param on `/results` matching a stored Generation (saved by Story 1.2's `saveGeneration`), when the page loads, then it fetches the full `VocalChainResponse` by that id via a new `GET /api/generate/[id]` route (Architecture AD-10), and renders its plugins in signal-chain order by dispatching each `PluginInstance` to its own bespoke Visual component (`ChannelEqVisual`, `CompressorVisual`, `DeEsser2Visual`, etc. — one per registry plugin, see `web/app/components/`), each showing its real control values.
2. Given no `id` query param, or an `id` that doesn't match any stored Generation (direct navigation, bad link, expired entry, 404 from the route), when the page loads, then the user sees a clear "nothing here" state — never a crash, and never the old hardcoded preview cards.
3. Given `docs/DESIGN_SYSTEM.md`'s Functional Pages principle (calm/simple background stays, but treated as a first-class page, not neglected), when this story touches `loading/page.tsx` and `results/page.tsx`, then it applies a light typography/spacing/button consistency pass across both — matching the new landing page's type scale and button styling (`AnimatedButton`'s hover/tap micro-interaction) — without adopting its richer gradient/dark-section treatment on either page.
4. `[NEW 2026-08-02]` Given PRD FR-6's decision that a plugin whose settings are never researched (currently only DeEsser 2) stays in its true signal-chain position with a "Standard practice" card label rather than being regrouped into a separate section, when the chain is rendered, then that label appears on `DeEsser2Visual`'s own card in its normal list position — this page does not implement any section-splitting logic, the distinction is entirely a per-card concern.

## Tasks / Subtasks

- [ ] Task 1: Add `GET /api/generate/[id]` route (AC: 1, 2)
  - [ ] Create `web/app/api/generate/[id]/route.ts` exporting `GET`, reading the `id` route param and calling `getGenerationById` from `web/lib/store/generationStore.ts` (already built in Story 1.2 — do not modify that module beyond what Story 2.1 will later add for cache lookups).
  - [ ] Return the full `VocalChainResponse` as JSON with `200` if found; `{ error: "Not found" }` with `404` if not.
  - [ ] Add a colocated `route.test.ts` (Vitest, matching `web/app/api/generate/route.test.ts`'s existing pattern) covering: found → 200 with the stored response; unknown id → 404.
- [ ] Task 2: Wire the results page to fetch by id (AC: 1, 4)
  - [ ] In `web/app/results/page.tsx`, replace reading `artist`/`song` search params with reading `id`.
  - [ ] On mount (`useEffect`), if `id` is present, `fetch(`/api/generate/${id}`)`. On success, store the parsed `VocalChainResponse` in local state and render it. On a non-2xx response or thrown error, fall through to the "nothing here" state (Task 3).
  - [ ] Build a small `pluginId -> component` dispatch map (e.g. a `Record` or `switch` keyed on `PluginRegistryEntry.id`, such as `"logic-pro.channel-eq"` → `ChannelEqVisual`) covering all 10 bespoke Visual components in `web/app/components/`. No such dispatcher exists yet — Story 1.3 built 10 separate components but nothing wires a plugin id to the right one. This is new work for this story, not a re-derivation of something Story 1.3 already produced.
  - [ ] Render `chain.plugins` in array order, dispatching each `PluginInstance` through that map (`plugin: pluginRegistry.getById(instance.pluginId)`, `values: instance.controls`). Array order already equals signal-chain order — `generationStage.ts` assigns `order: index + 1` at generation time, and no code alters that ordering downstream — so no separate sort is needed, just iterate the array as returned. `DeEsser2Visual` needs no special handling here for its "Standard practice" label — that's internal to the component itself (AC4).
  - [ ] Delete the entire dummy-preview implementation this story replaces: `PREVIEW_PLUGIN_IDS`, the static `previewPlugins` mapping, and their JSX block. This story's real data path replaces them outright — don't leave them behind as dead code or a fallback.
- [ ] Task 3: "Nothing here" state (AC: 2)
  - [ ] Covers three cases uniformly: missing `id` param, fetch returns 404, or fetch throws (network error). Render a simple, calm message (e.g. "We couldn't find that result.") with a link back to `/` — same minimal-effort bar as Story 1.2's loading-page failure state (PRD's failure-state copy/design is explicitly not finalized yet, §8 Open Question 4 — don't over-invest here).
  - [ ] Never crash: guard against `id` being absent before fetching, and against a malformed/non-JSON response body.
- [ ] Task 4: Typography/spacing/button consistency pass (AC: 3)
  - [ ] On `results/page.tsx` and `loading/page.tsx`: align heading weight/tracking and body text sizing with the landing page's scale (e.g. `font-semibold tracking-tight` headings, `text-sm`/`text-base` body — see `web/app/page.tsx`), and replace plain `<Link>`/`<button>` elements used as primary actions with `AnimatedButton` (`web/app/components/AnimatedButton.tsx`) for its hover/tap micro-interaction — matching the landing page's button feel.
  - [ ] Do **not** change either page's background/gradient (`hero-gradient` stays exactly as-is on both) and do **not** introduce the landing page's white→gold→purple wash or dark storytelling section here — Design System v1.1 scopes that treatment to the landing page only.

## Dev Notes

- **Story 1.3 status as of this revision (2026-08-02): `in-progress`, not done — read this before starting.** All 10 bespoke Plugin Visual components exist in `web/app/components/` (`ChannelEqVisual.tsx`, `CompressorVisual.tsx`, `DeEsser2Visual.tsx`, `ChromaVerbVisual.tsx`, `TapeDelayVisual.tsx`, `PitchCorrectionVisual.tsx`, `OverdriveVisual.tsx`, `FlangerVisual.tsx`, `PhaserVisual.tsx`, `ChorusVisual.tsx`) and render real data correctly — safe to wire this story's fetch/dispatch logic against them now. But 8 of the 10 (everything except Channel EQ and Pitch Correction) have a founder-approved visual redesign validated in `docs/images/spikes/<plugin>/` that is **not yet applied to the live components** (Story 1.3's Task 5, still open). Don't block on Task 5 — this story's job is the fetch/dispatch/routing plumbing, which works the same regardless of which visual revision each component is on. Just don't be surprised if a component's on-screen appearance changes later without this story's code needing to change.
- **No shared `PluginVisual` component exists — there are 10 separate ones, and nothing dispatches between them yet.** The original single-generic-component plan (what this story was originally written against) was reversed early in Story 1.3's design process. Building the `pluginId -> component` dispatch map (Task 2) is new work for *this* story, not something to import from Story 1.3.
- **`formatParameterLabel` coordination — already resolved, no action needed.** It was extracted to `web/lib/format/parameterLabel.ts` during Story 1.3 (all 10 components import from there). `results/page.tsx` should import from the same module if it still needs this formatting anywhere after Task 2's rewrite — don't reintroduce a local copy.
- **The backend pieces this story needs already exist and must not be re-derived:** `VocalChainResponse` (full shape: `id`, `input`, `meta`, `research`, `reasoning`, `chain`, `validation` — `web/lib/schema/vocalChain.ts`), `getGenerationById` (`web/lib/store/generationStore.ts`), and `pluginRegistry.getById` (`web/lib/registry/pluginRegistry.ts`). This story only adds a route and rewires the page — it does not touch the pipeline, schema, or registry.
- **Architecture AD-9 (server-only AI access) does not apply to this story's new route** — `GET /api/generate/[id]` reads from the generation store, not from `lib/ai/*`, so it's not bound by "only `app/api/generate/route.ts` may import `lib/ai/*`." It's fine for this new route file to sit alongside the existing one.
- **Architecture AD-10 (cross-page handoff):** the results page must be the *only* page that reads a full `VocalChainResponse`, fetched by `id` — never accept the full payload via query string or an ad hoc client store. This route is exactly the "e.g. a `GET /api/generate/[id]`-shaped route" AD-10 anticipates.
- **No live-model dependency in this story.** Everything needed (a real, already-generated `VocalChainResponse`) comes from the store Story 1.2 built; this story doesn't call `generateVocalChain` or the model client at all.
- **Testing infra ceiling — same constraint as Stories 1.2 and 1.3.** No component-rendering test infra (jsdom/React Testing Library) exists in `vitest.config.ts`. Do not add one as a side effect of this story. Test the new route with plain Vitest (request in, JSON out — matches `route.test.ts`'s existing pattern); verify the page itself manually via the dev server (a real `/loading?artist=&song=` → `/results?id=...` walkthrough, plus direct navigation to `/results` with no id and with a bogus id).
- **Design tokens:** only the stable set confirmed in Story 1.3's Dev Notes (`text-foreground`, `text-muted`, `text-supporting`, `bg-background`, `text-brand-accent`/`bg-brand-accent`) — never a raw hex or raw Tailwind palette utility, per Architecture AD-6. Do not use the landing page's `--wash-*`/`--vivid-*` exploration tokens on these pages.

### Project Structure Notes

- New file: `web/app/api/generate/[id]/route.ts` (Next.js dynamic route segment, sibling to `web/app/api/generate/route.ts`).
- New test file: `web/app/api/generate/[id]/route.test.ts`.
- Modified: `web/app/results/page.tsx` (real fetch-by-id, `pluginId -> component` dispatch map, "nothing here" state, dummy preview code removed, typography/button pass).
- Modified: `web/app/loading/page.tsx` (typography/button consistency pass only — its fetch/navigation/failure-state logic from Story 1.2 is unchanged).
- Naming: camelCase for `.ts` modules/functions, PascalCase for components — matching every existing module.

### References

- [Source: _bmad-output/planning-artifacts/prds/prd-VocAligner-2026-07-23/prd.md#FR-6, FR-7]
- [Source: _bmad-output/planning-artifacts/architecture/architecture-VocAligner-2026-07-23/ARCHITECTURE-SPINE.md#AD-6, AD-9, AD-10]
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 1: See a Real Vocal Chain, Not a Preview / Story 1.4]
- [Source: _bmad-output/implementation-artifacts/1-2-real-generation-request.md — generationStore, AD-10 handoff pattern established]
- [Source: _bmad-output/implementation-artifacts/1-3-plugin-visual-component.md — the 10 bespoke Visual components, and Task 5's still-open per-plugin redesign work]
- [Source: docs/DESIGN_SYSTEM.md#Plugin Visual Fidelity Standards — DeEsser 2's "Standard practice" card label]
- [Source: web/app/components/ — the 10 bespoke Visual components this story dispatches between]
- [Source: web/app/api/generate/route.ts, web/app/api/generate/route.test.ts — existing route pattern to follow]
- [Source: web/lib/store/generationStore.ts]
- [Source: web/lib/schema/vocalChain.ts]
- [Source: web/lib/registry/pluginRegistry.ts]
- [Source: web/app/results/page.tsx — current dummy-preview implementation being replaced]
- [Source: web/app/loading/page.tsx — current implementation, typography pass only]
- [Source: web/app/page.tsx, web/app/components/AnimatedButton.tsx — typography/button reference for the consistency pass]
- [Source: docs/DESIGN_SYSTEM.md#Functional Pages]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
