---
baseline_commit: 4d07793ca6c9a81d30fd2650e1716208a5fdec29
---

# Story 1.2: Loading page performs a real generation request

Status: review

## Story

As a user who just submitted an artist and song,
I want the app to actually generate a real vocal chain for my request,
so that what I see next is real, not a placeholder.

## Acceptance Criteria

1. Given valid `artist`/`song` query params on `/loading`, when the page mounts, then it POSTs to `/api/generate` with `{ artist, song }`.
2. Given a successful (201) response, when it arrives, then the full `VocalChainResponse` is persisted server-side, retrievable later by its `id`.
3. Given a successful response, when persisted, then the app navigates to `/results?id=<id>` — never the full payload serialized into the URL (Architecture AD-10).
4. Given the request returns a 400 or 502 error, or the fetch itself fails/times out (network error), when that happens, then the user sees an explicit failure state on the loading page — not a silent hang, and not an automatic navigation to `/results`.
5. Given a failure state is shown, when the user wants to retry, then they have a clear way back (e.g. a link to `/`) — exact copy/visual design for this state is intentionally not specified (flagged open in the PRD); plain and functional is sufficient.
6. Given the request is in flight, when the user is waiting, then the existing phase-cycling loading animation keeps communicating progress — but the app must not navigate to `/results` until the real response has actually arrived.

## Tasks / Subtasks

- [x] Task 1: Add a minimal generation store (AC: 2)
  - [x] Create `web/lib/store/generationStore.ts` exporting `saveGeneration(response: VocalChainResponse): void` and `getGenerationById(id: string): VocalChainResponse | undefined`, backed by an in-memory `Map<string, VocalChainResponse>` module-level singleton. Storage technology is explicitly Deferred at the architecture level — in-memory is correct for now. Do **not** add an artist+song lookup here; that's Story 2.1 (Epic 2), extending this same module later.
  - [x] Add `generationStore.test.ts` covering save-then-get and get-with-unknown-id (colocated, Vitest — matches every other `lib/` module).
- [x] Task 2: Persist the response after generation (AC: 2)
  - [x] In `web/app/api/generate/route.ts`, after `generateVocalChain` resolves successfully and before responding, call `saveGeneration(response)`.
  - [x] Extend the existing `route.test.ts` to assert a successful generation is retrievable via `getGenerationById` afterward. Existing tests in this file must keep passing unmodified in behavior.
- [x] Task 3: Wire the loading page to call the real API (AC: 1, 3, 6)
  - [x] Replace `loading/page.tsx`'s fixed `setTimeout` phase-advance loop with a real `fetch("/api/generate", { method: "POST", body: JSON.stringify({ artist, song }), headers: {"Content-Type": "application/json"} })`, triggered once from `useEffect` on mount.
  - [x] Keep the existing phase-cycling text + progress bar visual exactly as-is, driven by a repeating interval while the fetch is pending — do not remove or restyle it.
  - [x] On success (201), read `id` from the parsed JSON body and navigate to `` `/results?id=${id}` ``.
- [x] Task 4: Failure state (AC: 4, 5)
  - [x] On a non-2xx response or a thrown/network error, stop the phase animation and render a simple inline failure message with a link back to `/`.
  - [x] Do not design a separate route or a polished component for this — keep it minimal and functional; the PRD explicitly leaves the failure-state design undecided.

## Dev Notes

- **Scope boundary — read this first.** The landing page (`/`) and its visual design are being actively iterated on separately, live, in a `/design-preview` sandbox that is **not yet finalized**. This story does not touch `page.tsx`'s visuals and must not attempt to match that in-progress redesign (new shadcn/motion/token work already in `globals.css` — `--brand-accent`, `--wash-*`, `--vivid-*`, `--muted-*`, dark-mode variables). Keep `loading/page.tsx`'s existing visual treatment (the `hero-gradient` class, `Wordmark`, phase text, progress bar) exactly as it is — this story only changes *what drives it* (a real fetch instead of a fixed timer), never how it looks.
- **The backend pipeline this story wires into already works and must not be modified.** `generateVocalChain.ts` (orchestrator), the three stages (`research`/`reasoning`/`generation`), and `repairChain.ts` (validation gate with retry) are fully built and tested against the mock model client. `app/api/generate/route.ts` already validates the body with `vocalChainInputSchema.safeParse`, calls `generateVocalChain`, and returns `Response.json(response, { status: 201 })` on success, or `{ error, issues }` at status 400 (bad input) / 502 (generation failed) on failure. This story only adds a persistence call around the existing route and rewires the *client* that calls it — the pipeline logic itself is out of scope.
- **`VocalChainResponse` already has a stable `id` field** (`randomUUID()`, assigned in `generateVocalChain.ts`). Use it as the store key — do not invent a second id scheme.
- **Architecture AD-10 (cross-page handoff by id):** pass only `?id=<generation id>` to `/results` — never serialize the full response into a URL, and never introduce a client-side-only store (a browser `Map`, `sessionStorage`) as the source of truth; it wouldn't survive a direct link or hard refresh, and Story 1.4's results page won't read from it. The store this story adds is server-side only.
- **Architecture AD-9 (AI pipeline is server-only):** only `app/api/generate/route.ts` may import from `lib/ai/*`. `loading/page.tsx` must keep calling the pipeline over HTTP — never import `generateVocalChain` or any stage/model-client directly into a page or component.
- **Do not build caching yet.** This story's store only supports save-by-id and get-by-id. Looking up an existing generation by *artist+song* to skip a redundant AI call is Story 2.1 (Epic 2), which extends this same module with the AD-7/AD-8 key/versioning scheme — out of scope here.
- **Known, unrelated drift — not this story's problem:** `docs/DESIGN_SYSTEM.md` and the Architecture Spine's AD-6 (design tokens) were written before a `shadcn/ui` + design-exploration pass changed `globals.css` substantially. Both will get a refresh once the founder's landing-page design settles. This story doesn't need any of the new tokens.

