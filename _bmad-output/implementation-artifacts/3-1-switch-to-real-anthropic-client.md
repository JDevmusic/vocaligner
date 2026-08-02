---
baseline_commit: d8e2c1943ce9c3daca6686fdc56c10f4dd17bcee
---

# Story 3.1: Switch to the real Anthropic model client

Status: ready-for-review

## Story

As a user,
I want my vocal chain to come from genuine AI research about the artist/song,
so that the recommendation is actually accurate, not simulated.

## Acceptance Criteria

1. Given an `ANTHROPIC_API_KEY` is configured in the server environment, when `getModelClient()` is called, then it returns the real Anthropic-backed client instead of the mock (PRD hardens FR-2/FR-3 from simulated to real; Architecture AD-2).
2. Given no `ANTHROPIC_API_KEY` is configured (e.g. a fresh local checkout), when `getModelClient()` is called, then it falls back to the mock client so local development still works without requiring a key.
3. Given this story ships live AI calls for the first time, when it is implemented, then the hardcoded, superseded `DEFAULT_MODEL` id in `anthropicModelClient.ts` is consciously updated to a current model.
4. Given the founder is new to environment-variable/secrets handling, when this story ships, then it clearly explains what `.env.local` is, why it's never committed, and includes a committed `.env.example` documenting the required variable name (no real value).
5. Given no rate-limiting/abuse-prevention exists on the generation endpoint (confirmed non-goal, PRD §5/§8) and this story is what turns on real per-request AI cost for the first time, when this story is delivered, then the founder is explicitly, directly told this before/at the point it ships — not solved here, but not an accidental surprise either.

## Tasks / Subtasks

- [x] Task 1: Add the mock/live switch to `getModelClient()` (AC: 1, 2)
  - [x] **Read `web/lib/ai/getModelClient.ts` fully first** — it's a 6-line module, always returns `createMockModelClient()` unconditionally today. This task is the entire reason the file exists as a separate module rather than callers constructing a client directly — confirmed by Architecture (see Dev Notes).
  - [x] Change it to: if `process.env.ANTHROPIC_API_KEY` is set (non-empty), return `createAnthropicModelClient()` (no options — it already reads `ANTHROPIC_API_KEY`/`ANTHROPIC_MODEL` from `process.env` itself as documented defaults in `anthropicModelClient.ts`, so nothing needs to be passed through); otherwise return `createMockModelClient()`.
  - [x] Do not add a third `options`/override parameter to `getModelClient()` — no current caller needs one (checked: only `app/api/generate/route.ts` calls it, with zero arguments), and `createAnthropicModelClient` already exposes its own options object directly for tests that need to inject a fake client.
  - [x] Add `web/lib/ai/getModelClient.test.ts` (new file — none exists today): one test asserting it returns a client whose `modelId` matches the mock's known id when `ANTHROPIC_API_KEY` is unset (delete it from `process.env` at the top of the test, matching the pattern `anthropicModelClient.test.ts`'s own "throws a clear error when no API key is available" test already uses for cleanup); one test asserting it returns a client whose `modelId` is the real model id when `ANTHROPIC_API_KEY` is set to a dummy non-empty string. **Do not call `.generateStructured()` on the real-client branch in this test** — constructing an `Anthropic` client is free and offline; only an actual `generateStructured()` call would attempt a real network request. Restore `process.env.ANTHROPIC_API_KEY` to its original value after each test that touches it (same pattern as the existing test file).

- [x] Task 2: Swap the superseded `DEFAULT_MODEL` (AC: 3)
  - [x] In `web/lib/ai/anthropicModelClient.ts`, change `DEFAULT_MODEL = "claude-sonnet-4-5-20250929"` to `DEFAULT_MODEL = "claude-sonnet-5"` — the current Sonnet-tier model id as of this story, matching the same cost/quality tier the superseded id was already chosen for (this is a like-for-like id refresh, not a tier change to Opus/Haiku).
  - [x] No test currently asserts on the literal `DEFAULT_MODEL` string (checked `anthropicModelClient.test.ts` — every test either passes an explicit `model:` option or doesn't inspect `modelId` at all), so this is a safe, isolated one-line change.

- [x] Task 3: Document the env var without committing any secret (AC: 4)
  - [x] **Confirmed (checked with `git check-ignore -v`): `web/.gitignore`'s `.env*` rule (line 34) does silently match `.env.example` too.** Add a `!.env.example` negation line directly after it (`.gitignore` evaluates rules in order, so a negation must come after the pattern it's un-ignoring) before adding the file itself, or it will look committed locally but silently never actually be tracked by git.
  - [x] Add `web/.env.example` (new file, committed to git) containing:
    ```
    # Copy this file to .env.local (which is gitignored and never committed)
    # and fill in your real key. Get a key at https://console.anthropic.com/
    ANTHROPIC_API_KEY=
    # Optional -- overrides the default model id in anthropicModelClient.ts
    # ANTHROPIC_MODEL=
    ```
  - [x] **Confirmed: `web/README.md` is still the untouched default `create-next-app` boilerplate** — it has a "Getting Started" section (before the `npm run dev` instructions) that's the natural place to insert this. Add a short step there explaining in plain terms: copy `.env.example` to `.env.local`, paste in a real Anthropic API key, restart the dev server. Explicitly state `.env.local` is already gitignored and must never be committed.
  - [x] Do **not** create `web/.env.local` yourself as part of this story — that would require a real API key, which only the founder has/should decide when to add. This story ships the switch-over code and the documentation for the founder to complete the last step themselves.

