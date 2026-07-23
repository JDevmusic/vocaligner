---
name: 'VocAligner — Adversarial Review of ARCHITECTURE-SPINE.md'
type: review
target: '_bmad-output/planning-artifacts/architecture/architecture-VocAligner-2026-07-23/ARCHITECTURE-SPINE.md'
method: 'adversarial divergence attack — construct two units that each obey every AD to the letter yet build incompatibly'
created: '2026-07-23'
---

# Adversarial Review — ARCHITECTURE-SPINE.md

## Method

For each attack below I construct two (or three) concrete future stories/implementers, show that each one can point to specific spine text and claim full compliance, and then show the two results don't fit together — a clashing data shape, two owners of the same field, a conflicting mutation path, or a Rule whose wording admits two incompatible readings. Every attack is grounded in the actual code under `web/lib/` and `web/app/`, not a hypothetical file structure. Nitpicks (typos, missing examples, stylistic quibbles) are excluded — only genuine build-time divergence is reported.

Six holes found. Each includes the recommended AD to close it.

---

## Hole 1 — No contract for how a `VocalChainResponse` crosses the loading→results page boundary (FR-6/FR-7)

**Attacks:** the "State & cross-cutting" convention ("state crosses pages via URL query params") + AD-9's page/route boundary.

### The setup
Today `app/page.tsx` → `app/loading/page.tsx` → `app/results/page.tsx` only pass `artist`/`song` strings through `URLSearchParams`. Neither `loading/page.tsx` nor `results/page.tsx` calls `/api/generate` yet — `results/page.tsx` renders a hardcoded preview from `pluginRegistry`, not a real `VocalChainResponse` (confirmed in code and in the PRD's own status table: "FR-6/FR-7 — Not built... not yet connected to a Generation"). This is exactly the boundary FR-6/FR-7 stories will build next.

`VocalChainResponse` (`web/lib/schema/vocalChain.ts`) is not small: it nests `research` (genre, vocal characteristics, dynamic profile, tonal balance, spatial character, an array of `commonEffects`, an array of `productionNotes`), `reasoning.processingIntents[]` (each with an `observation` and `goal` free-text string), and `chain.plugins[]` (each with a `rationale` string and a `controls[]` array). A realistic 5-6 plugin chain easily produces multiple KB of JSON.

### Two spine-compliant, incompatible readings
- **Story A** — the loading page POSTs to `/api/generate`, gets the `VocalChainResponse`, and navigates to `/results?data=<encodeURIComponent(JSON.stringify(response))>`. This literally satisfies "state crosses pages via URL query params" — it's a URL query param. It also satisfies AD-9 (only the API route calls `lib/ai/*`). It breaks in practice: many browsers/proxies/Next.js's own router cap URL length well under what a real chain serializes to, and it needlessly regurgitates full AI output (plus this now-current-session-only research/reasoning text) into browser history and any server access logs.
- **Story B** — the loading page POSTs, gets back `{ id, ... }`, stores the full response in a module-level `Map` (or `sessionStorage`) keyed by `id`, and navigates to `/results?id=<id>`. This also satisfies "state crosses pages via URL query params" (only the `id` crosses) and AD-9. It silently introduces a new, undocumented in-memory store that isn't the FR-4 cache (a `Map` in a client bundle can't survive a hard refresh/direct link to `/results?id=...`; a module-level `Map` in a Next.js server process is not guaranteed to survive across serverless invocations either), and it's never named anywhere in the Structural Seed.
- **Story C** — `results/page.tsx` becomes the caller: it re-POSTs to `/api/generate` itself using `artist`/`song` from the query string, relying on the FR-4 cache to make the repeat call free. This also satisfies the same two spine passages, but it makes the results page's correctness *silently depend on FR-4 shipping first* — a dependency the Capability → Architecture Map never states (FR-6/FR-7's row lists only AD-5, AD-6, not AD-7/AD-8), and it doubles real AI spend on every reload/back-navigation until the cache lands.

