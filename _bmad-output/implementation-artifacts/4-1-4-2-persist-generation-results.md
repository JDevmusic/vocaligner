---
baseline_commit: 023138212b8066f003adb2f543859aed4844c937
---

# Story 4.1 + 4.2: Persist generation results across server instances, with expiry

Status: done

## Story

As a user,
I want my generated vocal chain to be retrievable even if my request is served by a different backend instance than the one that generated it,
So that I never see a false "nothing here" error for a chain that was actually created successfully.

As the app owner,
I want old generation results to eventually expire,
So that storage doesn't grow unbounded for the life of the deployment.

## Background

Flagged repeatedly since Story 1.2/2.1 code reviews as fine "for now, revisit once it moves off in-memory" — `generationStore.ts` held every generated chain in two plain in-memory `Map`s. That was never actually safe once the app moved to Vercel's serverless deployment model (Story 3.3): a `POST /api/generate` and a later `GET /api/generate/[id]`, or a cache-key lookup for the same Artist+Song, can each be handled by a different server instance that doesn't share memory with the one that wrote the original data. A real, successfully-generated, already-billed chain could silently 404 for the user. Founder-directed epic planning (2026-08-12, `_bmad-output/planning-artifacts/epics.md` Epic 4) formalized this as no longer a someday concern now that the app is genuinely live and public.

## Acceptance Criteria

1. Given a successful `POST /api/generate` on one serverless instance, when a later `GET /api/generate/[id]` is handled by a different instance, then the stored `VocalChainResponse` is still returned correctly.
2. Given the existing Artist+Song cache (AD-7/AD-8), when a cache-eligible request lands on a different instance than the one that created the entry, then the cache hit is still correctly detected, `meta.cacheHit: true`, exactly as today.
3. Given this story replaces the storage mechanism, not the storage contract, when implemented, then `getGeneration`/`setGeneration`/cache-lookup call sites need no *behavioral* changes. `[DEVIATION]` The literal function *signatures* do change — from synchronous to `async`/`Promise`-returning, since real network I/O can't stay synchronous the way an in-memory `Map` could. Both call sites (`route.ts`, `[id]/route.ts`) were already `async` functions, so this meant adding three `await`s total, not a redesign. Documented here rather than silently claiming the AC's literal wording was met unchanged.
4. Given the choice of persistence technology, when selected, then it's the simplest option that satisfies "survives across Vercel instances." Resolved as Upstash Redis via the Vercel Marketplace — verified live against Vercel's current docs that "Vercel KV" as a standalone product was sunset in favor of Marketplace-provisioned storage, since every source available from training data pointed at the old, now-removed product.
5. Given a generation stored longer than the retention window, when it's looked up, then it's treated as not found, same as an invalid `id`. Resolved as 30 days — long enough that no real user's `/results` link goes stale mid-use, short enough to bound storage growth; a judgment call, not a hard requirement.
6. Given Story 4.1's persistence layer, when this story is implemented, then it uses that layer's native TTL support rather than a hand-rolled sweep/cleanup job. Redis's `EX` option on `SET` is used directly.

## Tasks / Subtasks

- [x] Task 1: Verify the current Vercel storage landscape before building against it (AC: 4)
  - [x] Confirmed live via Vercel's own current docs (not assumed from training data) that "Vercel KV" was sunset; the correct current path is Upstash Redis provisioned through the Vercel Marketplace, package `@upstash/redis`, `Redis.fromEnv()`.
- [x] Task 2: Replace the two in-memory `Map`s with a swappable key-value store (AC: 1, 2, 3, 4)
  - [x] `web/lib/store/generationStore.ts`: new `KeyValueStore` interface (`get`/`set`), matching this project's existing dependency-injection pattern for AI clients. `saveGeneration`/`getGenerationById`/`getCachedGeneration` become `async`, take an optional injectable `store` parameter, default to a module-level singleton.
  - [x] All pre-existing normalization/versioning/key-encoding logic (AD-7/AD-8) left untouched — only the storage read/write calls changed.
  - [x] `web/app/api/generate/route.ts`, `web/app/api/generate/[id]/route.ts`: three `await`s added at the call sites.
