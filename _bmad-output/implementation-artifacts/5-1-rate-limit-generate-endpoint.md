---
baseline_commit: 6c4a3f6c9388096d6224291662f1b8d6c0b056d6
---

# Story 5.1: Rate-limit the generation endpoint

Status: done

## Story

As the app owner,
I want `POST /api/generate` to reject excessive requests from a single source,
So that no single bad actor or runaway script can drive unbounded AI costs.

## Background

`/api/generate` is live on a public domain (`vocaligner.com`), and every request that isn't a cache hit costs real money via the production model (Luna, Story 3.3). This was always a conscious, flagged non-goal in the original PRD (§5/§8), explicitly deferred until "real API costs turn on and it's live" — both conditions became true this session. Founder-directed epic planning (2026-08-12, `epics.md` Epic 5) formalized this as the next production-hardening piece, depending on Epic 4's persistent store (so request counts stay accurate across Vercel's serverless instances rather than a per-instance counter that would undercount real abuse).

## Acceptance Criteria

1. Given a client exceeds N requests to `POST /api/generate` within a rolling window (N/window TBD, calibrated well above normal single-user behavior), when they request again inside that window, then they get `429 Too Many Requests` and the model client is never called (zero AI cost on a blocked request). Resolved as **10 requests/hour per client IP**, sliding window — a founder-approved starting default (discussed directly, not derived from measured traffic), easy to tune later.
2. Given a normal user submitting one generation, when they use the app as intended, then they're never rate-limited. 10/hour is well above any real single-session usage pattern.
3. Given Vercel serverless has no guaranteed shared in-memory state across instances, when rate limiting is implemented, then request counts are tracked consistently across instances. Resolved by reusing the same Upstash Redis instance Epic 4 already provisioned, via the official `@upstash/ratelimit` package.
4. Given the founder's noted unfamiliarity with this kind of infra concept, when this story is implemented, then the chosen approach and its tradeoffs are explained in plain terms as part of the story. See Dev Notes below.

## Tasks / Subtasks

- [x] Task 1: Verify the client-identification mechanism is actually trustworthy (AC: 1)
  - [x] Confirmed live against Vercel's own current docs (`vercel.com/docs/headers/request-headers`), not assumed: Vercel overwrites `x-forwarded-for` at the edge and does not forward a client-supplied value, specifically to prevent IP spoofing. Safe to trust as the rate-limit identifier on this platform.
- [x] Task 2: Extract shared Upstash configuration detection (AC: 3)
  - [x] `web/lib/store/upstashConfig.ts` (new): `isUpstashConfigured()`/`getRedisClient()` pulled out of `generationStore.ts`, since both it and the new rate limiter need the identical "is Upstash configured, with the UPSTASH_*/legacy KV_* name fallback" check — duplicating that logic a second time would risk the exact kind of drift the Epic 4 code review already caught once (a check that only recognized one of the two valid name pairs).
  - [x] `web/lib/store/generationStore.ts` updated to use the shared module; behavior unchanged (verified diff-level, not just claimed).
- [x] Task 3: Core rate-limiting logic (AC: 1, 2, 3)
  - [x] `web/lib/rateLimit.ts` (new): `@upstash/ratelimit`, sliding window, 10/hour. `evaluateRateLimit(identifier, limiter)` is the pure, fully-testable core (always takes an explicit `Limiter | null`, no internal default-resolution to fight in tests); `checkRateLimit(identifier)` is the thin production entry point. `getClientIdentifier(request)` extracts the first non-empty segment of `x-forwarded-for`.
  - [x] Same graceful-degradation pattern as the rest of this pipeline: skips rate limiting entirely (fails open) when Upstash isn't configured — local dev without it keeps working, and there's no in-memory-per-instance fallback whose counts wouldn't mean anything across Vercel's instances anyway.