- [x] Task 4: Surface the rate-limiting/cost non-goal directly, not silently (AC: 5)
  - [x] This is a communication task, not a code task — no non-goal "fix" is in scope here (confirmed non-goal, PRD §5 and §8: "a conscious, near-term cost exposure for a solo founder, not an oversight. Revisit before or immediately after live Anthropic integration ships").
  - [x] Whoever delivers this story must explicitly tell the founder, before or at the point `ANTHROPIC_API_KEY` is actually set in any real environment: the `/api/generate` endpoint is public, unauthenticated, and free-text — every submission (repeat ones included, unless Epic 2's cache already covers them) now costs real money per call, and nothing in the app currently limits how often that can happen. Not asking for a decision on how to fix it yet, just confirming they know it's live.

## Dev Notes

- **Architecture AD-2 (`ModelClient is the only AI-provider boundary`, ADOPTED) governs this whole story:** only `lib/ai/*ModelClient.ts` files may import a provider SDK. `getModelClient.ts` itself imports neither SDK directly — it only imports the two existing factory functions (`createAnthropicModelClient`, `createMockModelClient`), so the switch this story adds stays fully compliant without needing any AD-2 exception. Do not import `@anthropic-ai/sdk` into `getModelClient.ts` itself.
- **Architecture AD-9 (only `app/api/generate/route.ts` may import `lib/ai/*`)** is unaffected by this story — `getModelClient()` is already the only thing `route.ts` calls, this story only changes what that one function returns.
- **The Anthropic client side is already fully built and already tested** (`web/lib/ai/anthropicModelClient.ts`, `anthropicModelClient.test.ts`) — retries with backoff, timeout, structured output via forced tool-use, and a clear thrown error when no API key is available and no client is injected. This story does **not** touch that file's logic at all except the one-line `DEFAULT_MODEL` swap in Task 2. Do not re-implement or restructure anything in `anthropicModelClient.ts`.
- **This is the first story in the whole project that can make a real, billed network call.** Every other story to date has run exclusively against the deterministic mock client. Treat any test touching the "live" branch with real caution: never let a test actually reach `generateStructured()` on a real-key-configured client — assert on `modelId` only, exactly as Task 1 specifies.
- **Epic 2's cache (Story 2.1) already reduces repeat-request cost** for identical Artist+Song pairs once this ships — worth mentioning to the founder alongside the Task 4 conversation as a (partial, not complete) mitigating factor already in place, not a reason to skip that conversation.
- **`.env.local` vs `.env.example`, explained plainly (for the Task 3 README section, and worth restating to the founder directly when this ships):** `.env.local` is where real secrets live on each machine that runs this app — it's excluded from git (`web/.gitignore`'s `.env*` line) so a real API key is never pushed to GitHub or seen by anyone else with repo access. `.env.example` is the opposite: a safe, committed template showing *which* variables are needed, with no real values in it, so anyone setting up the project knows what to create without ever seeing (or needing) someone else's actual key.

### Project Structure Notes

- Changes are inside `web/lib/ai/getModelClient.ts` (+ new `.test.ts`), one line in `web/lib/ai/anthropicModelClient.ts`, a new `web/.env.example`, and a `web/README.md` addition. No new source directories.
- Confirmed via `find`: no `.env*` file of any kind currently exists in `web/` — this story introduces the first one (`.env.example`, safe to commit).

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 3 / Story 3.1]
- [Source: `_bmad-output/planning-artifacts/prds/prd-VocAligner-2026-07-23/prd.md` — FR-2, FR-3, §5/§8 non-goal on rate-limiting]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-VocAligner-2026-07-23/ARCHITECTURE-SPINE.md` — AD-2, AD-9, Deferred section's "Anthropic model id" note]
- [Source: `web/lib/ai/anthropicModelClient.ts`, `web/lib/ai/anthropicModelClient.test.ts` — already-built real client and its existing test conventions]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5

### Debug Log References

- `npx tsc --noEmit`, `npx eslint .`, `npx vitest run` all clean (92/92 tests passing, up from 90 — 2 new in `getModelClient.test.ts`).
- Verified `git check-ignore -v web/.env.example` confirms the `!.env.example` negation actually works (file shows as untracked/visible in `git status`, not silently swallowed).
- Verified end-to-end against the running dev server with no `ANTHROPIC_API_KEY` set in the shell: a real POST to `/api/generate` still returns `201` with `meta.model: "mock"` and a working chain — no regression to the default (no-key) experience, which is what every real user hits until a key is configured.
- Did **not** test the live-Anthropic branch against the real network (no real API key available in this session, and the story's own Dev Notes explicitly say not to let any verification reach a real `generateStructured()` call) — the switch logic itself is proven by `getModelClient.test.ts`, which asserts on `modelId` only, exactly as scoped.

### Completion Notes List

- Implemented exactly as scoped in Tasks 1–3, no deviations.
- Task 4 (surfacing the rate-limiting/cost non-goal) is a communication task, not code — handled directly with the founder in conversation at delivery time, per the story's own framing; nothing to check off in code for it.
- `DEFAULT_MODEL` swapped to `claude-sonnet-5` (current Sonnet-tier id at the time of this story), confirmed via grep that no test asserts on the literal string.

### File List

- `web/lib/ai/getModelClient.ts` (modified — mock/live switch)
- `web/lib/ai/getModelClient.test.ts` (new — 2 tests)
- `web/lib/ai/anthropicModelClient.ts` (modified — `DEFAULT_MODEL` swap, one line)
- `web/.gitignore` (modified — added `!.env.example` negation)
- `web/.env.example` (new — safe, committed template, no real secret)
- `web/README.md` (modified — plain-language env var setup section)
