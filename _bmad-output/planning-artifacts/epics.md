---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-VocAligner-2026-07-23/prd.md
  - _bmad-output/planning-artifacts/architecture/architecture-VocAligner-2026-07-23/ARCHITECTURE-SPINE.md
  - docs/DESIGN_SYSTEM.md
---

# VocAligner - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for VocAligner, decomposing the requirements from the PRD and Architecture Spine (no formal `bmad-ux` document exists; `docs/DESIGN_SYSTEM.md` is used in its place for visual/UX requirements) into implementable stories.

**Brownfield note:** most of this system already exists in code (Milestone 4, Phases 1–4a). Stories below are scoped to what's actually left to build, per the PRD's §6.0 Current Implementation Status and the Architecture Spine's Capability → Architecture Map — not a from-scratch rebuild.

## Requirements Inventory

### Functional Requirements

FR1: A user can enter an Artist Input and a Song Input and submit a Generation request; the "Generate Vocal Chain" control is disabled until both are non-empty. No genre restriction — any artist/song is in scope.
FR2: The system researches the vocal production characteristics of the target Artist + Song before generating a chain, rather than generating directly from raw input text.
FR3: The system generates a Vocal Chain composed only of plugins/parameters present in the Plugin Registry; if a candidate fails validation, the system retries generation at least once before failing.
FR4: If a Vocal Chain has already been generated for an identical Artist + Song pair, the system returns the Cached Result instead of invoking the AI again.
FR5: If the system cannot produce a Plugin-Registry-valid chain after retrying, the user sees an explicit failure state rather than an incomplete/invalid/silently-wrong chain.
FR6: A user can view the generated Vocal Chain as an ordered sequence of Plugin Visuals (Logic-style graphical representations — knobs, toggles, meters), each showing that plugin's settings, in the order Logic Pro would apply them.
FR7: Each control in a Plugin Visual displays its literal value only (a numeric parameter or toggle position) — no inline rationale/explanation text in MVP.

### NonFunctional Requirements

The PRD deliberately has no formal NFR section (confirmed appropriate for this stage by its quality review — no boilerplate NFR theater). The closest things to cross-cutting quality requirements live in the Architecture Spine's invariants and the PRD's Non-Goals, folded into Additional Requirements below rather than invented here. Two worth calling out explicitly since they constrain every story that touches them:

NFR1: AI generation requests must always be made server-side; the Anthropic API key must never be exposed to the client (Architecture AD-9; `CLAUDE.md`).
NFR2: No rate-limiting/abuse-prevention exists in MVP — a conscious, flagged risk (PRD §5, §8), not a requirement to build against yet.

### Additional Requirements

*From the Architecture Spine — no starter template applies (brownfield, Next.js app already exists). These are the enforceable rules stories must not violate:*

- **AD-1**: App-derived bookkeeping fields (`order`, `wasRepaired`, intent `id`) are never requested from the model — computed immediately by whichever stage/gate produces them. Any future code changing `plugins[]` cardinality must renumber `order` in the same place.
- **AD-2**: Only `*ModelClient.ts` files may import a provider SDK; all AI calls go through the `ModelClient` interface.
- **AD-3**: Validation gate classifies `valid` / `repaired` (numeric clamp) / `rejected` (unknown plugin/control); only `valid`/`repaired` chains ever leave `generateVocalChain`. String/boolean control *value* validation isn't built — out of scope until separately decided.
- **AD-4**: Every domain type is a Zod schema once; TS types always via `z.infer`.
- **AD-5**: `pluginRegistry` is the closed world; every `logicPro.ts` entry must have `tier: "stock"` — no `free-3rd-party`/`commercial` entries without a deliberately scoped expansion.
- **AD-6**: Design tokens are centralized in `globals.css`; new visual work adds a `--color-*` token first, then a semantic class — never a raw hex value or raw Tailwind palette utility (`zinc-*`, `black/`, etc.).
- **AD-7**: Cache is global, keyed by normalized (trim + lowercase) Artist + Song text — no fuzzy/typo matching in MVP.
- **AD-8**: A cache lookup must also match `PIPELINE_VERSION` + `PROMPT_VERSION`, so a structural/prompt change invalidates stale entries.
- **AD-9**: Only `app/api/generate/route.ts` may import `lib/ai/*`; pages/components reach generation only over HTTP.
- **AD-10**: Cross-page result handoff is by opaque `id` only (never the full payload in a URL or an ad hoc client store); the results page fetches the full `VocalChainResponse` by id from the same store the cache uses; a cache hit replays the stored response unmodified except `meta.cacheHit`.

