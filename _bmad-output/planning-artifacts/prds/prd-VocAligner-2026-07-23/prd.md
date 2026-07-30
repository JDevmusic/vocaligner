---
title: VocAligner
status: final
created: 2026-07-23
updated: 2026-08-01
---

# PRD: VocAligner
*Working title — confirmed, matches product name in all existing docs.*

## 0. Document Purpose

This PRD is the source-of-truth product definition for VocAligner, for use by the founder (Pilki, also the sole engineer) and any downstream BMad workflows (Architecture, Epics & Stories, Sprint Planning). It builds on existing project documentation rather than duplicating it: `docs/PRODUCT.md` (mission), `docs/ARCHITECTURE.md` (engineering principles), `docs/DESIGN_SYSTEM.md` (visual/brand system), `docs/USER_FLOW.md` (flow reference), and `docs/principles.md` (decision hierarchy) all remain authoritative for their domains — this document is structured around Glossary-anchored vocabulary, features grouped with functional requirements (FRs) nested underneath, and inline `[ASSUMPTION]` tags wherever a gap was filled without direct confirmation (indexed in §9). **Read §6.0 before §4 or §6.1** — this is a brownfield project and §6.0 states what's already built versus still to do; treating §4/§6.1 as a from-scratch spec will cause redundant re-scoping.

## 1. Vision

VocAligner helps Logic Pro users recreate the vocal production style of their favourite artists using only Logic Pro's own stock plugins. Many producers know exactly how they want a vocal to sound — they just don't know which plugins to reach for, what order to chain them in, or how to set them. VocAligner closes that gap: type an artist and a song, and it researches the vocal production of that recording and returns a ready-to-recreate Logic Pro stock plugin chain with specific settings.

The objective is not simply to generate plugin chains. It is to help creators achieve better vocals with confidence — a distinction that matters throughout this document: chain accuracy, simplicity, and trustworthiness outrank AI sophistication for its own sake. `docs/principles.md` states this outright as a decision hierarchy (product quality > user understanding > architecture > maintainability > AI capability) and the mantra "never optimise for AI, always optimise for helping producers."

Long-term, `docs/project.md` frames the ambition beyond the MVP: to "become the leading AI vocal engineering assistant" by combining AI research, production knowledge, and personalised vocal analysis. The MVP described in this PRD is the first, deliberately narrow step toward that.

Competitive scan (see memlog) found no existing product that does this specifically — tools like MixingGPT, iZotope Neutron/Nectar, and reference-matching plugins all analyze the *user's own* audio against a reference; none take a named artist + song as a style prompt and output a Logic-stock-only recipe. Static Logic-stock vocal-chain preset packs exist (genre-based), but none are AI-generated or artist-specific. This is a genuine gap, not a crowded space.

## 2. Target User

### 2.1 Jobs To Be Done

- As a Logic Pro user of any skill level (bedroom producer, independent artist, songwriter, content creator, or a mixing beginner), I want to know which stock plugins and settings will get my vocal closer to a specific artist's sound, so I don't have to guess or trawl tutorials.
- As a producer who already knows *what* I want to sound like but not *how* to get there, I want a confident starting point I can tweak from, not a black-box "final" mix.
- As someone who doesn't own or want third-party plugins, I want a recipe I can fully execute with what Logic Pro already gives me.

### 2.2 Non-Users (v1)

- Users on DAWs other than Logic Pro (explicitly out of scope — see §5).
- Users wanting forensic/scientific accuracy about the original recording engineer's exact settings — VocAligner produces a stylistic recreation using stock-plugin equivalents, not a claim of what was actually used on the master.
- Users wanting third-party or paid plugin recommendations.
- Users wanting the system to process their own audio in v1 (dry vocal upload is a named future feature — see §5, §6.2).

### 2.3 Key User Journeys

