---
baseline_commit: f1f726e2f896da116b7036456500bee4202043f1
---

# Story 2.1: Serve cached results for identical Artist + Song requests

Status: in-progress

## Story

As a user (or anyone) requesting a chain that's already been generated,
I want the result back instantly,
so that I don't wait for AI generation again, and no AI cost is incurred a second time.

## Acceptance Criteria

1. Given a prior successful Generation exists for the normalized (trim + lowercase) Artist + Song pair, generated under the current `PIPELINE_VERSION` and `PROMPT_VERSION`, when a new request arrives for that same pair, then no call is made to the model client (PRD FR-4, Architecture AD-7/AD-8).
2. Given that same cache-hit case, when the response is returned, then it is the stored `VocalChainResponse` unmodified except `meta.cacheHit` set to `true` — `id` and `generatedAt` stay exactly as originally generated (Architecture AD-7/AD-8/AD-10).
3. Given the Artist + Song pair matches but the prior entry was generated under a different `PIPELINE_VERSION` or `PROMPT_VERSION` than the current one, when a new request arrives, then it is treated as a cache miss, not a hit (Architecture AD-8).
4. Given no matching cache entry (new pair, or a version mismatch per AC3), when the request arrives, then a normal fresh generation proceeds exactly as today — same model client call, same validation/retry behavior, same response shape.
5. Given a fresh generation completes successfully, when it is persisted, then it is also stored under its normalized Artist + Song cache key (in addition to its existing id-based storage), so a subsequent identical request can hit it.

## Tasks / Subtasks

- [x] Task 1: Stamp `PIPELINE_VERSION` onto every generated response's `meta` (AC: 2, 3)
  - [x] Add `pipelineVersion: z.string()` to `vocalChainMetaSchema` in `web/lib/schema/vocalChain.ts`, alongside the existing `promptVersion`/`schemaVersion` fields. This is the only schema change — additive, no existing field changes shape.
  - [x] In `web/lib/ai/generateVocalChain.ts`, import `PIPELINE_VERSION` from `./pipelineVersion` (already exists, currently `"1"`, re-exported from `web/lib/ai/index.ts`) and set it on the returned `meta` object, same pattern as the existing `promptVersion: PROMPT_VERSION` line.
  - [x] Confirmed safe: no test in the repo does a full-object `toEqual` on a `meta` value (checked via grep) — only `route.test.ts` checks individual fields like `parsed.meta.cacheHit`, so adding this field won't break an existing assertion.

- [x] Task 2: Extend `generationStore` with a normalized Artist + Song cache index (AC: 1, 3, 4, 5)
  - [x] **Read `web/lib/store/generationStore.ts` fully first** — it's an 11-line module: one `Map<string, VocalChainResponse>` keyed by `id`, with `saveGeneration`/`getGenerationById`. Story 1.2's own Dev Notes explicitly flagged this exact extension point: *"Do not add an artist+song lookup here; that's Story 2.1 (Epic 2), extending this same module later."* Preserve `saveGeneration`/`getGenerationById`'s existing signatures and behavior exactly — this task only adds to the module, it doesn't change the id-based path.
  - [x] Add a `normalizeCacheKey(artist: string, song: string): string` helper: `trim()` + `toLowerCase()` both, join with a separator that can't collide with real input (e.g. `` `${artist}::${song}` `` after normalizing each). This is the exact match rule Architecture AD-7 specifies — no fuzzy/typo matching in MVP, confirmed as an explicit non-goal in PRD §8's open questions.
  - [x] Add a second module-level `Map<string, VocalChainResponse>` keyed by the normalized cache key.
  - [x] Update `saveGeneration` to also `.set()` into this new map, keyed by `normalizeCacheKey(response.input.artist, response.input.song)` — every save populates both indexes from the same call, so no other caller needs to change.
  - [x] Add `getCachedGeneration(artist: string, song: string): VocalChainResponse | undefined`: look up by normalized key; if found, only return it when `entry.meta.pipelineVersion === PIPELINE_VERSION && entry.meta.promptVersion === PROMPT_VERSION` (import both current constants) — otherwise return `undefined` (AC3, Architecture AD-8). Must not mutate the stored entry either way.
  - [x] Extend `generationStore.test.ts` (currently 2 tests, save-then-get-by-id and unknown-id): add cases for `getCachedGeneration` — a hit on an exact match, a hit when artist/song differ only by case/whitespace (proves normalization), a miss on a genuinely different pair, and a miss when a hand-constructed stored entry's `meta.pipelineVersion`/`meta.promptVersion` don't match the current constants (construct this case directly rather than trying to simulate an old app version).

