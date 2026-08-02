# Story 1.4: Results page renders the real generated chain

Status: in-progress

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

- [x] Task 1: Add `GET /api/generate/[id]` route (AC: 1, 2)
  - [x] Create `web/app/api/generate/[id]/route.ts` exporting `GET`, reading the `id` route param and calling `getGenerationById` from `web/lib/store/generationStore.ts` (already built in Story 1.2 — do not modify that module beyond what Story 2.1 will later add for cache lookups).
  - [x] Return the full `VocalChainResponse` as JSON with `200` if found; `{ error: "Not found" }` with `404` if not.
  - [x] Add a colocated `route.test.ts` (Vitest, matching `web/app/api/generate/route.test.ts`'s existing pattern) covering: found → 200 with the stored response; unknown id → 404.
- [x] Task 2: Wire the results page to fetch by id (AC: 1, 4)
  - [x] In `web/app/results/page.tsx`, replace reading `artist`/`song` search params with reading `id`.
  - [x] On mount (`useEffect`), if `id` is present, `fetch(`/api/generate/${id}`)`. On success, store the parsed `VocalChainResponse` in local state and render it. On a non-2xx response or thrown error, fall through to the "nothing here" state (Task 3).
  - [x] Build a small `pluginId -> component` dispatch map (e.g. a `Record` or `switch` keyed on `PluginRegistryEntry.id`, such as `"logic-pro.channel-eq"` → `ChannelEqVisual`) covering all 10 bespoke Visual components in `web/app/components/`. No such dispatcher exists yet — Story 1.3 built 10 separate components but nothing wires a plugin id to the right one. This is new work for this story, not a re-derivation of something Story 1.3 already produced.
  - [x] Render `chain.plugins` in array order, dispatching each `PluginInstance` through that map (`plugin: pluginRegistry.getById(instance.pluginId)`, `values: instance.controls`). Array order already equals signal-chain order — `generationStage.ts` assigns `order: index + 1` at generation time, and no code alters that ordering downstream — so no separate sort is needed, just iterate the array as returned. `DeEsser2Visual` needs no special handling here for its "Standard practice" label — that's internal to the component itself (AC4).
  - [x] Delete the entire dummy-preview implementation this story replaces: `PREVIEW_PLUGIN_IDS`, the static `previewPlugins` mapping, and their JSX block. This story's real data path replaces them outright — don't leave them behind as dead code or a fallback.
- [x] Task 3: "Nothing here" state (AC: 2)
  - [x] Covers three cases uniformly: missing `id` param, fetch returns 404, or fetch throws (network error). Render a simple, calm message (e.g. "We couldn't find that result.") with a link back to `/` — same minimal-effort bar as Story 1.2's loading-page failure state (PRD's failure-state copy/design is explicitly not finalized yet, §8 Open Question 4 — don't over-invest here).
  - [x] Never crash: guard against `id` being absent before fetching, and against a malformed/non-JSON response body.
- [x] Task 4: Typography/spacing/button consistency pass (AC: 3)
  - [x] On `results/page.tsx` and `loading/page.tsx`: align heading weight/tracking and body text sizing with the landing page's scale (e.g. `font-semibold tracking-tight` headings, `text-sm`/`text-base` body — see `web/app/page.tsx`), and replace plain `<Link>`/`<button>` elements used as primary actions with `AnimatedButton` (`web/app/components/AnimatedButton.tsx`) for its hover/tap micro-interaction — matching the landing page's button feel.
  - [x] Do **not** change either page's background/gradient (`hero-gradient` stays exactly as-is on both) and do **not** introduce the landing page's white→gold→purple wash or dark storytelling section here — Design System v1.1 scopes that treatment to the landing page only.

### Review Findings

- [ ] [Review][Decision] Primary navigation actions lost native `<a>` semantics when converted to `AnimatedButton` — "Try Again" (`loading/page.tsx`), "Try Another Song" and "Back to Home" (`results/page.tsx`) were all `<Link href="/">` before this story and are now `<AnimatedButton onClick={() => router.push("/")}>`, rendering a `motion.button`. This is exactly what Task 4 asked for (replace plain `<Link>`/`<button>` primary actions with `AnimatedButton`), but it's a real, user-facing regression on all three: no more cmd/ctrl-click or middle-click to open in a new tab, no right-click "copy link address," no hover-preview URL, no navigation if JS fails to load, and a weaker semantic element for assistive tech. Needs an explicit founder call — options: (a) accept as-is, this is what the story asked for; (b) extend `AnimatedButton` to optionally render as `motion.a` when given an `href` (preserving native anchor behavior *and* the hover/tap micro-interaction) and use that form for these three pure-navigation cases; (c) revert these three specific instances back to plain `<Link>` and skip the micro-interaction there. [web/app/loading/page.tsx:89-95, web/app/results/page.tsx (Back to Home / Try Another Song)]
- [x] [Review][Patch] Fetched response body trusted via a bare `as VocalChainResponse` cast instead of runtime schema validation — a malformed-but-valid-JSON response (e.g. missing `input`/`chain`) would have thrown an uncaught error instead of falling into the "nothing here" state Task 3 requires ("guard against a malformed... response body," "never crash") [web/app/results/page.tsx] — fixed: now runs `vocalChainResponseSchema.safeParse` on the fetched body and falls into the existing error state on failure.
- [x] [Review][Patch] `status`/`chainResponse` weren't reset when `id` changed after mount (e.g. browser back/forward between two different `/results?id=` entries without a full remount) — the previous id's stale data could stay on screen with no loading indicator while the new fetch was in flight [web/app/results/page.tsx] — fixed: replaced the separate `status`/`chainResponse` state with a single `result` value tagged by the id it was fetched for; the render path derives "loading" whenever `result.id !== id`, so a changed id is never left showing stale data.
- [x] [Review][Patch] React key used `instance.order`, which `pluginInstanceSchema` only constrains to be a positive int, not unique — two plugin instances sharing an order value would collide on React keys [web/app/results/page.tsx:124] — fixed: keyed by array index instead, safe by construction of `.map`.
- [x] [Review][Patch] `id` was interpolated unencoded into the fetch URL [web/app/results/page.tsx:80] — fixed: wrapped in `encodeURIComponent`.
- [x] [Review][Patch] `loading/page.tsx`'s response-id guard (`typeof body?.id !== "string"`) let an empty string through, silently navigating to `/results?id=` and showing "not found" instead of the loading page's own error state [web/app/loading/page.tsx:62] — fixed: guard now also rejects `body.id.length === 0`.
- [x] [Review][Patch] `AnimatedButton`'s `title` tooltip on the loading page's error state read "Try Again" while the visible button text read "Try again" — capitalization mismatch introduced by this diff [web/app/loading/page.tsx:89-95] — fixed: tooltip now matches the visible text exactly.
- [x] [Review][Patch] `LoadingState` and `NothingHereState` duplicated identical wrapper markup verbatim in the same file, against the project's own "don't duplicate UI" principle [web/app/results/page.tsx] — fixed: extracted a shared `ResultsStatusShell` wrapper; also added a `console.warn` when a plugin id has no registry/dispatch-map match so a silently-skipped plugin is at least visible in the console for debugging.
- [x] [Review][Defer] In-memory `generationStore` (module-level `Map`) won't survive a `GET` landing on a different server instance than the `POST` that saved it (serverless/edge/multi-worker deploys) — deferred, pre-existing: explicitly authorized by Story 1.2's own Dev Notes as "in-memory is correct for now" at the architecture level; this story only depends on it, doesn't introduce it [web/lib/store/generationStore.ts].
- [x] [Review][Defer] Same store has no TTL/eviction — unbounded memory growth for the process lifetime — deferred, same pre-existing Story 1.2 architecture decision as above [web/lib/store/generationStore.ts].
- [x] [Review][Defer] No `aria-live`/`role="status"` announcement on either page's loading/error state transitions — deferred: matches the existing pattern already present on `loading/page.tsx` since Story 1.2 (plain `<p>`), not newly introduced by this story, and no design-system/architecture doc currently mandates it.
- [x] [Review][Defer] An empty `chain.plugins` array would render a "successful"-looking results page with no plugin cards and no messaging — deferred: nothing in the schema guarantees non-emptiness; this is an upstream generation-pipeline invariant question, outside this story's fetch/dispatch scope.
- [x] [Review][Defer] Task 4's typography pass was only partially applied to `loading/page.tsx` — the `<Link>`→`AnimatedButton` swap happened, but no heading/body-text sizing changes were made — deferred: soft finding, the page has no true heading element to begin with (only a `text-lg`/`sm:text-xl` phase-status line already close to the landing page's body scale).