- **UJ-1. Jordan matches a reference sound for a friend's track.**
  - **Persona + context:** Jordan, a bedroom producer finishing a friend's EP, knows they want the lead vocal to sit like a specific recent single but has never touched a de-esser with intent.
  - **Entry state:** Unauthenticated, arrives at the VocAligner landing page directly (no account needed — see §5).
  - **Path:** Reads the hero and how-it-works copy → types the artist and song into the two inputs → clicks "Generate Vocal Chain" → sees a loading state while VocAligner researches the track and builds a chain.
  - **Climax:** The results page shows an ordered, Logic-style plugin chain (e.g. Channel EQ → Compressor → DeEsser 2 → ChromaVerb) with specific settings for each — Jordan immediately sees a concrete, followable recipe rather than vague advice.
  - **Resolution:** Jordan manually recreates the chain plugin-by-plugin inside their own Logic Pro session using the displayed settings as a starting point.
  - **Edge case:** If VocAligner cannot produce a validated chain after retrying internally, Jordan sees a clear failure state and can try again rather than receiving an invalid or incomplete chain. `[ASSUMPTION: exact failure-state UX not yet designed — flagged in §8]`

- **UJ-2. Jordan revisits the same request later.** Jordan (or anyone) re-submits the exact same Artist + Song a week later and gets the identical chain back instantly, with no wait and no new AI cost, because it was already generated once. `[ASSUMPTION: cache match is exact artist+song text, case-insensitive — no fuzzy matching in MVP, see §8]`

## 3. Glossary

