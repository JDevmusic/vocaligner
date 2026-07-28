# Story 1.4: Results page renders the real generated chain

Status: ready-for-dev

## Story

As a user,
I want the results page to show the actual chain generated for my request,
so that I can see exactly what to recreate in Logic Pro.

## Acceptance Criteria

1. Given a valid `id` query param on `/results` matching a stored Generation (saved by Story 1.2's `saveGeneration`), when the page loads, then it fetches the full `VocalChainResponse` by that id via a new `GET /api/generate/[id]` route (Architecture AD-10), and renders its plugins in signal-chain order using the `PluginVisual` component (Story 1.3), each showing its real control values.
2. Given no `id` query param, or an `id` that doesn't match any stored Generation (direct navigation, bad link, expired entry, 404 from the route), when the page loads, then the user sees a clear "nothing here" state — never a crash, and never the old hardcoded preview cards.
3. Given `docs/DESIGN_SYSTEM.md`'s Functional Pages principle (calm/simple background stays, but treated as a first-class page, not neglected), when this story touches `loading/page.tsx` and `results/page.tsx`, then it applies a light typography/spacing/button consistency pass across both — matching the new landing page's type scale and button styling (`AnimatedButton`'s hover/tap micro-interaction) — without adopting its richer gradient/dark-section treatment on either page.

## Tasks / Subtasks

- [ ] Task 1: Add `GET /api/generate/[id]` route (AC: 1, 2)
  - [ ] Create `web/app/api/generate/[id]/route.ts` exporting `GET`, reading the `id` route param and calling `getGenerationById` from `web/lib/store/generationStore.ts` (already built in Story 1.2 — do not modify that module beyond what Story 2.1 will later add for cache lookups).
  - [ ] Return the full `VocalChainResponse` as JSON with `200` if found; `{ error: "Not found" }` with `404` if not.
  - [ ] Add a colocated `route.test.ts` (Vitest, matching `web/app/api/generate/route.test.ts`'s existing pattern) covering: found → 200 with the stored response; unknown id → 404.
- [ ] Task 2: Wire the results page to fetch by id (AC: 1)
  - [ ] In `web/app/results/page.tsx`, replace reading `artist`/`song` search params with reading `id`.
  - [ ] On mount (`useEffect`), if `id` is present, `fetch(`/api/generate/${id}`)`. On success, store the parsed `VocalChainResponse` in local state and render it. On a non-2xx response or thrown error, fall through to the "nothing here" state (Task 3).
  - [ ] Render `chain.plugins` in array order using `PluginVisual` (one instance per `PluginInstance`, passed `plugin: pluginRegistry.getById(instance.pluginId)` and `values: instance.controls`). Array order already equals signal-chain order — `generationStage.ts` assigns `order: index + 1` at generation time, and no code alters that ordering downstream — so no separate sort is needed, just iterate the array as returned.
  - [ ] Delete the entire dummy-preview implementation this story replaces: `PREVIEW_PLUGIN_IDS`, the static `previewPlugins` mapping, and their JSX block. This story's real data path replaces them outright — don't leave them behind as dead code or a fallback.
- [ ] Task 3: "Nothing here" state (AC: 2)
  - [ ] Covers three cases uniformly: missing `id` param, fetch returns 404, or fetch throws (network error). Render a simple, calm message (e.g. "We couldn't find that result.") with a link back to `/` — same minimal-effort bar as Story 1.2's loading-page failure state (PRD's failure-state copy/design is explicitly not finalized yet, §8 Open Question 4 — don't over-invest here).
  - [ ] Never crash: guard against `id` being absent before fetching, and against a malformed/non-JSON response body.
- [ ] Task 4: Typography/spacing/button consistency pass (AC: 3)
  - [ ] On `results/page.tsx` and `loading/page.tsx`: align heading weight/tracking and body text sizing with the landing page's scale (e.g. `font-semibold tracking-tight` headings, `text-sm`/`text-base` body — see `web/app/page.tsx`), and replace plain `<Link>`/`<button>` elements used as primary actions with `AnimatedButton` (`web/app/components/AnimatedButton.tsx`) for its hover/tap micro-interaction — matching the landing page's button feel.
  - [ ] Do **not** change either page's background/gradient (`hero-gradient` stays exactly as-is on both) and do **not** introduce the landing page's white→gold→purple wash or dark storytelling section here — Design System v1.1 scopes that treatment to the landing page only.

## Dev Notes

- **🚨 Blocking prerequisite — read this first.** This story depends on **both** Story 1.2 (done, status `review`, merged as commit `f6a3f3b`) and Story 1.3 (`PluginVisual` component). As of this story's creation, **Story 1.3 has not been implemented yet** — no `PluginVisual.tsx` exists anywhere in `web/app/components/`, only its story file (`1-3-plugin-visual-component.md`, status `ready-for-dev`). Story 1.3 must ship first (or in the same session, before this story's Task 2) — this story cannot render real plugin data without that component. Do not stub or reimplement a parallel visual component to avoid the dependency; that would create exactly the "duplicate functionality" this workflow exists to prevent.
- **Coordination risk with Story 1.3 — `formatParameterLabel`.** Story 1.3's own dev notes say to "reuse the existing `formatParameterLabel` helper from `web/app/results/page.tsx`," implying `PluginVisual` imports it directly from the page file. But this story's Task 2 deletes most of that page's current content. **Before writing `PluginVisual`'s import, check whether `formatParameterLabel` still lives in `results/page.tsx` or has already been extracted to a shared module:**
  - If Story 1.3 already shipped and imports it straight from `results/page.tsx`: extract `formatParameterLabel` (and `CATEGORY_LABELS`, if `PluginVisual` also needs it) into a small shared module (e.g. `web/lib/format/parameterLabel.ts`) as part of *this* story, update `PluginVisual`'s import to the new location, and keep `results/page.tsx`'s own usage (if any remains) importing from there too. Don't leave a page-file-importing-from-a-page-file dependency in place.
  - If Story 1.3 hasn't shipped yet: build it (or ask whoever implements it) to import from that same shared module from the start, sidestepping the issue entirely.
- **The backend pieces this story needs already exist and must not be re-derived:** `VocalChainResponse` (full shape: `id`, `input`, `meta`, `research`, `reasoning`, `chain`, `validation` — `web/lib/schema/vocalChain.ts`), `getGenerationById` (`web/lib/store/generationStore.ts`), and `pluginRegistry.getById` (`web/lib/registry/pluginRegistry.ts`). This story only adds a route and rewires the page — it does not touch the pipeline, schema, or registry.
- **Architecture AD-9 (server-only AI access) does not apply to this story's new route** — `GET /api/generate/[id]` reads from the generation store, not from `lib/ai/*`, so it's not bound by "only `app/api/generate/route.ts` may import `lib/ai/*`." It's fine for this new route file to sit alongside the existing one.
- **Architecture AD-10 (cross-page handoff):** the results page must be the *only* page that reads a full `VocalChainResponse`, fetched by `id` — never accept the full payload via query string or an ad hoc client store. This route is exactly the "e.g. a `GET /api/generate/[id]`-shaped route" AD-10 anticipates.
- **No live-model dependency in this story.** Everything needed (a real, already-generated `VocalChainResponse`) comes from the store Story 1.2 built; this story doesn't call `generateVocalChain` or the model client at all.
- **Testing infra ceiling — same constraint as Stories 1.2 and 1.3.** No component-rendering test infra (jsdom/React Testing Library) exists in `vitest.config.ts`. Do not add one as a side effect of this story. Test the new route with plain Vitest (request in, JSON out — matches `route.test.ts`'s existing pattern); verify the page itself manually via the dev server (a real `/loading?artist=&song=` → `/results?id=...` walkthrough, plus direct navigation to `/results` with no id and with a bogus id).
- **Design tokens:** only the stable set confirmed in Story 1.3's Dev Notes (`text-foreground`, `text-muted`, `text-supporting`, `bg-background`, `text-brand-accent`/`bg-brand-accent`) — never a raw hex or raw Tailwind palette utility, per Architecture AD-6. Do not use the landing page's `--wash-*`/`--vivid-*` exploration tokens on these pages.

### Project Structure Notes

- New file: `web/app/api/generate/[id]/route.ts` (Next.js dynamic route segment, sibling to `web/app/api/generate/route.ts`).
- New test file: `web/app/api/generate/[id]/route.test.ts`.
- Modified: `web/app/results/page.tsx` (real fetch-by-id, `PluginVisual` rendering, "nothing here" state, dummy preview code removed, typography/button pass).
- Modified: `web/app/loading/page.tsx` (typography/button consistency pass only — its fetch/navigation/failure-state logic from Story 1.2 is unchanged).
- Possible new file (see Dev Notes coordination risk): `web/lib/format/parameterLabel.ts` — only if `formatParameterLabel` needs extracting out of `results/page.tsx`.
- Naming: camelCase for `.ts` modules/functions, PascalCase for components — matching every existing module.

### References

- [Source: _bmad-output/planning-artifacts/prds/prd-VocAligner-2026-07-23/prd.md#FR-6, FR-7]
- [Source: _bmad-output/planning-artifacts/architecture/architecture-VocAligner-2026-07-23/ARCHITECTURE-SPINE.md#AD-6, AD-9, AD-10]
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 1: See a Real Vocal Chain, Not a Preview / Story 1.4]
- [Source: _bmad-output/implementation-artifacts/1-2-real-generation-request.md — generationStore, AD-10 handoff pattern established]
- [Source: _bmad-output/implementation-artifacts/1-3-plugin-visual-component.md — PluginVisual contract, blocking prerequisite]
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