All three are literal readings of "state crosses pages via URL query params" — the spine never says what "state" is allowed to mean (a two-string form input vs. a full generation result), nor gives any resultId/fetch-by-id contract. Three implementers would each build a different, non-interoperable results page.

### Recommended fix
Add an AD, e.g. **"Cross-page result handoff is by opaque id, not by payload"**: the loading page passes only `?id=<generation id>` to `/results`; `results/page.tsx` is the only page that ever re-reads the full `VocalChainResponse`, and it does so by calling a `GET /api/generate/[id]`-shaped route (or equivalent) backed by the same cache/store FR-4 introduces — never by re-serializing the whole response into a URL, and never by inventing a second, ad hoc client-side store. This also forces FR-4's storage decision to double as the results-page fetch mechanism, closing Hole 2 at the same time.

---

## Hole 2 — Cache placement and cache-hit bookkeeping semantics are unresolved for FR-4

**Attacks:** AD-1 ("orchestrator owns bookkeeping"), AD-7, AD-8, and the Capability → Architecture Map's placement note for FR-4.

### The setup
`generateVocalChain.ts` currently always sets `cacheHit: false` and always computes a fresh `id` (via `randomUUID()`) and `generatedAt` (`new Date().toISOString()`) "immediately after the model call returns," per AD-1's own wording. The Capability Map says the new cache layer sits "between `app/api/generate/route.ts` and `generateVocalChain.ts`" — i.e., neither wholly inside the route nor wholly inside the orchestrator.