- [x] Task 3: In-memory fallback for safe deploy ordering (AC: 4)
  - [x] `InMemoryStore` (exported): this module's entire prior behavior, used when Upstash isn't configured — mirrors `getModelClient.ts`'s mock fallback. Makes the code safe to ship before Upstash is actually provisioned (no outage risk), and keeps local dev working without requiring it.
- [x] Task 4: Expiration (AC: 5, 6)
  - [x] `RETENTION_SECONDS = 60 * 60 * 24 * 30` (30 days), passed as `{ ex: RETENTION_SECONDS }` on both the id-keyed and cache-keyed `set` calls.
- [x] Task 5: Test coverage (AC: 1, 2, 3, 5, 6)
  - [x] `web/lib/store/generationStore.test.ts`: all 13 pre-existing cases (normalization, case/whitespace tolerance, version-mismatch misses, delimiter-collision safety, Unicode normalization) preserved, made `async`, now inject the module's own real `InMemoryStore` (not a separate hand-rolled fake) so tests can't quietly drift from the actual fallback path. Added a TTL-application test.
  - [x] `web/app/api/generate/route.test.ts`: one call site updated to `await`.

## Review Findings

Two review passes, both via `bmad-code-review` in no-spec mode (no story file existed for this commit at review time — written after the fact, matching this project's established pattern for diagnosis-driven work).

**Round 1 (commit `41eb64f`, fixed in `dc7e205`):**

- [x] [Review][Patch][HIGH] `saveGeneration`'s `Promise.all` rejection propagated up through `route.ts`'s generic catch, discarding an already-successful, already-billed AI generation and 500ing the user on any single Redis hiccup. Switched to `Promise.allSettled`; failures are logged (message only, never rethrown) — a store outage now costs a future cache-miss, not the result already in hand. [`web/lib/store/generationStore.ts`]
- [x] [Review][Patch][HIGH] `getCachedGeneration`/`getGenerationById` threw on any Redis error instead of degrading to "cache miss"/"not found" — a store outage would have taken down `/api/generate` and `GET /api/generate/[id]` entirely. Both now catch and degrade gracefully. [`web/lib/store/generationStore.ts`]
- [x] [Review][Patch][HIGH] The "is Upstash configured" check only recognized `UPSTASH_REDIS_REST_URL`/`TOKEN` — but `@upstash/redis`'s own `Redis.fromEnv()` also falls back to the older `KV_REST_API_URL`/`TOKEN` names "for compatibility with Vercel KV and other platforms" (confirmed by reading the installed package source directly, not assumed). A project provisioned under the legacy names would have silently picked `InMemoryStore` over a working Redis — reintroducing the exact cross-instance bug this story exists to fix, with nothing in the logs to explain why. Now mirrors `fromEnv()`'s fallback exactly; warns if only one of the two vars is set. [`web/lib/store/generationStore.ts`]
- [x] [Review][Patch][LOW] `InMemoryStore` handed back live object references instead of matching Redis's actual JSON-round-trip semantics — a future mutating caller could silently corrupt the fallback store in a way real Redis can't reproduce. Added `structuredClone` on both `get`/`set`. [`web/lib/store/generationStore.ts`]
- [x] [Review][Patch][MEDIUM] The TTL test captured one shared variable across both `set()` calls, so a regression dropping `ex` from only one call would still pass. Now captures per-call and asserts both. [`web/lib/store/generationStore.test.ts`]
- [x] [Review][Patch][MEDIUM] `UPSTASH_REDIS_REST_URL`/`TOKEN` shipped with zero documentation, contrary to this project's explicit env-var-clarity convention for the founder. Documented in `.env.example`. [`web/.env.example`]
- [x] [Review][Verified, not reproducible] A Blind Hunter finding that `Redis.fromEnv()`/its constructor could throw synchronously on a malformed URL was checked against the actual installed source — it only `console.warn`s on missing/whitespace values, never throws synchronously. No fix needed.
- [x] [Review][Defer] Cache-hit path now costs two sequential Redis round-trips instead of one in-process lookup — a real latency cost, but fixing it well means a storage-shape decision (duplicate the payload across both keys vs. accept the extra round-trip), not a bug fix. Left for a human call.
- [x] [Review][Defer] Concurrent duplicate-generation race for identical Artist+Song requests arriving close together — widened by the move from synchronous to async storage calls, but this story's job was swapping the backend, not adding concurrency control, and there's no existing locking primitive in this codebase to build on.

`npx tsc --noEmit`, `npx eslint .`, `npx vitest run` all clean after Round 1's fixes — 148/148 tests (145 baseline, +3 resilience tests).

## Dev Notes

- **A real deployment gotcha found live, after both review rounds passed**: connecting the Upstash integration in Vercel's dashboard does not itself trigger a new deployment. The app kept silently running on `InMemoryStore` against the live production site — no error, nothing wrong in the code — until a manual redeploy was triggered, because environment variables only take effect on deployments created after they're added (the exact same rule that caused the `ANTHROPIC_API_KEY` confusion in Story 3.1/3.3). Diagnosed by checking `vercel ls`'s deployment timestamps against when Upstash was connected, not by guessing.
- **Verified via real production traffic, not just tests or curl timing.** Two rounds of curl tests against `https://vocaligner.com/api/generate` (POST → GET-by-id → repeat-request cache hit) both "worked" even before the redeploy fix above — a reminder that a same-instance warm-function reuse can make a broken cross-instance setup look correct on a quick manual test. The only fully conclusive check was confirming the exact generated `id` actually appeared as a `generation:{id}` key in Upstash's own Data Browser, post-redeploy — real proof, not inference from response timing.
- **Operational note, not a code issue**: while investigating this via the Vercel CLI, an errant `vercel link --yes` (intended only to check env var names) created a new, empty, unwanted Vercel project instead of linking to the existing `vocaligner` project, because the local directory is named `web` and `--yes` skipped the prompt that would have offered to match the existing project by name instead. Cleaned up (local `.vercel/` and a stray `VERCEL_OIDC_TOKEN` line in `.env.local` removed; the empty project deleted from the account, confirmed via `vercel project ls`). No production impact — worth remembering: don't use `vercel link --yes` blindly when the local directory name doesn't match the actual project name.
- **Architecture AD-7/AD-8/AD-10 unaffected** — confirmed by direct comparison, not just claimed: `normalizeText`/`normalizeCacheKey` and the version-gate block in `getCachedGeneration` are byte-for-byte identical to before this story; only the storage backend underneath changed.

### File List

- `web/lib/store/generationStore.ts` (modified — Redis-backed store, `InMemoryStore` fallback, TTL)
- `web/lib/store/generationStore.test.ts` (modified)
- `web/app/api/generate/route.ts` (modified — `await` added, comment updated)
- `web/app/api/generate/route.test.ts` (modified — `await` added)
- `web/app/api/generate/[id]/route.ts` (modified — `await` added)
- `web/.env.example` (modified — documents `UPSTASH_REDIS_REST_URL`/`TOKEN`)
- `web/package.json` / `web/package-lock.json` (new dependency: `@upstash/redis`)

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 4, Stories 4.1/4.2]
- [Source: Architecture AD-7, AD-8, AD-10, AD-11 candidate — `ARCHITECTURE-SPINE.md`]
- [Source: Vercel's current docs (`/docs/storage`, `/docs/marketplace-storage`), fetched live — confirms Vercel KV's sunset and the Marketplace/Upstash successor path]
- [Source: installed `@upstash/redis` package source (`node_modules/@upstash/redis/nodejs.js`) — confirms `Redis.fromEnv()`'s `KV_REST_API_URL`/`TOKEN` fallback]