- **Vocal Chain** — An ordered sequence of Logic Pro stock plugins, each with specific parameter settings, generated to recreate the vocal production style of a target Artist + Song.
- **Artist Input / Song Input** — The two free-text fields a user submits to request a Vocal Chain.
- **Generation** — One end-to-end request/response cycle: a user submits an Artist Input + Song Input and the system returns a Vocal Chain (or a failure state).
- **Cached Result** — A previously generated Vocal Chain served again for an identical Artist Input + Song Input pair, without invoking the AI a second time.
- **Stock Plugin** — A plugin that ships natively with Logic Pro. VocAligner never recommends a third-party or paid plugin.
- **Plugin Registry** — The maintained, canonical list of Stock Plugins and their valid parameters that a Vocal Chain is constrained to draw from; a Vocal Chain is invalid if it references anything outside it.
- **Dry Vocal** *(future, not MVP)* — An unprocessed vocal recording a user uploads so a Vocal Chain can be tailored to their specific voice rather than generically to the target Artist + Song.
- **Save Vocal Chain** *(future, not MVP)* — Persisting a Generation for later retrieval by the user who created it.
- **Confidence Score** *(future, not MVP)* — A per-chain or per-setting indicator of how confident the system is in a recommendation, named in `docs/PRODUCT.md`'s future vision but not yet designed.
- **Setting Rationale Hover** *(future, not MVP)* — Hovering over a plugin control reveals a short explanation of why that value was chosen. MVP shows literal values only, no rationale text.
- **Interactive Plugin Visual** *(future, not MVP)* — A Plugin Visual (see below) a user can directly adjust in-browser, rather than a display-only reference. Named as a future direction in `docs/principles.md`.
- **Plugin Visual** — The graphical, Logic-style representation of a single plugin in a Vocal Chain (knobs, toggles, meters laid out like the plugin's own Logic Pro UI), as opposed to a plain text/numeric settings list.
- **Plugin Variant** *(future, not MVP)* — A named sub-model of a plugin that has more than one (e.g. Compressor's Studio FET, Vintage Opto, etc. — not every plugin has variants). Future scope: each variant carries a human-authored sonic-character description (same pattern as the existing per-plugin `education` data); the AI matches the target song's research findings against these descriptions to pick the best-fit variant, rather than researching plugin behavior itself. MVP always uses a plugin's default/generic behavior with no variant selection.

## 4. Features

### 4.1 Artist & Song Input

**Description:** The landing page presents a hero, a short "how it works" explanatory section (per `docs/Inspiration.md` and the Design System's "what is this / why should I care" rule), two free-text inputs (Artist, Song), a single primary "Generate Vocal Chain" call-to-action, and a footer. This is the sole entry point into the product — no account, no browsing, no other input method. Realizes UJ-1.

**Functional Requirements:**

#### FR-1: Submit a Generation request

A user can enter an Artist Input and a Song Input and submit a Generation request. Realizes UJ-1.

**Consequences (testable):**
- The "Generate Vocal Chain" control is disabled until both Artist Input and Song Input are non-empty (whitespace-only does not count).
- Free text is accepted for both fields — no autocomplete, spellcheck-against-a-database, or genre selector in MVP. `[ASSUMPTION: no genre restriction — confirmed by founder, any artist/song is in scope for MVP]`

**Out of Scope:**
- Validating that the artist or song actually exists.
- Any account, login, or saved history of past inputs.

### 4.2 AI Vocal Chain Generation

**Description:** On submission, the system researches the target recording's vocal production characteristics, reasons about what that implies for a Logic-stock-only signal chain, and generates a Vocal Chain — constrained end-to-end to the Plugin Registry so every result is actually recreatable in Logic Pro. Realizes UJ-1, UJ-2.

**Functional Requirements:**

#### FR-2: Research before generating

The system researches the vocal production characteristics of the target Artist + Song before generating a chain, rather than generating directly from the raw input text. Realizes UJ-1.

**Consequences (testable):**
- The user sees a loading/progress state for the duration of research + generation, communicating that real work is happening (not an instant canned response).

**Notes:** `[NOTE FOR PM]` No testable check exists for whether this step actually found real information about an obscure or misspelled Artist + Song — only downstream Plugin Registry validity is checked (FR-3/FR-5), not research adequacy. A chain built on thin-to-no research could still pass validation and reach the user looking authoritative. Known limitation for MVP, not solved here — see §8.

#### FR-3: Generate a Plugin-Registry-constrained chain

The system generates a Vocal Chain composed only of plugins and parameters present in the Plugin Registry.

**Consequences (testable):**
- A returned Vocal Chain never references a plugin or setting absent from the current Plugin Registry.
- If a candidate chain fails validation against the Plugin Registry, the system retries generation at least once before surfacing a failure to the user (see FR-5).

#### FR-4: Serve cached results for repeat requests

If a Vocal Chain has already been generated for an identical Artist Input + Song Input pair, the system returns the Cached Result rather than invoking the AI again. Realizes UJ-2.

**Consequences (testable):**
- Repeat identical requests resolve without incurring a new AI generation call.
- The response indicates whether it was served from cache. `[ASSUMPTION: match is exact text, case-insensitive; no fuzzy/typo matching in MVP — open question in §8]`

#### FR-5: Fail clearly, never silently wrong

If the system cannot produce a Plugin-Registry-valid chain after retrying, the user sees an explicit failure state rather than an incomplete, invalid, or silently-wrong chain.

**Consequences (testable):**
- No Vocal Chain is ever displayed to the user unless it has passed Plugin Registry validation.

**Notes:** `[NOTE FOR PM]` The failure-state UX (copy, retry affordance) isn't designed yet — worth a pass alongside the "crisp design" push the founder wants to prioritize next.

### 4.3 Results Display

**Description:** The generated Vocal Chain is displayed as an ordered sequence of Plugin Visuals — graphical, Logic-style representations of each plugin — mirroring how the plugins would actually stack in Logic Pro's own channel strip, so the user can recreate it manually. Realizes UJ-1.

**Functional Requirements:**

#### FR-6: Display the chain in signal-chain order as Plugin Visuals

A user can view the generated Vocal Chain as an ordered sequence of Plugin Visuals, each showing that plugin's settings, in the order Logic Pro would apply them.

**Consequences (testable):**
- Plugin order shown matches the actual signal chain order (first plugin in the list is first in the signal path).
- Each plugin is rendered using a Plugin Visual rather than a plain text list. `[REVISED 2026-07-29 — supersedes the original "one generic visual template" assumption]` Each of the 10 registry plugins gets its own bespoke visual matching its real Logic Pro panel — not one generic knob-grid template reused across all types. This reversal was made deliberately by the founder after reviewing real Logic Pro screenshots for all 10 plugins and finding a generic treatment didn't read as premium or trustworthy — see `docs/DESIGN_SYSTEM.md`'s Plugin Visual Fidelity Standards section for the resulting build rules, and `docs/plugin-references.md` for per-plugin ground-truth reference data (default values, ranges, and for Channel EQ/Pitch Correction specifically, the algorithmic rules needed since they aren't simple knob layouts). Two plugins — Channel EQ (a computed frequency-response curve) and Pitch Correction (a scale-aware keyboard) — required real engineering beyond styling (filter-response math, music-theory interval lookups); the other 8 stay knob-based, just styled/proportioned to match their real panel.
- Each plugin's settings are specific enough (not vague ranges) that a user can input them directly into Logic Pro's own plugin UI.
- `[DECISION — 2026-08-01]` A plugin whose settings are never researched per song (currently only DeEsser 2 — see §8.9) stays in its true signal-chain position, never regrouped into a separate section — order in the list must always match order in the signal path, with no exceptions, since de-essing (and similarly order-sensitive processing) placed out of position would change how the chain actually sounds if rebuilt as displayed. The distinction is communicated with a small "Standard practice" label on that plugin's own Plugin Visual card instead — see `docs/DESIGN_SYSTEM.md`'s Plugin Visual Fidelity Standards. (Considered and rejected: a separate "Researched" / "Standard practice" section split, which would have required re-deriving and displaying each plugin's true chain position a second time just to stay safe to rebuild from — more complexity in exactly the place a mistake is costly, for a visual distinction a card-level label already communicates.)

#### FR-7: Show literal values only, no rationale text

Each control in a Plugin Visual displays its literal value (a numeric parameter or toggle position) only.

**Consequences (testable):**
- No inline explanatory/rationale text accompanies a setting in MVP. Setting Rationale Hover (see Glossary) is confirmed future scope, not MVP — see §5, §6.2.

**Out of Scope:**
- Exporting or importing a Logic Pro session/preset file — the user recreates the chain manually in MVP.
- Interactive/adjustable Plugin Visuals — display-only in MVP (see Interactive Plugin Visual, Glossary).
- Rationale/explanation text or hover interactions on any control.

## 5. Non-Goals (Explicit)

- VocAligner does not support any DAW other than Logic Pro.
- VocAligner never recommends third-party or paid plugins — Stock Plugins only, always.
- VocAligner does not process a user's own audio in v1 — no dry vocal upload, no personalisation to a specific voice. This is a confirmed future feature with no target milestone yet (see §6.2).
- VocAligner does not support user accounts, authentication, or payments in v1.
- VocAligner does not let users save, revisit, or manage a history of past Generations in v1 — confirmed by founder as deferred, planned to land once live Anthropic integration is in place (see §6.2), not MVP.
- VocAligner does not include community features (ratings, shared/public presets) in v1.
- VocAligner does not display Confidence Scores for generated chains in v1 — named future feature, not yet designed.
- `[NON-GOAL for MVP]` VocAligner does not implement rate-limiting or abuse-prevention on the Generation endpoint in v1. This is a free, unauthenticated, free-text form that will eventually call a paid AI provider per request — a conscious, near-term cost exposure for a solo founder, not an oversight. Revisit before or immediately after live Anthropic integration ships (see §8).
- `[NON-GOAL for MVP]` VocAligner does not select a specific Plugin Variant (e.g. Compressor's Studio FET vs. Vintage Opto) in v1 — every recommended plugin uses its default/generic behavior. Confirmed future feature (see Glossary); founder deliberately parked it rather than folding it into MVP or fast-following, to keep the core loop (Epic 1) shipping first.
- Plugin Visuals are display-only, values-only in v1 — see FR-6/FR-7 Out of Scope for the specifics (Interactive Plugin Visual, Setting Rationale Hover are the named future features).

## 6. MVP Scope

### 6.0 Current Implementation Status

*This is a brownfield project — most of the generation pipeline already exists in code. Downstream Architecture/Epics work should build from this, not re-derive it from the repo or re-scope what's already done.*

| Capability | Status |
|---|---|
| FR-1 — Artist/Song input, "how it works" section | Built (landing page) |
| FR-1 — Footer | Not built |
| FR-2 — Research stage | Built (`web/lib/ai/stages/researchStage.ts`), running against the mock model client |
| FR-3 — Registry-constrained generation + retry | Built (`generationStage.ts`, `pluginRegistry.ts`, `repairChain.ts`) |
| FR-4 — Cache | Not built — `cacheHit` exists in the schema but is hardcoded `false`; no cache store exists |
| FR-5 — Fail-clearly validation gate | Built at the pipeline level (`generateVocalChain.ts`); the results page is not yet wired to the real API, so there's no live failure-state UX yet |
| FR-6/FR-7 — Plugin Visuals, literal values | Not built — the current results page is a static placeholder (dummy plugin cards, no real values, no visual treatment), not yet connected to a Generation |
| Live Anthropic integration | Adapter built and committed (`anthropicModelClient.ts`), but not wired in — `getModelClient()` still hard-returns the mock client |

### 6.1 In Scope

- Landing page: hero, "how it works" explanatory section, Artist Input, Song Input, single Generate CTA, footer (FR-1).
- AI research + reasoning + generation pipeline producing a Plugin-Registry-valid Vocal Chain (FR-2, FR-3, FR-5).
- Caching of identical Artist + Song requests (FR-4).
- Results page displaying the ordered chain as Plugin Visuals using one default visual treatment, literal values only (FR-6, FR-7).
- Loading/progress state between submission and result.

### 6.2 Out of Scope for MVP

- Save Vocal Chain — deferred, planned to land once live Anthropic integration is in place. Note: the Anthropic adapter itself is already built (see §6.0) — only the `getModelClient()` wiring and Cache (FR-4) are the actual remaining blockers, so this doesn't need to wait on Save Vocal Chain being scoped or designed. `[NOTE FOR PM]` Founder flagged this pairing explicitly; revisit scope once mock→live AI cutover work starts.
- Dry Vocal upload + voice-personalized suggestions — deferred, no target milestone yet beyond "future."
- Confidence Scores — deferred, not yet designed.
- Interactive Plugin Visuals and Setting Rationale Hover — see FR-6/FR-7 Out of Scope (§4.3).
- Bespoke per-plugin-type visuals — MVP reuses one default visual treatment across all plugin types.
- Plugin Variant selection (e.g. Compressor circuit types, ChromaVerb algorithms) — every plugin uses its default behavior; no variant is chosen or displayed.
- User accounts, authentication, payments — per `CLAUDE.md`, not implemented "unless specifically requested."
- Other DAWs, community ratings/shared presets, project export/import.

## 7. Success Metrics

The founder's near-term priority is a working local MVP with a crisp, premium-feeling design — not scale or revenue metrics yet, though a real public launch is the eventual goal (per `docs/MILESTONES.md`: public beta → premium subscription → v1.0). Metrics below are placeholders reflecting that stage, not agreed KPIs. `[ASSUMPTION]`

**Primary**
- **SM-1**: The founder personally uses VocAligner as their first stop when starting a vocal chain, instead of guessing or searching tutorials. Validates FR-3, FR-6. `[ASSUMPTION]`

**Secondary**
- **SM-2**: A generated chain requires only minor manual tweaking (not a full rebuild) to sound reasonable in a real session. Validates FR-3. `[ASSUMPTION]`

**Counter-metrics (do not optimise)**
- **SM-C1**: Do not optimise for chain complexity or novelty (more plugins, more exotic settings) at the expense of simplicity and recreatability — directly counter to the "premium, calm, never overwhelming" design principle. Counterbalances SM-1, SM-2.

## 8. Open Questions

1. What counts as a cache match — exact text only, or should common spelling/typo variants of the same Artist + Song resolve to the same Cached Result? (Relates to FR-4.)
2. Is the Generation cache global (shared across all users/requests) or scoped some other way? Affects cost, and whether "the same request" can ever mean something different for different users. `[ASSUMPTION: current schema/architecture implies a global cache — see docs/ROADMAP.md's pending "Cache" item — confirm before Architecture phase]`
3. No pricing or tier structure exists yet for the eventual "Premium subscription" (`docs/MILESTONES.md` M9) — not urgent now, but will need its own decision before that milestone.
4. What does the failure state (FR-5) actually say and look like to the user? Not designed yet.
5. No numeric success target exists (§7 is placeholder) — revisit once there's real usage to measure.
6. FR-2's research step has no adequacy check — nothing currently distinguishes "found real production detail" from "found almost nothing" before a chain is generated. Known limitation, not solved in MVP; revisit if obscure/misspelled inputs turn out to produce noticeably worse chains in practice.
7. Rate-limiting/abuse-prevention on the Generation endpoint is a conscious MVP omission (see §5) — revisit timing once live Anthropic integration ships, since that's when free-text requests start costing real money per call.
8. What happens when research identifies a real production technique with no equivalent in the current Plugin Registry (e.g. a modulation effect like flanger/chorus — none of the six current stock plugins cover this family)? Confirmed direction: the system omits that step from the chain rather than substituting an unrelated plugin or implying an accuracy it doesn't have — silent omission over a confidently-wrong recreation, consistent with the trustworthiness principle in §1. Registry coverage is expected to grow organically as real songs surface real gaps (see Architecture Deferred), not from a speculative up-front audit. A "closest available substitute, explicitly flagged as an estimate" UX is a plausible future direction, but it's blocked on the already-deferred Confidence Score / Setting Rationale Hover features (§6.2) — shipping the substitution without that flag would read as more accurate than it is. Not yet an explicit rule at the prompt/reasoning level (discovered 2026-07-26 via live research on Tame Impala's "Feels Like We Only Go Backwards" surfacing a flanger technique with no registry match).
9. `[DECISION — 2026-08-01]` DeEsser 2's settings (Threshold, Max Reduction, Frequency) are never researched/generated per song — they always render at Logic's own sensible defaults, faded, same treatment as an untouched Channel EQ band. Reasoning: unlike stylistic choices (reverb character, EQ brightness, compression amount) that a real mix's production is describable and researchable, de-essing amount is corrective — it reacts to the actual sibilance level of a specific vocal take (performer, mic, room), which VocAligner has no way to know without analyzing the user's own recording. Presenting a specific per-song Threshold/Max Reduction value as "researched" would be the same false-precision problem already avoided elsewhere (§8.8, Confidence Score deferral). The plugin's *presence* in a generated chain (when reasoning decides sibilance control is warranted) remains legitimate, honest, standard-practice guidance — only its specific numeric settings are pinned to default. This also gives the deferred Dry Vocal Upload feature (Glossary, §6.2) a concrete, well-motivated value proposition: precise, take-specific de-essing (and similar corrective processing) becomes possible only once the system can hear the user's actual vocal — see Architecture Deferred for the resulting UI/generation-pipeline implication.

## 9. Assumptions Index

- §2.3 UJ-1 — exact failure-state UX not yet designed.
- §2.3 UJ-2 / §4.2 FR-4 — cache match assumed exact-text, case-insensitive, no fuzzy matching in MVP.
- §4.1 FR-1 — no genre restriction, confirmed by founder as intentional for MVP.
- §4.3 FR-6 — `[SUPERSEDED 2026-07-29]` originally assumed one generic Plugin Visual template reused across all plugin types for MVP, with bespoke per-plugin visuals deferred to later. Reversed by the founder after reviewing real Logic Pro screenshots for all 10 registry plugins — each plugin now gets a bespoke visual matching its real panel, confirmed as in-scope for MVP, not deferred. See `docs/DESIGN_SYSTEM.md` and `docs/plugin-references.md`.
- §7 — all Success Metrics are placeholders, not agreed KPIs, reflecting the founder's stated near-term priority (local-working MVP + design) over scale metrics.
- §8.2 — cache scope (global vs. per-user) assumed global based on current schema/architecture, not explicitly confirmed.
- §8.8 — registry coverage gaps (e.g. songs needing modulation effects like flanger/chorus with no current stock-plugin equivalent) are treated as an accepted, permanent limitation of a Logic-stock-only product, not a defect to eliminate; the system omits an unrepresentable step rather than substituting a misleading approximation. `[ASSUMPTION]`