- [x] Task 3: Check the cache before generating, in the route handler (AC: 1, 2, 4)
  - [x] **Read `web/app/api/generate/route.ts` fully first** (26 lines) — note the existing control flow exactly: parse JSON → validate with `vocalChainInputSchema` → call `generateVocalChain` → `saveGeneration` → `Response.json(response, { status: 201 })`, with a `VocalChainGenerationError` → 502 branch. This task inserts a cache check between input validation and the `generateVocalChain` call; it does not change the error-handling branch or the miss-path's existing behavior at all.
  - [x] After `parsedInput` succeeds, call `getCachedGeneration(parsedInput.data.artist, parsedInput.data.song)`. On a hit: build `{ ...cached, meta: { ...cached.meta, cacheHit: true } }` (a new object — never mutate `cached` itself, since the *stored* record and anything fetched later via `GET /api/generate/[id]` must keep reflecting the true, permanent fact that this particular id was originally a fresh generation) and return it via `Response.json(hitResponse, { status: 200 })` — no call to `getModelClient()`/`generateVocalChain` on this path at all.
  - [x] On a miss, proceed exactly as today — no changes to that branch. (It already ends in `saveGeneration(response)`, which after Task 2 populates both indexes, so nothing else needs to change here for AC5.)
  - [x] Extend `route.test.ts` (currently 5 tests): add a case posting the same `{ artist, song }` twice and asserting the second response has `status === 200`, the *same* `id` and `meta.generatedAt` as the first response's body (proof no fresh generation ran — a real generation would produce a new `randomUUID()` and a new timestamp), and `meta.cacheHit === true`. Add a second case proving normalization end-to-end (e.g. `"Frank Ocean"` then `" frank OCEAN "`) still hits. Leave the 5 existing tests untouched; the first one (`meta.cacheHit` is `false`) documents the *miss* path and must keep passing exactly as-is.

## Dev Notes