*Deferred by the Architecture Spine (do NOT become stories in this pass — noted so nothing is silently lost):* deployment target/environments, cache storage technology (in-memory/Redis/DB), rate-limiting mechanism, Confidence Score UI surfacing (schema already has an unused `confidence` field), string/boolean control value validation, an `ObserveStage` consumer (logging/metrics), cleanup of existing un-tokenized Tailwind utilities in `page.tsx`/`loading/page.tsx`/`results/page.tsx`, swapping the hardcoded (superseded) Anthropic model id, bespoke per-plugin Visual designs, authentication/accounts.

### UX Design Requirements

*No formal `bmad-ux` document exists. Extracted from `docs/DESIGN_SYSTEM.md` and the PRD's Plugin Visual definition (§3, §4.3) instead:*

UX-DR1: Each plugin in the results page is rendered as a Plugin Visual (Logic-style graphical representation), using **one default visual treatment** for MVP, modeled on the reference Compressor plugin UI (`docs/images.md/Compressor_plugin.png`) — not bespoke per-plugin-type visuals.
UX-DR2: All new UI work uses only the centralized design tokens/semantic Tailwind classes already established (`text-foreground`, `text-muted`, `text-supporting`, `bg-background`, `hero-gradient`) — never a raw hex value or raw Tailwind palette utility, per Architecture AD-6.
UX-DR3 *(revised 2026-07-24 — supersedes the original two-field/light-hero assumption, per `docs/DESIGN_SYSTEM.md` v1.1)*: Landing page hero is an asymmetric two-column layout — dominant headline left, brief inspiring description right — over a white→sunset-gold→deep-purple gradient (not the pale wash used elsewhere). Artist/Song input is a single centered sentence ("Match **[artist]** on **[song]**, in Logic Pro"), smaller and secondary to the headline, not two stacked labeled fields. Below the hero, a dark "Meet VocAligner" section (continuing the gradient into near-black, white text) delivers the "how it works" explanation as brief intro copy + three vertically-stacked numbered stage cards — this *is* the how-it-works requirement, just restyled, not dropped.
UX-DR4: Visual tone follows the Design System throughout: the fuller white→gold→purple wash and dark storytelling section are landing-page-only; `loading`/`results` keep the simpler existing sunset-to-white gradient. Generous whitespace, calm/premium feel, no more than one primary CTA per screen. Animations via the `motion` library — subtle scroll-reveal fades/lifts, never flashy — and must respect `prefers-reduced-motion`.
UX-DR6 *(new)*: Brand mark is `web/app/components/Mark.tsx` (a "VA" monogram), paired with the wordmark in navigation.
UX-DR7 *(resolved 2026-07-24)*: A real footer is wanted for MVP, landing page only — per `docs/DESIGN_SYSTEM.md`'s new Footer section: brand mark + wordmark, a copyright line, and a one-line "not affiliated with Apple" trademark disclaimer. No links to not-yet-real pages (Privacy/Terms/Contact) — add those when they exist, not before.
UX-DR5: The failure state (FR-5) needs real copy and visual design — explicitly not designed yet (PRD `[NOTE FOR PM]`, §8 Open Question 4).

### FR Coverage Map

FR1: Epic 1 - Submit an Artist + Song Generation request
FR2: Epic 1 - Research stage (against mock model); hardened to real research by Epic 3
FR3: Epic 1 - Registry-constrained generation + retry (against mock model); hardened to real generation by Epic 3
FR4: Epic 2 - Cached results for repeat identical requests
FR5: Epic 1 - Explicit failure state when a valid chain can't be produced
FR6: Epic 1 - Results page renders the chain as ordered Plugin Visuals
FR7: Epic 1 - Plugin Visual controls show literal values only

