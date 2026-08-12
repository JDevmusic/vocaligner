---
baseline_commit: f259f3b0a7f42a9c8e35a2b1e2e7a1a1d9e2b8a1
---

# Story 3.3: Real song-key lookup, Luna as production model, and provider failover

Status: done

## Story

As a user,
I want Pitch Correction's key to be genuinely correct (not a model guess) and the app to keep working even if one AI provider has an outage,
so that the results I get back are both more accurate and more reliable.

## Background

Direct continuation of the same-day work logged in `_bmad-output/pm-handoff-2026-08-11.md`: that session identified key/root-note detection as the one real, unresolved accuracy gap in both Anthropic and Luna, and scoped (but didn't build, pending deployment) a GetSongBPM lookup to fix it. This story is that integration, plus two decisions that became live once it landed:

1. **GetSongBPM key lookup.** Deployment (`vocaligner.com` on Vercel) unblocked GetSongBPM's mandatory-backlink signup requirement. Built the lookup, wired it into `generateVocalChain.ts` as an app-computed override (same AD-1 treatment as `order`/`wasRepaired`) for Pitch Correction's `rootNote`/`scale`. **Shipped broken**: every third-party doc source available (GitHub, a Perl module, a blog post) pointed at `api.getsongbpm.com`, which is real but sits behind a Cloudflare bot-challenge that silently blocks all server-side requests — confirmed live via direct `curl`/`fetch` tests that returned Cloudflare's "Just a moment..." page instead of JSON. The lookup's own fail-safe design (return `null`, fall back to the model's guess) meant this failure was invisible — no error, no crash, just silently never working. Root cause found only once the founder fetched GetSongBPM's real docs directly in an authenticated browser (Cloudflare passes real human sessions, not scripts): the API moved to `api.getsong.co` in Sept 2024 (their own Changelog 1.2); the old host's claimed "automatic redirect" doesn't clear the challenge in practice. One-line fix, then confirmed live and correct: "goosebumps" / Travis Scott → `key_of: "Em"`, matching the real key already identified via manual listening in the prior session.
2. **Anthropic → Luna as the production model.** Founder's explicit decision once the key-accuracy concern above was mitigated: `getModelClient()` now prefers OpenRouter/Luna over Anthropic (previously Anthropic-or-mock only). Both keys were already configured in Vercel from the internal `/compare` tool's earlier work, so this needed no infrastructure change.
3. **Provider failover.** Code review of (2) found the switch was presence-of-key-based only, not health-based — a live Luna outage would fail generation outright despite a working Anthropic key sitting unused. Founder's explicit decision to fix this immediately rather than accept the risk: `getModelClient()` now wraps both clients in a new `failoverModelClient.ts` when both keys are configured.

## Acceptance Criteria

1. Given a chain including a Pitch Correction plugin instance, when a real key can be looked up for the artist/song via GetSongBPM, then `rootNote`/`scale` are overwritten with the real value at `confidence: "high"`, `wasRepaired: false` — never requested from or trusted to the model.
2. Given the lookup fails for any reason (no API key configured, song not found, network error, timeout, a response that doesn't parse, or a returned result whose artist doesn't plausibly match the query), when `generateVocalChain` runs, then it proceeds exactly as it does today with the model's own guess untouched — this can never block or fail a generation.
3. Given this is a real structural pipeline change, when it ships, then `PIPELINE_VERSION` is bumped so old cached results (generated before the fix) are correctly treated as stale and regenerated, not silently served forever (Architecture AD-8).
4. Given both `OPENROUTER_API_KEY` and `ANTHROPIC_API_KEY` are configured, when `getModelClient()` is called, then it returns a client that tries Luna first and falls back to Anthropic only on a genuine transport-level failure (not a malformed/thin response, which the existing per-stage retry already handles).
5. Given a provider fails over mid-generation, when later stage calls happen in the same request, then they go straight to the fallback (sticky) rather than re-trying a confirmed-down primary on every stage.
6. Given only one key is configured (either provider), when `getModelClient()` is called, then behavior is unchanged from a plain single-provider client — no failover wrapping when there's nothing to fail over to.

## Tasks / Subtasks

- [x] Task 1: GetSongBPM client (AC: 1, 2)
  - [x] `web/lib/external/getSongBpmClient.ts`: `lookupSongKey()` calls `/search/`, parses `key_of` into VocAligner's real Root Note (sharps-only, matching Pitch Correction's registry `options`) + Scale (`"Major Scale"` / `"Natural Minor Scale (Aeolian)"` — GetSongBPM only distinguishes major/minor, not which of Logic's several real minor variants, so a bare minor label maps to the standard Natural Minor reading). Every failure path returns `null`.
  - [x] Artist-match verification (`looksLikeSameArtist`) added after initial code review found the fuzzy `/search/` endpoint's top result was trusted blindly — a wrong match (cover version, same-titled song) would have applied a confidently wrong key. Fails open when the field is missing/absent.
  - [x] `web/lib/ai/generateVocalChain.ts`: lookup kicked off in parallel with the research/reasoning/generation AI calls (near-zero added latency); applied via `applyRealSongKey()` only if the final chain includes Pitch Correction.
- [x] Task 2: Fix the wrong API host (AC: 2)
  - [x] `API_BASE` corrected from `api.getsongbpm.com` (silently blocked by Cloudflare) to `api.getsong.co` (GetSongBPM's real current host per their own docs). Confirmed live against the real endpoint before considering this done.
- [x] Task 3: Cache-bust for the structural change (AC: 3)
  - [x] `PIPELINE_VERSION` bumped `"1"` → `"2"` in `web/lib/ai/pipelineVersion.ts`.
- [x] Task 4: Switch production model to Luna (AC: 4, part)
  - [x] `web/lib/ai/getModelClient.ts`: OpenRouter/Luna (`openai/gpt-5.6-luna`, matching `comparisonModels.ts`) preferred over Anthropic over mock.
- [x] Task 5: Provider failover (AC: 4, 5, 6)
  - [x] `web/lib/ai/failoverModelClient.ts` (new): wraps two `ModelClient`s. A `ModelTransportError` (thrown only after each provider client's own internal retry/backoff is exhausted) on the primary triggers one retry against the fallback; sticky for the rest of the generation. Does not retry a `ModelResponseValidationError` — that's the existing per-stage retry's job.
  - [x] `getModelClient.ts` wraps both clients only when both keys are configured; single-key and no-key behavior unchanged.

## Review Findings

Two independent review rounds (`bmad-code-review`, no-spec mode — this story file was written after the fact, matching this project's established "diagnosis-driven live-testing work" pattern), each with Blind Hunter + Edge Case Hunter running in parallel. Both rounds' sub-reviewer completions hit the skill's known routing bug (misrouted to the main session instead of the orchestrating agent) and were manually relayed.

**Round 1 — GetSongBPM integration + host fix + model switch (commits `f259f3b`, `431a976`, `40a0d9a`, `9b40fad`):**

- [x] [Review][Patch] `lookupSongKey` trusted the fuzzy `/search/` endpoint's top result with no check it actually matched the queried artist — a wrong match would silently apply a confidently wrong key at `confidence: "high"`, worse than the model's own uncertain guess. Fixed: `looksLikeSameArtist()`, a loose, fail-open substring check. [`web/lib/external/getSongBpmClient.ts`]
- [x] [Review][Patch] Every failure mode collapsed into a silent `return null` with zero observability — exactly how the wrong-host bug went undetected. Added `console.warn` on genuine transport failures (status/message only, never the URL or key — verified by a test asserting the key never appears in the logged string). [`web/lib/external/getSongBpmClient.ts`]
- [x] [Review][Patch] A test asserted `not.toBe("mock")` / `not.toBe("openai/gpt-5.6-luna")` — a double negative that would still pass if the fallback regressed to some other wrong client. Strengthened to assert the actual expected Anthropic model id. [`web/lib/ai/getModelClient.test.ts`]
- [x] [Review][Patch] The GetSongBPM footer link's real purpose (mandatory backlink for API access, not just courtesy attribution) was undocumented at the point a future edit would touch it. Comment added. [`web/app/components/Footer.tsx`]
- [x] [Review][Verified false-positive] `web/AGENTS.md`'s instruction to read Next.js docs under `node_modules/next/dist/docs/` was flagged as a possible prompt-injection artifact. Independently verified: that path is real, populated, present since the repo's first commit, and consistent with Next.js's own AI-agent-guidance convention. Not a security issue.
- [x] [Review][Defer] No runtime failover from Anthropic on a live Luna failure (only a missing-key fallback existed at this point) — flagged as a real gap requiring a founder decision, not silently built. **Resolved by Task 5 above, same day**, once the founder decided to fix it immediately rather than accept the risk.
- [x] [Review][Defer] The `AD-1` comment citation on `applyRealSongKey` is imprecise — AD-1's ratified text scopes synchronous, deterministic app-derived fields (`order`, `wasRepaired`); a network-sourced override with its own fail-open/timeout semantics is a related but materially different mechanism wearing the same citation. Worth an explicit AD amendment covering "app-computed via external lookup" as its own pattern. Not resolved unilaterally.
- [x] [Review][Defer] The internal `/compare` tool fires one independent GetSongBPM lookup per model per generation, with no de-duplication — low severity (internal dev tool only), worth knowing if GetSongBPM's free-tier quota becomes a constraint.
- [x] [Review][Defer] `applyRealSongKey` overwrites `rootNote`/`scale` but leaves the model's own `rationale` text untouched — if the model's rationale mentions the specific (now-overridden) key it guessed, the response can contain a plugin whose value and stated rationale disagree. Not currently rendered anywhere in `app/`, so latent, not a live bug.

**Round 2 — provider failover (commit `e088ce3`):**

- [x] [Review][Patch] When both providers failed (fallback also threw `ModelTransportError` after the primary), only the fallback's failure message survived — the primary's original failure was silently discarded, losing exactly the context needed to diagnose "both providers are down." Fixed: both failures now fold into one `ModelTransportError` with `cause: { primaryError, fallbackError }`. A `ModelResponseValidationError` from the fallback still propagates unwrapped so the per-stage retry keeps working. [`web/lib/ai/failoverModelClient.ts`]
- [x] [Review][Patch] Nothing observed a failover happening at all — a sustained Luna outage would silently degrade every request to the pricier Anthropic fallback indefinitely with zero operational visibility. Added `console.warn` on the switch (status/message only, tested to contain no key-shaped content). [`web/lib/ai/failoverModelClient.ts`]
- [x] [Review][Verified safe] `active`'s lack of synchronization only matters under concurrent calls on one client instance — confirmed structurally impossible today (`generateVocalChain.ts` awaits each stage sequentially, one client per HTTP request). Documented as an explicit assumption in code rather than guarded with a lock, which would be dead code against the only real caller.
- [x] [Review][Verified correct] `meta.model` (read once, at the very end of `generateVocalChain.ts`) is guaranteed accurate for whichever provider produced the actually-returned chain — failover is monotonic (never flips back) and the generation stage runs last. Traced end-to-end, not assumed. It can under-report which provider was involved *overall* if failover happened after an earlier stage (research/reasoning) already ran on the primary — a known, documented simplification, not fixed (would need per-stage provenance tracking, a schema change with no current consumer).
- [x] [Review][Defer] Non-retryable errors (401/400/404) are misclassified as failover-worthy by the underlying provider clients' own `isRetryableError` — a misconfigured key now permanently burns the fallback too, not just a genuine outage. Pre-existing, predates this story, lives in `anthropicModelClient.ts`/`openRouterModelClient.ts`; fixing it means extending the error taxonomy across both files.
- [x] [Review][Defer] `getModelClient.ts` only `.trim()`s for the presence check — the actual key handed to each provider client is read untrimmed. Pre-existing; the new failover now masks the resulting 401 as "provider down" rather than surfacing an auth error.
- [x] [Review][Defer] Cumulative worst-case latency across three retry layers (per-provider retry × failover × per-stage retry) has no shared timeout budget.
- [x] [Review][Defer] No cross-request circuit breaker — stickiness is per-request by design; a sustained outage costs every request the primary's full retry/backoff before failing over. A persistent health-tracker would be a separate, larger feature.
- [x] [Review][Defer] `retryCount` slightly undercounts after failover (only reports the fallback's own attempts) — cosmetic, low priority.

`npx tsc --noEmit`, `npx eslint .`, `npx vitest run` all clean after both rounds' fixes — **144/144 tests** (131 baseline before this story, +5 GetSongBPM fix tests, +5 failover tests, +3 failover-review tests).

## Dev Notes

- **The wrong-API-host bug is the single most important lesson from this story.** Every independent third-party source (GitHub, a Perl CPAN module, a blog walkthrough) still documented the pre-Sept-2024 host — cross-referencing multiple sources gave false confidence, because they were all wrong in the same direction. The failure mode (a security challenge page, not an error) was silent by design (the lookup's own fail-safe `return null` swallowed it completely) and would never have surfaced without live testing against the real deployed site. Worth remembering generally: a third-party API integration is only actually verified once tested against the provider's own current docs, fetched fresh, not assembled from cross-referenced secondary sources.
- **Both review rounds found real, ship-blocking-caliber issues**, not nitpicks — the fuzzy-search artist mismatch (Round 1) and the missing failure-context/observability gaps (Round 2) were both genuine correctness/operability problems, not style preferences. Continues this project's consistent pattern (every story so far) of the review process catching something real.
- **Architecture AD-2 unaffected**: `failoverModelClient.ts` imports no provider SDK, only composes two already-conformant `ModelClient` instances.
- **The AD-1 citation on the GetSongBPM override is flagged, not resolved** — left as an explicit open item for a human architecture decision (a new AD, or an AD-1 amendment) rather than reinterpreting a ratified decision unilaterally.

### File List

- `web/lib/external/getSongBpmClient.ts` (new)
- `web/lib/external/getSongBpmClient.test.ts` (new)
- `web/lib/ai/generateVocalChain.ts` (modified — key-lookup wiring)
- `web/lib/ai/pipelineVersion.ts` (modified — version bump)
- `web/.env.example` (modified — documents `GETSONGBPM_API_KEY`)
- `web/app/components/Footer.tsx` (modified — attribution link + load-bearing comment)
- `web/lib/ai/getModelClient.ts` (modified — Luna preference + failover wrapping)
- `web/lib/ai/getModelClient.test.ts` (modified)
- `web/lib/ai/failoverModelClient.ts` (new)
- `web/lib/ai/failoverModelClient.test.ts` (new)

### References

- [Source: `_bmad-output/pm-handoff-2026-08-11.md` — the prior session that identified the key-accuracy gap and scoped this integration]
- [Source: Architecture AD-1, AD-2, AD-8 — `_bmad-output/planning-artifacts/architecture/architecture-VocAligner-2026-07-23/ARCHITECTURE-SPINE.md`]
- [Source: GetSongBPM's own API docs, fetched live in an authenticated browser session — base URL `https://api.getsong.co`, `/search/` endpoint shape, Changelog 1.2 (2024-09-25) documenting the host move]