Dismissed as noise or already-handled (5): `chain.plugins` rendered in raw array order without a separate sort (verified against `generationStage.ts:44`'s `order: index + 1`, assigned deterministically from array position with nothing downstream reordering — matches this story's own Dev Notes claim exactly, not a bug); all three failure paths collapsing into one "nothing here" message (explicitly directed by Task 3's own text, "same minimal-effort bar... don't over-invest here"); a duplicated test-fixture-seeding helper between the two route test files (matches this story's own stated approach of following the sibling `route.test.ts`'s existing pattern); `GET /api/generate/[id]` doing no `id` format validation (harmless — a garbage id is just a `Map.get` miss that correctly 404s); the results page's background departing from Task 4's literal "hero-gradient stays exactly as-is" text (self-documented as a founder-confirmed decision in this story's own Dev Notes, and superseded again by a later, separately-approved, separately-documented commit — `a86b9db`, DESIGN_SYSTEM.md v1.15 — before this review even started; current code is sound, uses AD-6-compliant CSS custom properties, doesn't reintroduce the landing page's richer wash).

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

Claude Sonnet 5

### Debug Log References

- `npx tsc --noEmit`, `npx eslint .`, `npx vitest run` all clean (67/67 tests, up from 65 — 2 new tests for the `[id]` route).
- Confirmed this Next.js version's dynamic route param convention (`params: Promise<{ id: string }>`) directly against `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md` before writing the route, per `web/AGENTS.md`'s warning that this version's APIs may differ from training data — not assumed from memory.
- Manual dev-server verification (`npm run dev`): seeded a real generation via `curl -X POST /api/generate` (Frank Ocean / Thinkin Bout You → Channel EQ, Compressor, DeEsser 2, ChromaVerb), then screenshotted `/results?id=<real-id>` — confirmed all 4 plugins render through the dispatch map with real data (Compressor's Threshold/Ratio/Attack/Release, ChromaVerb's Decay/Dry/Wet), and specifically confirmed DeEsser 2's "Standard practice" badge and PRD §8.9 always-faded-at-default override both render correctly in the real page context (not just the Story 1.3 verification route). Also screenshotted `/results` (no id) and `/results?id=bogus` — both correctly show the "nothing here" state via the two different guard paths (missing param vs. 404 response) without crashing.
- Full click-driven `/` → `/loading` → `/results` walkthrough not scripted end-to-end (no local Playwright package installed for interactive scripting, only the CLI screenshot tool) — instead verified equivalently: `loading/page.tsx`'s `router.push(\`/results?id=${body.id}\`)` navigation logic was not touched by this story (only its error-state button changed), and direct navigation to that same URL shape was confirmed working above, so the two are functionally identical.

### Completion Notes List

- Task 1: `GET /api/generate/[id]/route.ts` follows the existing `POST /api/generate/route.ts` pattern exactly — reads `getGenerationById`, returns 200/404. Test file seeds a real generation by calling the sibling route's `POST` directly (same approach `route.test.ts` itself uses for its own persistence test) rather than hand-building a `VocalChainResponse` fixture.
- Task 2: the dispatch map is a plain `Record<string, PluginVisualComponent>` — all 10 Story 1.3 components share an identical `{ plugin, values }` prop signature (confirmed directly, not assumed), so no per-plugin wrapper or type gymnastics were needed. Chain rendering skips a plugin entry if either the registry or dispatch-map lookup misses, rather than crashing — defensive, though it shouldn't happen with valid registry-sourced ids.
- Task 2: `PREVIEW_PLUGIN_IDS`/`previewPlugins`/`CATEGORY_LABELS` and the old preview-card JSX deleted outright, no fallback left behind. `CATEGORY_LABELS` had no other purpose — every Visual component already renders its own `plugin.category` (CSS-uppercased), so a separate friendly-label map wasn't needed even before removal.
- Task 3: three failure paths (missing `id`, non-2xx fetch, thrown/parse error) collapse into one `status: "error"` state rendered by a single `NothingHereState` component, visually matching `loading/page.tsx`'s existing error-state treatment (`hero-gradient`, centered `Wordmark`, message, link home) for consistency between the two pages' equivalent states.
- **Background decision (confirmed with the founder before implementing):** switched the results page's main background from plain `bg-background` to `hero-gradient` — Design System's Functional Pages section explicitly says "the existing sunset-to-white gradient" applies to Loading & Results pages, and this story's own Task 4 guardrail text ("hero-gradient stays exactly as-is on both") presumes it was already on both; it wasn't. Confirmed this reads as a deliberate omission worth fixing, not scope creep, since the gradient fades to white by 65% scroll depth — visually it only affects the area directly behind the Wordmark/heading, not the long list of white plugin cards below.
- Task 4: `AnimatedButton` (`web/app/components/AnimatedButton.tsx`) had no `onClick` prop — it had only ever been used for form submission on the landing page. Added an optional `onClick`, threaded straight to the underlying `motion.button`. Both pages' "Try Another Song"/"Try again" affordances now call `router.push("/")` from it; each page kept its own existing visual treatment (results' pill-button style, loading's underlined-text style) — this was a hover/tap-feel pass per the story's own scoping, not a redesign unifying the two.

### File List

- `web/app/api/generate/[id]/route.ts` (new)
- `web/app/api/generate/[id]/route.test.ts` (new)
- `web/app/results/page.tsx` (rewritten — fetch-by-id, dispatch map, "nothing here" state, `hero-gradient` background, dummy-preview code removed)
- `web/app/loading/page.tsx` (small edit — "Try again" swapped to `AnimatedButton`)
- `web/app/components/AnimatedButton.tsx` (small edit — added optional `onClick` prop)