## Epic List

### Epic 1: See a Real Vocal Chain, Not a Preview
Users who submit an Artist + Song get back an actual generated, validated Vocal Chain — rendered as real Plugin Visuals with real settings — replacing today's fake preview/placeholder pages end-to-end (landing → loading → results). Still runs on the mock AI model under the hood; that's Epic 3's job. This is the single biggest gap between "the product looks finished" and "the product works."
**FRs covered:** FR1, FR2, FR3, FR5, FR6, FR7
**Also implements:** Architecture AD-1, AD-3, AD-4, AD-5, AD-6, AD-9, AD-10 (id-based result handoff — needed here even before real caching, since the results page needs *a* way to fetch its result by id)
**Design System requirements baked into every story's acceptance criteria, not a separate epic:** UX-DR1 through UX-DR4 (Plugin Visual default treatment, tokens-only styling, landing page composition, overall tone) — this is where the founder's "make it crisp" priority actually lands.
**Implementation note (revised 2026-07-29 — reverses the original "one generic component" decision):** each of the 10 registry plugins gets its own bespoke Plugin Visual matching its real Logic Pro panel, not one generic knob-grid template reused across all types. The founder reversed the original decision after reviewing real Logic Pro screenshots for all 10 plugins and finding a generic treatment didn't read as premium or trustworthy — see `docs/DESIGN_SYSTEM.md`'s Plugin Visual Fidelity Standards and `docs/plugin-references.md` for the resulting build rules and per-plugin ground-truth data. 8 of the 10 (Compressor, DeEsser 2, ChromaVerb, Tape Delay, Overdrive, Flanger, Phaser, Chorus) are still knob-based and stay within the existing flat-control data shape, just styled/proportioned per plugin — no schema change. Channel EQ (a computed frequency-response curve, real filter-response math) and Pitch Correction (a scale-aware keyboard, driven by a new registry `key` field and a music-theory interval-pattern lookup) needed real engineering beyond styling, and were validated through an iterative static-mockup process before component code was written — see Architecture's Deferred section for the specific technical rules that process surfaced.
**Design priority (per `docs/DESIGN_SYSTEM.md`'s Functional Pages section):** this component is the product's actual payoff moment — where "premium" has to be true, not just claimed on the landing page. It earns the same design care as the landing hero, not a lower bar because it sits on a "functional" page.

### Epic 2: Repeat Requests Are Instant and Free
Asking for a chain that's already been generated for the exact same Artist + Song — by anyone — comes back instantly, with no new AI call. Pure backend addition; no UI changes required.
**FRs covered:** FR4
**Also implements:** AD-7, AD-8
**Depends on:** Epic 1 (reuses the id/store mechanism Epic 1 builds for AD-10)

### Epic 3: Real AI-Researched Chains (Live Anthropic Cutover)
The chain a user receives is genuinely researched from real information about the artist/song, not simulated by the mock model. Swaps `getModelClient()` from mock to the already-built Anthropic adapter. This is the natural point to also revisit the hardcoded (superseded) model id and consciously decide on the rate-limiting/cost-exposure risk already flagged as a non-goal — not solving it, just making sure it's a deliberate choice at the moment real API costs turn on. Also the moment env vars/API-key setup actually happens — flagged for extra care and explanation per the founder's beginner-guidance note.
**FRs covered:** none new — hardens FR2/FR3 from simulated to real
**Also implements:** AD-2 (already-adopted rule this epic must not violate, not a new one)
**Depends on:** Epic 1 (the real pipeline has to be reachable and displayed before "is it real AI" matters)

*Not included as epics (explicitly out of MVP scope per the PRD): Save Vocal Chain, Dry Vocal upload, Confidence Scores, Interactive Plugin Visuals, Plugin Variant selection (e.g. Compressor circuit types), accounts/auth/payments.*

---

## Epic 1: See a Real Vocal Chain, Not a Preview

Users who submit an Artist + Song get back an actual generated, validated Vocal Chain — rendered as real Plugin Visuals with real settings — replacing today's fake preview/placeholder pages end-to-end. Still runs on the mock AI model; that's Epic 3.

### Story 1.1: Promote the converged landing page design into production

*(Revised 2026-07-24 — originally scoped as "add a missing footer" against the old landing page; superseded once the founder converged on a new direction through live design-preview iteration. See `docs/DESIGN_SYSTEM.md` v1.1.)*

As a visitor,
I want the landing page I actually see to be the design the founder converged on (not the old placeholder, not a throwaway preview route),
So that the product's first impression matches what's actually been decided.

**Acceptance Criteria:**

**Given** the converged design currently lives only at `/design-preview` (`DesignH.tsx` hero + `MeetSection.tsx`)
**When** this story is done
**Then** that composition is what renders at `/` (the real landing page) — hero (asymmetric two-column, white→gold→purple gradient, single-sentence Artist+Song input) followed by the dark "Meet VocAligner" how-it-works section
**And** the Artist+Song input is wired to real submission (the mockup's form currently does `event.preventDefault()` and the button says "Preview only" — this story makes it actually call `handleGenerate`/navigate to `/loading`, matching what the old `page.tsx` already did)

**Given** the design is promoted to production
**When** this story is done
**Then** the throwaway `/design-preview` route (and its now-unused sibling files — check `DesignPreviewClient.tsx`, `AnimatedButton.tsx`, `motion-shared.ts` for anything still needed vs. safe to delete) is removed, per its own "delete once aligned" note
**And** `loading/page.tsx` and `results/page.tsx` are confirmed untouched — they intentionally keep the older, simpler gradient (Design System v1.1 explicitly scopes the new palette to the landing page only)

**Given** any markup this story touches
**When** it's styled
**Then** it follows Architecture AD-6 exactly as refreshed: semantic tokens for flat colors, `--wash-*` custom properties via inline `style` for the multi-stop gradients (never a raw hex or raw Tailwind palette utility), and no confusion between shadcn's `--accent`/`--muted` and the brand's `--brand-accent`/`text-muted`

**Given** the founder wants a footer for MVP (UX-DR7, resolved 2026-07-24)
**When** this story implements it
**Then** it adds a reusable `Footer` component (brand mark + wordmark, a copyright line, and a one-line "not affiliated with Apple / Logic Pro is an Apple trademark" disclaimer), placed on the landing page only
**And** it does NOT link to Privacy/Terms/Contact or any other page that doesn't exist yet

### Story 1.2: Loading page performs a real generation request

As a user who just submitted an artist and song,
I want the app to actually generate a real vocal chain for my request,
So that what I see next is real, not a placeholder.

**Acceptance Criteria:**

**Given** valid `artist`/`song` query params on `/loading`
**When** the page mounts
**Then** it POSTs to `/api/generate` with `{ artist, song }`

**Given** a successful response
**When** it arrives
**Then** the full `VocalChainResponse` is stored, retrievable by its `id` (a minimal id-keyed store — this is the store Epic 2 later extends with artist+song cache lookups, per Architecture AD-10)
**And** the app navigates to `/results?id=<id>`

**Given** the request fails, times out, or the pipeline exhausts its retries (FR5)
**When** that happens
**Then** the user sees an explicit failure state on the loading page (not a silent hang, and not a navigation to a broken results page)
**And** they have a clear way to try again

### Story 1.3: Build the reusable Plugin Visual component

As a user viewing my results,
I want each plugin shown as a Logic-style visual (not a plain settings list),
So that it's immediately recognizable as "what I'll build in Logic Pro."

**Acceptance Criteria:**

**Given** a plugin's registry definition and a set of control values (matching the real `PluginRegistryEntry`/`ControlValue` schema shapes)
**When** the relevant Plugin Visual renders them
**Then** it draws a bespoke visual matching that specific plugin's real Logic Pro panel (`docs/images.md/*_plugin.png` per plugin, ground-truth data in `docs/plugin-references.md`), styled in VocAligner's own design tokens — `[REVISED 2026-07-29]` supersedes the original "one generic component for all types" approach; see `docs/DESIGN_SYSTEM.md`'s Plugin Visual Fidelity Standards for the build rules this reversal settled on
**And** every control shows its literal value only (no rationale/explanation text — FR7)
**And** for Channel EQ and Pitch Correction specifically — the two plugins whose real UI isn't knob-based — the visual is verified against a dedicated neutral/rest-state check (all values at Logic's own defaults) before being verified against applied example data

**Given** this component is built and tested against sample/fixture data
**When** built
**Then** it has no dependency yet on a live Generation — that wiring is Story 1.4

### Story 1.4: Results page renders the real generated chain

As a user,
I want the results page to show the actual chain generated for my request,
So that I can see exactly what to recreate in Logic Pro.

**Acceptance Criteria:**

**Given** a valid `id` query param on `/results` matching a stored Generation (from Story 1.2)
**When** the page loads
**Then** it fetches the full `VocalChainResponse` by that id (e.g. a `GET /api/generate/[id]`-shaped route, per Architecture AD-10)
**And** renders its plugins in signal-chain order using the `PluginVisual` component from Story 1.3, each showing its real control values

**Given** an `id` that doesn't match any stored Generation (direct navigation, bad link, expired entry)
**When** the page loads
**Then** the user sees a clear "nothing here" state — never a crash, and never the old hardcoded preview cards

**Given** `docs/DESIGN_SYSTEM.md`'s Functional Pages principle (calm/simple background stays, but treated as a first-class page, not neglected)
**When** this story touches `loading/page.tsx` and `results/page.tsx`
**Then** it applies a light typography/spacing/button consistency pass across both — matching the new landing page's type scale and button styling — without adopting its richer gradient/dark-section treatment on either page

---

## Epic 2: Repeat Requests Are Instant and Free

Asking for a chain that's already been generated for the exact same Artist + Song comes back instantly, with no new AI call. Pure backend addition — depends on Epic 1's store, no UI changes.

### Story 2.1: Serve cached results for identical Artist + Song requests

As a user (or anyone) requesting a chain that's already been generated,
I want the result back instantly,
So that I don't wait for AI generation again, and no AI cost is incurred a second time.

**Acceptance Criteria:**

**Given** a prior successful Generation exists for the normalized (trim + lowercase) Artist + Song pair, generated under the current `PIPELINE_VERSION` and `PROMPT_VERSION`
**When** a new request arrives for that same pair
**Then** the stored `VocalChainResponse` is returned unmodified except `meta.cacheHit` set to `true` — `id` and `generatedAt` stay exactly as originally generated (Architecture AD-7/AD-8/AD-10)
**And** no call is made to the model client

**Given** no matching cache entry (new pair, or a `PIPELINE_VERSION`/`PROMPT_VERSION` mismatch from a prior entry)
**When** the request arrives
**Then** a normal fresh generation proceeds exactly as today, and its result is stored under that key for future lookups

---

## Epic 3: Real AI-Researched Chains (Live Anthropic Cutover)

The chain a user receives is genuinely researched, not simulated. Swaps `getModelClient()` from the mock to the already-built Anthropic adapter. Depends on Epic 1 (the real pipeline must be reachable and displayed before "is it real AI" matters).

### Story 3.1: Switch to the real Anthropic model client

As a user,
I want my vocal chain to come from genuine AI research about the artist/song,
So that the recommendation is actually accurate, not simulated.

**Acceptance Criteria:**

**Given** an `ANTHROPIC_API_KEY` is configured in the server environment (a new `.env.local` entry — never committed to git; this story includes clearly explaining what this file is and why, per the founder's noted unfamiliarity with env/secrets handling)
**When** `getModelClient()` is called
**Then** it returns the real Anthropic-backed client instead of the mock

**Given** no `ANTHROPIC_API_KEY` is configured (e.g. a fresh local checkout)
**When** `getModelClient()` is called
**Then** it falls back to the mock client so local development still works without requiring a key

**Given** this story ships live AI calls for the first time
**When** it's implemented
**Then** the hardcoded, superseded `DEFAULT_MODEL` id in `anthropicModelClient.ts` is consciously updated to a current model
**And** the founder is explicitly reminded that no rate-limiting/abuse-prevention exists yet (confirmed non-goal, PRD §5/§8) — not solved by this story, but not allowed to be an accidental surprise either