- **Architecture is fully specified for this story already** — AD-7 (cache key = normalized Artist+Song, no fuzzy matching), AD-8 (must also match `PIPELINE_VERSION`+`PROMPT_VERSION`, not the input key alone), and AD-10 (the cache sits in front of `generateVocalChain.ts`, checked by the route or a thin wrapper before any stage runs — not inside `generateVocalChain` itself, which is why this story's design puts the check in `route.ts`, not in `lib/ai/`). [Source: `_bmad-output/planning-artifacts/architecture/architecture-VocAligner-2026-07-23/ARCHITECTURE-SPINE.md` — AD-7, AD-8, AD-10 sections]
- **Storage technology is a separately-deferred decision, not this story's concern.** The Architecture Spine explicitly lists "cache storage technology (in-memory/Redis/DB)" as open/deferred — this story extends the existing in-memory `Map`-based store exactly as Story 1.2 left it, the same way Story 1.2's own Dev Notes anticipated. Do not introduce a new storage backend here.
- **`meta.cacheHit` already exists and is already `false` on every fresh generation** (`web/lib/ai/generateVocalChain.ts`) — this story is what actually drives it to `true`, on the response object only, for the specific request that hit the cache.
- **HTTP status choice:** a cache hit returns `200`, not `201`, since nothing new was created — this is a deliberate, minor correctness choice (confirmed no client checks the specific status code, only `response.ok`), not something to "match" to 201 for consistency.
- **No UI changes anywhere in this story** — `loading/page.tsx`'s POST and `results/page.tsx`'s GET-by-id both already handle whatever `VocalChainResponse` shape comes back; a cache hit is indistinguishable to them from a fresh generation except for `meta.cacheHit` and (usually) faster wall-clock time. Confirm this by not touching either file.
- **Not in scope: two near-simultaneous identical requests both missing the cache.** Both would independently call the model client and each get their own `id`; whichever's `saveGeneration` call lands second wins the cache-key slot. No concurrency control exists anywhere in this store today (true since Story 1.2), this story doesn't change that posture, and nothing in the ACs requires it — flagging so it isn't mistaken for a regression this story introduces if it comes up in a future review.

### Project Structure Notes

- All changes are inside `web/lib/schema/`, `web/lib/ai/`, `web/lib/store/`, and `web/app/api/generate/route.ts` — no new files, no new directories. Matches the epic's own framing ("pure backend addition").
- Test files stay colocated with the modules they test, matching every existing convention in this codebase (`*.test.ts` beside its source file, Vitest).

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 2 / Story 2.1]
- [Source: `_bmad-output/planning-artifacts/prds/prd-VocAligner-2026-07-23/prd.md` — FR-4, §8 open question 1 (cache match is exact-text/case-insensitive, no fuzzy matching, confirmed not open for this story)]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-VocAligner-2026-07-23/ARCHITECTURE-SPINE.md` — AD-7, AD-8, AD-10]
- [Source: `_bmad-output/implementation-artifacts/1-2-real-generation-request.md` — Task 1, which explicitly deferred the artist+song lookup to this story]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5

### Debug Log References

- `npx tsc --noEmit`, `npx eslint .`, `npx vitest run` all clean (86/86 tests passing, up from 79 — 5 new in `generationStore.test.ts`, 2 new in `route.test.ts`).
- Verified end-to-end against the running dev server (not just the test suite): a fresh POST returns `201`/`cacheHit: false`; an identical repeat returns `200`/`cacheHit: true` with the *same* `id` and `generatedAt`; a case/whitespace-varied repeat (`"  manual TEST artist  "` vs `"Manual Test Artist"`) also hits; a genuinely different Artist+Song still gets a fresh `201`; `GET /results?id=...` for a cache-hit id still resolves `200`.

### Completion Notes List

- Implemented exactly as scoped in Tasks 1–3, no deviations to the design.
- One real interaction found during implementation, not anticipated in the story: two of the *existing* tests in `route.test.ts` both used the same Artist + Song (`"Frank Ocean"` / `"Thinkin Bout You"`) — harmless before this story, but now a cache hit, since Vitest shares the module-level store across `it()` blocks in the same file. The second test's `getGenerationById(parsed.id)).toEqual(parsed)` assertion would have failed (stored record keeps `cacheHit: false` forever; the cache-hit response says `true`). Fixed by changing that second test's input to a distinct pair (`"Steve Lacy"` / `"Bad Habit"`) — no change to what it actually asserts, just decontaminated its test data. Chose distinct Artist+Song pairs for every new test added, for the same reason.
- `pipelineVersion` added to `vocalChainMetaSchema` as planned; confirmed via grep before starting that no test does a full-object `toEqual` on `meta`, so this was a safe additive change — held true, no unrelated test broke.

### File List

- `web/lib/schema/vocalChain.ts` (modified — added `pipelineVersion` to `vocalChainMetaSchema`)
- `web/lib/ai/generateVocalChain.ts` (modified — stamps `PIPELINE_VERSION` onto `meta`)
- `web/lib/store/generationStore.ts` (modified — added `normalizeCacheKey`, the cache `Map`, and `getCachedGeneration`)
- `web/lib/store/generationStore.test.ts` (modified — 5 new tests for `getCachedGeneration`)
- `web/app/api/generate/route.ts` (modified — checks the cache before generating)
- `web/app/api/generate/route.test.ts` (modified — 2 new cache tests; one existing test's input changed to avoid cross-test cache collision, no assertion changes)

## Review Findings

Independent adversarial review (Blind Hunter, Edge Case Hunter, Acceptance Auditor, run in parallel with no prior context on this story). All 5 ACs and the Dev Agent Record's cross-test-collision fix claim were independently re-verified against the code and confirmed correct — no AC violations found. Two real, unambiguous bugs were found and fixed directly (see Patch below); two items raise a real question about widening documented Architecture Decisions and are left for a founder call rather than silently decided; the rest are pre-existing/out-of-scope and logged to `deferred-work.md`.

- [ ] [Review][Decision] Should `getCachedGeneration` also gate on `schemaVersion`, not just `pipelineVersion`/`promptVersion`? — `entry.meta.schemaVersion` is never checked (`web/lib/store/generationStore.ts:29-36`), which matches AD-8's literal tuple `(Artist+Song key, PIPELINE_VERSION, PROMPT_VERSION)` exactly as written. But `CURRENT_SCHEMA_VERSION` is a separate constant with no code-enforced coupling to `PIPELINE_VERSION` — `pipelineVersion.ts`'s own comment says it should be bumped whenever "a stage's schema shape changes," implying schema changes are *meant* to already be covered by a `PIPELINE_VERSION` bump, but nothing enforces that discipline. Two options: (a) leave as-is, relying on that convention being followed; (b) add `entry.meta.schemaVersion !== CURRENT_SCHEMA_VERSION` to the mismatch check as a second safety net. Not implemented either way — this would change what AD-8 currently specifies, so it's a call for whoever owns the Architecture Spine, not a silent code change.
- [ ] [Review][Decision] Should cache-key normalization widen beyond "trim + lowercase" to include Unicode canonicalization (`.normalize("NFC")`) and/or internal-whitespace collapsing? — AD-7 defines normalization precisely as trim + lowercase, which is exactly what's implemented (`web/lib/store/generationStore.ts:11-13`). But two visually-identical artist/song strings can differ in raw code points (precomposed vs. combining-character accents — the test suite itself uses "Beyoncé") or internal spacing ("Kali  Uchis" vs. "Kali Uchis"), and would miss the cache even though a user would reasonably expect a hit. This isn't "fuzzy matching" (which AD-7 explicitly excludes) — it's the same text — but fixing it means widening AD-7's literal wording, which should be a documented decision, not a quiet code change.
- [x] [Review][Patch] Cache-key collision via unescaped `"::"` delimiter — `normalizeCacheKey` joined artist+song with a raw `${a}::${b}` template, so artist `"Foo::Bar"`/song `"Baz"` and artist `"Foo"`/song `"Bar::Baz"` both normalized to the same key, silently serving one pair's cached result for the other. Independently found by both Blind Hunter and Acceptance Auditor. Fixed by encoding the key via `JSON.stringify([artist, song])` instead; added a regression test proving the collision no longer occurs. [web/lib/store/generationStore.ts:8-14, web/lib/store/generationStore.test.ts]
- [x] [Review][Patch] Cache-hit response only shallow-cloned `cached` (`{ ...cached, meta: {...} }`), leaving nested fields (`chain`/`research`/`reasoning`/`validation`) aliased by reference to the object still sitting in the store's `Map`s. Harmless today (nothing currently mutates a response after receiving it — verified by grepping the whole `web/` tree), but any future code on the hit path that mutated those nested objects in place would silently corrupt the permanently-stored record. Fixed with `structuredClone(cached)` before flipping `meta.cacheHit`, removing the aliasing risk entirely. [web/app/api/generate/route.ts:22-35]
- [x] [Review][Defer] Two near-simultaneous first-time requests for the same new Artist+Song both miss the cache and both call the (paid) model client — real and plausible (e.g. a double-click), but explicitly called out as out of scope in this story's own Dev Notes, and no concurrency control exists anywhere in this store since Story 1.2. [web/app/api/generate/route.ts:22]
- [x] [Review][Defer] AD-8's version-mismatch branch has no reachable path in real usage today — `PIPELINE_VERSION`/`PROMPT_VERSION` are compile-time constants and the store is a bare in-memory `Map` wiped on every process restart, so a stale-version entry can never coexist with the current constants inside one running process. Only exercised by hand-forged test records; becomes a real path once cache storage moves off in-memory, which is already an explicit open/deferred architecture decision. [web/lib/store/generationStore.ts:29-36]
- [x] [Review][Defer] Cache is entirely unbounded (no TTL/LRU/max size) — pre-existing since Story 1.2's original `Map`; "cache storage technology" is already an explicit open/deferred item in the Architecture Spine. This story doubles the growth rate (two `Map`s instead of one) but doesn't introduce the pattern. [web/lib/store/generationStore.ts:5-6]
- [x] [Review][Defer] No test-only reset utility for the module-level store — cross-test isolation currently relies on every test using a unique Artist+Song pair (a human-memory convention, not tooling-enforced). A `resetGenerationStore()` export would be more robust as the suite grows. [web/lib/store/generationStore.ts]
- [x] [Review][Defer] AC1 ("no call to the model client") and AC3 (version-mismatch miss) are proven only indirectly — matching `id`/`generatedAt` across two requests, and a `generationStore`-level unit test with a hand-forged stale entry, rather than a direct spy on `getModelClient`/a route-level integration test. Reasonable proxies given the current control flow, worth strengthening if this path grows more complex. [web/app/api/generate/route.test.ts, web/lib/store/generationStore.test.ts]
- [x] [Review][Defer] Whitespace-only artist/song (e.g. a single space) passes `vocalChainInputSchema`'s `.min(1)` then normalizes to an empty string, so distinct "blank-ish" inputs alias onto the same cache entry. Pre-existing input-validation gap from Story 1.1's schema, not introduced by this story. [web/lib/schema/vocalChain.ts:9-12]

Dismissed as working-as-designed (not written above): a cache hit returning the *original* requester's exact `input` text (not the current request's differing casing/whitespace) is precisely what AC2 requires — the stored response must be unmodified except `meta.cacheHit`.