- [x] Task 4: Wire into the route (AC: 1)
  - [x] `web/app/api/generate/route.ts`: rate-limit check is the literal first statement in `POST`, before body parsing, before `getModelClient()`/`generateVocalChain` — a blocked request never reaches the model client. Returns `429` + `Retry-After` header (computed from the limiter's `reset` timestamp) when blocked.
- [x] Task 5: Test coverage (AC: 1, 2, 3)
  - [x] `web/lib/rateLimit.test.ts`, `web/lib/store/upstashConfig.test.ts`, `web/app/api/generate/route.rateLimit.test.ts` (isolated from `route.test.ts`'s other cases via `vi.mock`, so mocking `checkRateLimit` here can't affect those).

## Review Findings

Two review rounds via `bmad-code-review`, both no-spec mode (this story file written after the fact, per this project's established pattern for same-day implementation work). Each round ran Blind Hunter + Edge Case Hunter in parallel; both rounds' sub-reviewer completions hit the skill's known routing bug and were manually relayed.

**Round 1 (commit `bd898ef`, fixed in `86f9a88`):**

- [x] [Review][Patch][HIGH] `evaluateRateLimit` had no error handling around `limiter.limit()`, and `route.ts` didn't wrap `checkRateLimit()` either — a live Upstash/Redis error (timeout, transient outage) would propagate as an unhandled rejection and 500 every request to `/api/generate` until the outage cleared. The original commit's "fails open" claim only covered the "not configured" branch, not "configured but erroring" — worse than shipping no rate limiter at all. Found independently by both sub-reviewers. Fixed to catch, log, and fail open, matching `generationStore.ts`'s existing store-error convention. [`web/lib/rateLimit.ts`]
- [x] [Review][Patch][Edge case] `getClientIdentifier` took the raw first comma-separated segment (`split(",")[0]`) — a header value with a leading empty segment (e.g. `,203.0.113.7`) yielded an empty string, which is falsy, silently falling into the same "no identifier, skip rate limiting" path as a genuinely missing header even though a real client IP was present later in the string. Now finds the first non-empty trimmed segment instead. [`web/lib/rateLimit.ts`]
- [x] [Review][Patch][Minor] `upstashConfig.test.ts`'s `getRedisClient` describe block cleared Upstash env vars without an `afterEach` to restore them, unlike its sibling describe — could leak a cleared credential state into whichever test file runs next in the same vitest worker. Moved the restore to a file-level `afterEach`. Currently inert (no real Upstash creds exist in this project's local/CI env) but a real latent risk. [`web/lib/store/upstashConfig.test.ts`]
- [x] [Review][Verified correct] `x-forwarded-for` trustworthiness re-confirmed by the reviewer fetching Vercel's docs independently, not taking the implementation's comment on faith.
- [x] [Review][Verified correct] `upstashConfig.ts` extraction: `generationStore.ts`'s fallback/warning behavior diffed line-by-line and confirmed unchanged; `getRedisClient()`'s "caller must check `isUpstashConfigured()` first" contract confirmed honored at both call sites.
- [x] [Review][Verified correct] Model client never called on a blocked request — confirmed structurally (the check is the literal first statement in `POST`), not just by the mocked test asserting it.
- [x] [Review][Verified correct] Test isolation between `route.test.ts` and `route.rateLimit.test.ts` — vitest gives each test file its own module registry by default; `route.test.ts` never sets `x-forwarded-for`, so it never reaches `checkRateLimit` regardless of the other file's `vi.mock`.
- [x] [Review][Defer][HIGH] `/api/compare` (the internal model-comparison tool) was flagged as an equally public, uncached, multi-model AI-cost sink with zero rate limiting — arguably a bigger exposure than `/api/generate`, but out of this story's stated scope (`POST /api/generate` specifically). **Resolved same-day, not by protecting it but by deleting it entirely** (commit `40f9257`) — the founder's decision on Luna vs. Anthropic (the question the tool existed to answer) was made, so removing it eliminated the exposure rather than needing to build rate limiting for a tool nobody needs anymore. See Dev Notes.
- [x] [Review][Defer][MEDIUM] Cache hits still consume the rate-limit budget (the check runs before `getCachedGeneration`) — a known, consciously-discussed tradeoff (see planning conversation), re-confirmed by the reviewer as not creating a surprising interaction with Epic 4's caching beyond that.
- [x] [Review][Defer][MEDIUM] Silent, unmonitored fail-open on Upstash misconfiguration in production — only a `console.warn`/`console.error`, no alerting. A monitoring decision, not a code fix.
- [x] [Review][Defer][LOW] `pending` from `Ratelimit.limit()`'s result is discarded — Upstash recommends forwarding it to something like `waitUntil` in serverless/edge so the library's internal analytics/ephemeral-cache sync isn't dropped. Low impact for a single-region MVP.
- [x] [Review][Defer][LOW] 10/hour is inherently a per-shared-IP bucket (NAT/office networks share it) — an accepted tradeoff of IP-based limiting, not a bug.

`npx tsc --noEmit`, `npx eslint .`, `npx vitest run` all clean after Round 1's fixes — 174/174 tests (170 baseline, +4 new).

## Resolution: `/api/compare` removed (commit `40f9257`)

Not part of the original story scope, but directly triggered by Round 1's review and completed the same day per the founder's explicit decision ("I'm happy with Luna over Anthropic so we can close down that comparison tool now"):

- Deleted `app/compare/` (both pages), `app/api/compare/route.ts`, `lib/ai/comparisonModels.ts`.
- **Did not touch** `lib/ai/openRouterModelClient.ts` or `app/components/PluginChainVisual.tsx` — both are real production dependencies now (Luna's own model client via `getModelClient.ts`/`failoverModelClient.ts`, and the results page's plugin renderer respectively), independent of the removed tool. Verified via the actual import graph (`grep`), not assumed.
- Architecture AD-9's 2026-08-03 widening (which permitted `app/api/compare/route.ts` to import `lib/ai/*`) reverted in `ARCHITECTURE-SPINE.md` — recorded as reverted with a dated note, not silently erased.
- Verified via clean `tsc`/`eslint`/`vitest` (174/174, unchanged — nothing depended on the removed files) and a live local check: a real generation via `POST /api/generate` followed by `GET /api/generate/[id]` both round-tripped correctly against a production build (`next start`) post-removal. **Not independently verified**: the actual browser-rendered `/results` page — it's a client component that fetches its data via `useEffect`, so a plain `curl` only ever sees the pre-hydration shell; a clean build (which fails hard on a broken import to a deleted file) and the unchanged shared component are the actual evidence here, not a browser observation.

## Dev Notes

- **Plain-terms explanation, per AC 4**: think of it like a bouncer checking IDs at the door of `/api/generate`. Every time someone (a browser, a script, anything) tries to generate a vocal chain, the bouncer checks their IP address against a list of "how many times has this address come in during the last hour." Under 10, they're waved through. At 10, the door stays shut for a bit (they get a "come back in N seconds" response) — but nothing about generating an actual chain (no AI call, no cost) happens for a blocked request. The list itself lives in the same Redis database Epic 4 set up, so it doesn't matter which of Vercel's servers happens to handle any given request — they're all checking the same shared list, not their own separate one.
- **Why a database-backed limiter, not a simple in-memory counter**: Vercel runs this app as multiple independent server processes (serverless), and a counter kept in one process's memory is invisible to the others — exactly the problem Epic 4 solved for storing results, and the same fix applies here.
- **Both review rounds found real issues, not nitpicks** — continues this project's consistent pattern. The fail-open gap specifically is worth remembering as a general lesson: "add a safety mechanism" needs its own failure mode considered, or the safety mechanism itself becomes the outage.
- Architecture AD-2 (`ModelClient` is the only AI-provider boundary) and AD-9 (AI pipeline reached only via an API route) both unaffected by the rate-limiting work itself — `rateLimit.ts`/`upstashConfig.ts` import no provider SDK, and the check lives inside the existing route, not a new one.

### File List

- `web/lib/store/upstashConfig.ts` (new)
- `web/lib/store/upstashConfig.test.ts` (new)
- `web/lib/store/generationStore.ts` (modified — uses the shared module)
- `web/lib/rateLimit.ts` (new)
- `web/lib/rateLimit.test.ts` (new)
- `web/app/api/generate/route.ts` (modified — rate-limit check added)
- `web/app/api/generate/route.rateLimit.test.ts` (new)
- `web/package.json` / `web/package-lock.json` (new dependency: `@upstash/ratelimit`)
- `web/app/compare/`, `web/app/api/compare/route.ts`, `web/lib/ai/comparisonModels.ts` (deleted, same-day resolution)
- `_bmad-output/planning-artifacts/architecture/architecture-VocAligner-2026-07-23/ARCHITECTURE-SPINE.md` (AD-9 widening reverted)

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 5, Story 5.1]
- [Source: Architecture AD-2, AD-9, AD-12 candidate — `ARCHITECTURE-SPINE.md`]
- [Source: `_bmad-output/implementation-artifacts/4-1-4-2-persist-generation-results.md` — Epic 4, which this depends on]
- [Source: Vercel's current docs (`/docs/headers/request-headers`), fetched live — confirms `x-forwarded-for` anti-spoofing guarantee]
- [Source: `@upstash/ratelimit`'s installed type definitions — confirms `reset` is ms-since-epoch]