### Two spine-compliant, incompatible readings
AD-1's rule is explicitly anchored to "the model call returns" — but a cache hit has no model call. The spine never says what happens to `id`/`generatedAt`/`meta` on a hit, so two FR-4 implementations can each claim AD-1 compliance while doing opposite things:
- **Story A** treats a cache hit as "replay the stored response verbatim, only flip `cacheHit` to `true`." This requires the cache to store the *entire* `VocalChainResponse` (including its original `id`), so a given cached generation always has the same `id` — useful for Hole 1's fetch-by-id scheme, and for any future "share this chain" link.
- **Story B** treats a cache hit as "reuse only the validated `Chain` from the cache, then run the normal AD-1 orchestrator bookkeeping step (`randomUUID()`, fresh `generatedAt`) as if a new generation had happened, since the orchestrator is what 'computes and attaches those fields' per AD-1." This produces a new `id`/`generatedAt` on every repeat request for the same artist/song — the opposite of Story A — and makes `id` useless as a stable handle for anything downstream (e.g., Hole 1's Story B/C).

Both are literal readings of AD-1 (which never states an id-stability guarantee) and both satisfy AD-7/AD-8 (which only fix the *key*, not what's stored under it, nor whether `meta` is replayed or regenerated). They produce API responses with different, and differently-relied-upon, `id` semantics for what a caller would consider "the same result."

### Recommended fix
Tighten AD-1 or add a new AD-10 **"Cache hits replay a stored `VocalChainResponse` unmodified except `cacheHit`"**: the cache stores complete `VocalChainResponse` objects (not just `Chain`); a hit returns the stored object with `meta.cacheHit` set to `true` and every other field — including `id` and `generatedAt` — untouched from the original generation. This also fixes which module owns the cache (a thin layer the orchestrator or route calls before doing any stage work, per the Capability Map), removing the "is it inside `generateVocalChain.ts` or in front of it" ambiguity.

---

## Hole 3 — AD-5's "closed world" doesn't actually pin `logicPro.ts` to stock-only entries

**Attacks:** AD-5, in combination with the Deferred section's own flag about `PluginTier`.

### The setup
`pluginTierSchema` (`web/lib/domain/registry.ts`) is `z.enum(["stock", "free-3rd-party", "commercial"])` — not `z.enum(["stock"])` — even though CLAUDE.md and the PRD state stock-only is a *permanent* non-goal, not an MVP-only restriction. The Deferred section already names this as a live risk ("flagging so it's a conscious choice, not an oversight, next time someone touches the registry") but never converts it into a Rule. AD-5's actual Rule text is: *"New plugins are added as entries in `logicPro.ts`, never hardcoded into a prompt or stage."* It says nothing about what `tier` those entries may carry.

### Two spine-compliant, incompatible readings
- **Contributor A**, asked to add a new stock Logic Pro plugin, adds an entry to `rawEntries` in `logicPro.ts` with `tier: "stock"` — obviously correct, and the only path AD-5 sanctions ("New plugins are added as entries in `logicPro.ts`").
- **Contributor B**, asked to prototype a "here's what a free 3rd-party alternative would sound like" comparison (a plausible near-future extension — nothing in the spine forbids it, and `pluginTierSchema` already has the value ready to use), adds entries to the *same* `rawEntries` array in the *same* `logicPro.ts` file with `tier: "free-3rd-party"`. This is the literal path AD-5 names ("entries in `logicPro.ts`") — AD-5 never says entries in that file must all be `tier: "stock"`. Today's hardcoded `REGISTRY_CONTEXT = { daw: "logic-pro", tier: "stock" }` in `generateVocalChain.ts` would filter these out of generation — but any other future consumer of `pluginRegistry` (a debug/admin view, a new pipeline mode, a second `REGISTRY_CONTEXT` introduced by a different story) that doesn't happen to hardcode `tier: "stock"` would now surface non-stock plugins from the one file the spine calls "the only source of valid plugins" and "the closed world."

Nothing in AD-5 is violated by Contributor B — yet the two contributions leave the registry in a state where "is `logicPro.ts` guaranteed stock-only" depends on reading prose in the Deferred section, not an enforceable Rule.

### Recommended fix
Tighten AD-5's Rule: *"Every entry in `logicPro.ts` must have `tier: 'stock'`; `pluginTierSchema`'s other members are reserved for a future DAW/tier expansion and must not appear in this file until that expansion is deliberately scoped."* Alternatively, split `pluginTierSchema` down to `z.enum(["stock"])` for MVP and reintroduce the wider enum only when a non-stock feature is actually scoped — removing the temptation entirely rather than just flagging it.

---

## Hole 4 — AD-3's repaired/rejected classification is illustrative, not exhaustive — string/boolean controls have no defined outcome

**Attacks:** AD-3.

### The setup
`repairChain.ts` only range-checks and clamps controls whose registry `ControlDefinition.type === "number"`. For `"string"`/`"boolean"` controls, the current code checks only that the *parameter name* exists in the registry (`registry.getControlDefinition(...)` returning `undefined` → `rejected`) — it never validates the *value* itself, because `controlDefinitionSchema` (`web/lib/registry/types.ts`) has no `allowedValues`/enum field to validate a string control against. AD-3's Rule text gives exactly two worked examples: *"repaired (numeric out-of-range → clamp, continue)"* and *"rejected (unknown plugin/control → discard, retry generation...)"* — introduced with "classifies every issue as," which reads as a closed taxonomy but is only ever demonstrated for the numeric and existence cases.

### Two spine-compliant, incompatible readings
Suppose a future story adds value-checking for string controls (e.g., validating a mode-select parameter that only Logic Pro's actual UI allows a few named values for) — a natural hardening of FR-3. Given an invalid string value:
- **Story A** classifies it as `rejected` (discard candidate, retry generation) — reasoning by analogy to "unknown plugin/control": an out-of-domain value is, functionally, an unknown control state.
- **Story B** classifies it as `repaired` (substitute the registry's `default` for that control, continue) — reasoning by analogy to the numeric clamp case: "when possible, fix it and continue" is the whole point of the `repaired` bucket, and a default substitution is no less mechanical than a numeric clamp.

Both are defensible readings of AD-3's literal words; neither contradicts the Rule as written, because the Rule never actually says the numeric/existence pair are the *only* two repair mechanisms, or that non-numeric issues default to one bucket or the other. The two stories produce different retry counts, different `validation.issues` semantics, and different end-user chains for the same underlying model mistake.

### Recommended fix
Extend AD-3's Rule into an exhaustive table covering every `ControlType` (`number`, `string`, `boolean`) × failure mode (out-of-range, unrecognized/invalid value, wrong JS type) → `valid`/`repaired`/`rejected`, and require any new `ControlDefinition` field needed to detect "invalid value" (e.g., an `allowedValues` list for string controls) to be added to `registry/types.ts` at the same time the check is added — not left as a same-file, ad hoc convention each contributor reinvents.

---

## Hole 5 — AD-1's "orchestrator owns bookkeeping" already doesn't match the code, and excludes the one module a natural repair extension would need to touch

**Attacks:** AD-1 (Binds list + Rule text).

### The setup
AD-1's Rule says: *"The orchestrator computes and attaches those fields [e.g. `order`] immediately after the model call returns."* But in the real code, `order` is computed inside `runGenerationStage` (`web/lib/ai/stages/generationStage.ts`, line 44: `plugins.map((plugin, index) => ({ ...plugin, order: index + 1, ... }))`) — a **stage**, not `generateVocalChain.ts` (the orchestrator). AD-1's Binds list is `lib/ai/stages/*`, `generateVocalChain.ts` — so the code isn't in violation of the Binds list, but it does contradict the Rule's own stated division of labor ("stages own generation, the orchestrator owns bookkeeping" — yet a stage is the one assigning the bookkeeping field).

This isn't just a documentation nit: it matters for the next natural extension of AD-3's repair path. FR-5 ("fail clearly") currently rejects the *whole chain* if any plugin/control is unknown. A very plausible hardening — drop only the offending plugin instance and continue, rather than discarding the entire generation — lives naturally in `repairChain.ts`. But dropping an instance from `plugins[]` breaks the invariant FR-6 depends on ("Plugin order shown matches the actual signal chain order") unless the remaining instances' `order` fields are renumbered to stay contiguous.

### Two spine-compliant, incompatible readings
- **Story A** renumbers `order` inside `repairChain.ts`, where the drop decision is made — the natural place to keep the invariant local to the code that broke it. AD-1's Binds list doesn't mention `repairChain.ts` at all, so nothing in AD-1 forbids this — but it directly contradicts AD-1's *stated principle* that stages/orchestrator (not the validation gate) own bookkeeping fields like `order`.
- **Story B**, reading AD-1's principle literally ("the orchestrator computes and attaches those fields"), keeps `repairChain.ts` untouched and instead has `generateVocalChain.ts` re-derive `order` from whatever `repairChain.ts` returns, after validation runs — matching AD-1's text, but requiring the orchestrator to reach back *into* an already-validated chain and mutate a bookkeeping field a second time, which AD-3 never anticipates ("Only a `valid` or `repaired` chain may leave `generateVocalChain`" — it doesn't say the orchestrator may still post-process a `repaired` chain further).

Since AD-1's Binds list silently excludes the validation gate, both placements are technically "spine-compliant" against the Binds list, while directly disagreeing with each other and with AD-1's own prose about who's allowed to own `order`.

### Recommended fix
Either (a) add `lib/validation/repairChain.ts` to AD-1's Binds list and state explicitly that repair-time structural changes (e.g., dropping a plugin instance) must renumber `order` inside the validation gate before returning — keeping bookkeeping ownership consistent with "the thing that changes the shape also fixes the derived field" — or (b) if bookkeeping fields must stay orchestrator-only as the prose says, correct AD-1's binding to reflect that `generationStage.ts` currently violates it, and require any code that mutates `plugins[]`'s cardinality (repair-by-removal included) to hand the result back through a single, named orchestrator step that recomputes `order`, rather than letting each caller renumber independently.

---

## Hole 6 — AD-6's "semantic classes already established" is an open-vs-closed list, and the codebase already shows both readings in the wild

**Attacks:** AD-6.

### The setup
AD-6's Rule: *"Components consume them only via the semantic Tailwind classes already established (`text-foreground`, `text-muted`, `text-supporting`, `bg-background`, `hero-gradient`) — never a raw hex value in a component."* `globals.css`'s `@theme inline` block only wires up five tokens (`--color-background`, `--color-foreground`, `--color-muted`, `--color-supporting`, `--color-accent`) plus the `.hero-gradient` utility — `--accent` isn't even in AD-6's named list, despite being a real token.

Grepping the actual, already-committed pages shows extensive use of raw Tailwind palette utilities that are in neither the token set nor the named semantic-class list: `border-black/10`, `bg-white`, `placeholder:text-zinc-400`, `focus:border-black/30`, `enabled:bg-black`, `enabled:hover:bg-zinc-800`, `disabled:bg-black/[.06]`, `bg-black/5`, `text-black/20`, `bg-white/70`, `border-black/5` — in `app/page.tsx`, `app/results/page.tsx`, and `app/loading/page.tsx`. None of these is "a raw hex value" (they're Tailwind color-name/opacity utilities), so none of them technically violates AD-6's literal Rule — yet none of them is a centralized design-system token either, and the whole point AD-6 exists to prevent ("a component hardcoding a color... that drifts from the Design System") is already happening, in the very code the spine describes as ratified.

### Two spine-compliant, incompatible readings
When a future story builds the FR-6/FR-7 Plugin Visual (which needs meter fills, knob highlights, track colors — well beyond the five named tokens):
- **Story A** reads AD-6's list as illustrative and extends it: adds new `--color-*` custom properties to `globals.css` for whatever the Plugin Visual needs (e.g. `--color-meter-fill`), wires them through `@theme inline`, and uses only those plus the existing five — fully spirit-compliant, centralizes new tokens the way AD-6 intends.
- **Story B** reads AD-6's list as closed (it says "already established," not "or add more the same way") and, finding no sanctioned way to add a token, follows the *existing, committed precedent* in `page.tsx`/`results/page.tsx` and reaches for raw Tailwind palette utilities (`zinc-800`, `black/20`, etc.) directly in the Plugin Visual component — letter-compliant with "never a raw hex value," consistent with what the rest of the app already does, and yet exactly the drift AD-6 was written to prevent.

Both stories can point at real precedent (the Rule's literal wording for B; the Rule's evident intent for A) and produce visually and structurally incompatible components — one pulls from a growing central token set, the other continues an un-tokenized, ad hoc palette that's already spread across three pages.

### Recommended fix
Tighten AD-6's Rule to ban any Tailwind color-palette utility class (not just literal hex values) outside the `--color-*` token set in a component, and state the addition process explicitly: *"A new visual need is met by adding a `--color-*` token to `globals.css` first, then a semantic class for it — never by reaching for Tailwind's built-in palette (`zinc-*`, `black/`, `white`, etc.) directly."* This should be paired with an actual cleanup pass on `page.tsx`/`results/page.tsx`/`loading/page.tsx`, since they already violate the Rule's intent today, before a new component copies the pattern.

---

## Summary Table

| # | Hole | ADs attacked | Fix |
| --- | --- | --- | --- |
| 1 | No contract for how a full generation result crosses the loading→results boundary | State convention, AD-9 | New AD: handoff by opaque `id` + fetch-by-id, never full-payload-in-URL or an ad hoc client store |
| 2 | Cache placement + `id`/`generatedAt` semantics on a cache hit undefined | AD-1, AD-7, AD-8 | New AD: cache stores whole `VocalChainResponse`; a hit replays it unmodified except `cacheHit` |
| 3 | `logicPro.ts` isn't actually pinned to `tier: "stock"` | AD-5 | Tighten AD-5 (or shrink `pluginTierSchema`) to forbid non-stock entries in the file |
| 4 | String/boolean control validation has no defined repaired-vs-rejected outcome | AD-3 | Extend AD-3 into an exhaustive type × failure-mode → outcome table |
| 5 | Bookkeeping-field ownership (`order`) contradicts itself between prose and code, and excludes the validation gate | AD-1 | Either bind `repairChain.ts` into AD-1 explicitly, or correct AD-1 to match reality and force renumbering back through one orchestrator step |
| 6 | "Semantic classes already established" is open/closed-ambiguous, and raw palette utilities already exist in committed code | AD-6 | Ban any raw Tailwind palette utility (not just hex), define the token-addition process, cleanup existing pages |