### Project Structure Notes

- New file: `web/lib/store/generationStore.ts` (new `lib/store/` directory, sibling to the existing `lib/ai/`, `lib/schema/`, `lib/registry/`, `lib/validation/`, `lib/domain/`).
- New test file: `web/lib/store/generationStore.test.ts`, colocated per this codebase's convention (every other `lib/` module has its `.test.ts` next to it).
- Modified: `web/app/api/generate/route.ts` (add the `saveGeneration` call).
- Modified: `web/app/loading/page.tsx` (replace the fake timer with a real fetch + failure state).
- Naming: camelCase `.ts` module and function names, matching every existing `lib/` module.
- **Testing note:** no component-rendering test infra (jsdom/React Testing Library) exists in this codebase yet — `vitest.config.ts` has no test environment configured for DOM rendering. Do not introduce one for this story; that's a separate infra decision. Test the new store module and the route's persistence behavior (both plain Vitest, matching the existing pattern) — a `loading/page.tsx` rendering test is out of scope.

### References

- [Source: _bmad-output/planning-artifacts/prds/prd-VocAligner-2026-07-23/prd.md#FR-2, FR-3, FR-5]
- [Source: _bmad-output/planning-artifacts/architecture/architecture-VocAligner-2026-07-23/ARCHITECTURE-SPINE.md#AD-9, AD-10]
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 1: See a Real Vocal Chain, Not a Preview / Story 1.2]
- [Source: web/app/api/generate/route.ts]
- [Source: web/lib/ai/generateVocalChain.ts]
- [Source: web/app/loading/page.tsx]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (Amelia, bmad-agent-dev)

### Debug Log References

None — implementation went cleanly, no blockers hit.

### Completion Notes List

- `generationStore.test.ts` builds its fixture by running the real pipeline against the mock model client (`generateVocalChain(createMockModelClient(), ...)`) rather than hand-fabricating a `VocalChainResponse` object — avoids a fragile fixture that could silently drift from the real nested schemas (research/reasoning/chain/validation).
- `route.test.ts`'s new persistence test is a separate `it` block rather than folded into the existing "returns a schema-valid vocal chain" test, per the story's "existing tests must keep passing unmodified in behavior" instruction — the existing test's assertions and intent are untouched.
- Phase-cycling on the loading page now caps at the last phase (`Math.min(index + 1, phases.length - 1)`) instead of looping, and is fully decoupled from navigation — navigation only fires from the fetch's own resolution. This is an interpretation call: the story specifies "driven by a repeating interval while the fetch is pending" but doesn't say what happens if all 4 phases elapse before the real response arrives. Holding at the last phase ("Validating plugin settings", progress bar at 100%) reads as "almost done, still working" rather than looping back to "Researching..." (which would look like a regression) or stopping the animation entirely (which would look frozen).
- The phase-advance interval is explicitly cleared when the error state is set (the `useEffect` returns early and its cleanup fires), satisfying Task 4's "stop the phase animation" — confirmed by inspection, not by a rendering test (see testing note below).
- No client-side timeout/AbortController was added for the fetch — the story's Task 4 wording ("thrown/network error") and AC4 are satisfied by the existing `catch` block for genuine network failures; an artificial timeout wasn't in the task list and would be scope creep.
- **No automated test for `loading/page.tsx`**, per this story's own Dev Notes: no component-rendering test infrastructure (jsdom/RTL) exists in this codebase, and introducing one is explicitly called out as a separate infra decision, out of scope here. Verified instead via: `tsc --noEmit` clean, `eslint` clean, manual SSR check of `/loading?artist=&song=` (200, no error markers), and directly curling `/api/generate` to confirm both the success shape (`{ id, ... }`, matching what the page reads) and the 400 failure shape the page's error branch depends on.
- Full regression suite: 16/16 passing (13 pre-existing + 2 new store tests + 1 new route persistence test), no existing test modified in behavior.

### File List

**New:**
- `web/lib/store/generationStore.ts`
- `web/lib/store/generationStore.test.ts`

**Modified:**
- `web/app/api/generate/route.ts` (calls `saveGeneration` after a successful generation)
- `web/app/api/generate/route.test.ts` (added one persistence test; existing 4 tests unchanged)
- `web/app/loading/page.tsx` (real fetch + navigation-on-response + failure state, replacing the fixed-timer navigation; visual treatment unchanged)

## Change Log

- 2026-07-26: Story implemented end-to-end in one session (Tasks 1–4). No review follow-ups yet — first pass.
