---
baseline_commit: fac2ee27df5c2806b4879cdb5c1713f78c79c177
---

# Story 3.2: Guarantee a minimum-quality reasoning and generation result

Status: done

## Story

As a user,
I want every generation to come back with a genuinely useful analysis and plugin chain,
so that I never see a "successful" result that's actually empty or near-empty.

## Background

Discovered through live testing against the real Anthropic API immediately after Story
3.1 shipped (same day, same session) -- not a theoretical concern, a reproduced live
incident. Once `ANTHROPIC_API_KEY` was configured and real generations were run:

- A fresh "Adele -- Rolling in the Deep" generation came back with `reasoning.processingIntents: []`
  and `chain.plugins: []` -- a fully empty result, returned as a normal `201` with
  `validation.status: "valid"`.
- A repeat "Blinding Lights" generation came back with exactly one compressor and nothing else.
- An earlier "Billie Eilish -- bad guy" generation produced a single processing intent whose
  `observation`/`goal` fields were the literal string `"placeholder"`.

Root cause: neither `reasoningSchema.processingIntents` nor `chainSchema.plugins` had a
minimum-length requirement, so an empty or near-empty array satisfies both schemas'
*shape* even though it's a real analytical failure. Compounding factor: unlike the
Generation stage (which already retries up to `MAX_GENERATION_ATTEMPTS` when
`validateAndRepairChain` rejects it), the Reasoning stage had no retry at all and no
quality floor -- a thin result was returned straight through as the final answer.

This exact risk was actually flagged as a theoretical concern during Story 1.4's review
("An empty `chain.plugins` array has no dedicated handling in `results/page.tsx`...
should the pipeline guarantee at least one plugin, or should the page guard against
zero?") and left as an open question at the time. It has now been confirmed as a real,
live production behavior, not a hypothetical -- this story closes that open question by
having the pipeline guarantee the floor, rather than pushing the guard onto the page.

## Acceptance Criteria

1. Given the Reasoning stage returns fewer than 3 processing intents, when `generateVocalChain` runs, then that attempt is treated as a failure and retried (up to `MAX_REASONING_ATTEMPTS`) rather than accepted as a final result.
2. Given the Generation stage returns zero plugins, when `generateVocalChain` runs, then that attempt is treated as a failure and retried (up to `MAX_GENERATION_ATTEMPTS`, sharing the same retry budget and code path already used for a `validateAndRepairChain` domain-rejection) rather than accepted as a final result.
3. Given every retry attempt for a stage is exhausted, when `generateVocalChain` runs, then it throws `VocalChainGenerationError` (the same error class and API-route handling that already exists for a domain-rejected chain) rather than silently returning a thin result.
4. Given Anthropic's strict tool mode (`strict: true`, added in Story 3.1's follow-up fix) only supports `minItems` of `0` or `1` -- confirmed empirically via a live `400 invalid_request_error` when this story first tried `.min(3)` directly on the wire-facing schema -- the quality floor above `1` is enforced as an explicit application-level check after the model call returns, not as a JSON Schema constraint sent to Anthropic.
5. Given this story changes `generateVocalChain.ts`'s control flow for both stages, when it ships, then all existing tests still pass unmodified and new tests cover: a too-thin result being retried then succeeding, and every retry being exhausted and producing `VocalChainGenerationError`, for both stages independently.

## Tasks / Subtasks

- [x] Task 1: Add a hard floor to the wire-facing (Anthropic-visible) schemas (AC: 4)
  - [x] `web/lib/ai/stages/reasoningStage.ts`: `reasoningModelOutputSchema.processingIntents` gets `.min(1)` -- confirmed via a live API call this is the maximum supported by strict mode; `.min(3)` was tried first and produced a live `400` (`"minItems" values other than 0 or 1 are not supported`), isolated to this exact schema via a per-schema live probe before settling on this fix.
  - [x] `web/lib/ai/stages/generationStage.ts`: `generationModelOutputSchema.plugins` gets `.min(1)` -- confirmed via the same live probe this value is accepted.
  - [x] `web/lib/schema/reasoning.ts` / `web/lib/schema/chain.ts`: the public domain schemas (`reasoningSchema`, `chainSchema`) get `.min(3)` / `.min(1)` respectively -- safe at any value since these are only ever used via `.parse()` in application code, never converted to a tool's `input_schema` and sent over the wire.

- [x] Task 2: Enforce the real quality floor (>1) as an application-level check (AC: 1, 4)
  - [x] `web/lib/ai/stages/reasoningStage.ts`: after `generateStructured` returns, an explicit `MIN_PROCESSING_INTENTS = 3` check throws `ModelResponseValidationError` (same error class the client already throws for a shape failure) if the result has fewer intents than that, before ids are assigned or `reasoningSchema.parse()` is called.
  - [x] No equivalent manual floor added for Generation beyond the `.min(1)` wire-schema check -- the observed Generation-stage failures (zero plugins, one plugin) both trace back to a thin Reasoning result cascading downward; fixing Reasoning's real quality floor is expected to naturally give Generation enough processing intents to produce a fuller chain. Not adding an un-diagnosed second floor here, per this project's own "simplest solution for what's needed" principle.

- [x] Task 3: Retry both stages on a too-thin result, not just accept it (AC: 1, 2, 3)
  - [x] `web/lib/ai/generateVocalChain.ts`: Reasoning stage call wrapped in a retry loop (new `MAX_REASONING_ATTEMPTS = 2`), catching `ModelResponseValidationError` specifically and retrying; any other thrown error still propagates immediately, unchanged.
  - [x] Generation stage's existing `MAX_GENERATION_ATTEMPTS` retry loop (previously only re-entered on a `validateAndRepairChain` domain-rejection) now also catches a thrown `ModelResponseValidationError` from `runGenerationStage` itself, folding it into the same `{status: "rejected", issues: [...]}` shape so one shared attempts budget covers both "malformed/too-thin" and "domain-rejected" -- this also fixes a **pre-existing, unrelated gap**: before this story, a Generation-stage schema-validation failure of any kind (not just the new too-thin case) was never retried at all and crashed the whole request uncaught.
  - [x] Both exhausted-retries paths throw `VocalChainGenerationError`, reusing the existing error class and the API route's existing `catch` handling (`502` with `issues`) -- no route-level changes needed.

- [x] Task 4: Test coverage (AC: 5)
  - [x] New `web/lib/ai/generateVocalChain.test.ts` (none existed before this story) with a scripted `ModelClient` that validates each canned response against the *real* schema it's given (mirrors the `ModelClient` contract's own "implementations must guarantee data satisfies schema" comment), so the actual `.min()` floors are exercised, not a hand-rolled fake constraint. Covers: full first-try success; Reasoning retry-then-succeed for both a fully empty response and a too-few-but-schema-valid response (specifically exercising the manual `MIN_PROCESSING_INTENTS` check, distinct from the wire schema's `.min(1)`); Reasoning retries-exhausted; Generation retry-then-succeed for a zero-plugin response; Generation retries-exhausted; and a regression check that the pre-existing domain-rejection retry (unknown plugin id) still works unchanged alongside the new schema-throw handling.
  - [x] All 94 pre-existing tests continue to pass unmodified (the mock client's fixtures -- 3 intents, 4 plugins -- sit safely above every new floor).

### Review Findings

Independent adversarial review (Blind Hunter, Edge Case Hunter, Acceptance Auditor, run in parallel with no prior context on this story). The Acceptance Auditor independently re-verified this story's two highest-risk claims rather than taking the story file's word for them: (1) grepped every `generateStructured(` call site and confirmed only the wire-facing `reasoningModelOutputSchema`/`generationModelOutputSchema` (both `.min(1)`) ever reach `z.toJSONSchema()` -- `reasoningSchema`/`chainSchema` (the domain schemas carrying the full `.min(3)`/`.min(1)` floors) are never sent over the wire, supporting AC4's strict-mode `minItems` claim; (2) traced `validateAndRepairChain`'s return type and confirmed it always returns a real `Chain`, so the defensive `if (!chain)` check in `generateVocalChain.ts` is genuinely just TypeScript narrowing, not a masked bug. All 5 ACs independently re-verified against the code and confirmed satisfied. No finding required changing a ratified Architecture Decision.

- [x] [Review][Patch] Both retry loops in `generateVocalChain.ts` discarded every attempt's error except the last one, so a final `VocalChainGenerationError` after exhausted retries only ever explained the *most recent* failure -- independently flagged by both Blind Hunter and Edge Case Hunter (two reviewers agreeing being a strong signal this was real). Fixed: both loops now accumulate issues across every failed attempt into an array, and the thrown error carries the full retry history. As a side effect, this also closed a related Edge Case Hunter finding: the reasoning loop's old `!reasoning` defensive fallback (mirroring the `!chain` check) had no dedicated message and could have rendered the literal string `"undefined"` if ever reached without a tracked error -- the redesigned loop makes that state unreachable by construction (it only exits without a `reasoning` value when at least one issue was pushed). Two new regression tests added; one existing test's assertion loosened from an exact one-element array to `expect.arrayContaining(...)` to reflect the new (correct) accumulated-issues shape. [web/lib/ai/generateVocalChain.ts, web/lib/ai/generateVocalChain.test.ts]
- [x] [Review][Patch] `MIN_PROCESSING_INTENTS` was a literal duplicated by hand across two files -- `reasoningStage.ts`'s local `const` and `reasoning.ts`'s `.min(3)` call -- kept in sync only by comments cross-referencing each other, per Blind Hunter. Now a single constant exported from `schema/reasoning.ts` and imported by `reasoningStage.ts`, so the two can no longer drift. [web/lib/schema/reasoning.ts, web/lib/ai/stages/reasoningStage.ts]
- [x] [Review][Patch] The comment above `generateVocalChain.ts`'s reasoning retry loop misattributed the `.min(3)` floor to `reasoningModelOutputSchema` (which actually carries only `.min(1)`, the wire-safe floor -- `.min(3)`/`MIN_PROCESSING_INTENTS` is the separate manual application-level check), per the Acceptance Auditor. It also understated the catch's real scope: it accepts *any* `ModelResponseValidationError` thrown by the stage, not just a too-thin result, per Blind Hunter. Both comments rewritten for accuracy. [web/lib/ai/generateVocalChain.ts, web/lib/ai/stages/reasoningStage.ts]
- [x] [Review][Patch] Minor naming inconsistency between the two retry loops (bare `attempts`/`validation` vs. `reasoningAttempts`/`reasoningError`), per Blind Hunter -- generation loop's counter renamed to `generationAttempts` for symmetry. [web/lib/ai/generateVocalChain.ts]
- [x] [Review][Defer] Research stage carries none of this story's protection -- `researchSchema` has no `.min()` floor and `generateVocalChain.ts` wraps `runResearchStage` in no retry, per Blind Hunter. A deliberate scope decision (Research consistently returned rich content in every live test this session; only Reasoning/Generation showed the thin-output bug), not an oversight, but the same failure class this story fixed for the other two stages could in principle still occur here. Revisit if a thin/empty Research result is ever observed live.
- [x] [Review][Defer] Pre-existing, unrelated to this diff: a `ModelResponseValidationError` thrown by `runResearchStage` propagates unwrapped out of `generateVocalChain` -- confirmed against `web/app/api/generate/route.ts`, whose catch only special-cases `VocalChainGenerationError` (clean 502) and rethrows everything else (unhandled 500), per Blind Hunter. Not introduced or worsened by this story; natural companion fix to the item above if Research ever gets its own floor.
- [x] [Review][Defer] Compounding retry cost is unbounded and invisible in production -- worst case is now up to ~5 stage-level attempts (1 Research + 2 Reasoning + 2 Generation), each of which can itself trigger the Anthropic adapter's own transport-level retries, with no logging of how often the new retry paths fire and no route-level timeout override, per Blind Hunter.
- [x] [Review][Defer] Neither `runReasoningStage` nor `runGenerationStage` is called with the existing `observe` telemetry callback in `generateVocalChain.ts` (pre-existing, not introduced by this story), per Blind Hunter -- no production visibility into how often the new retry logic actually triggers.
- [x] [Review][Defer] The empirically-discovered "Anthropic strict-mode caps `minItems` at 0 or 1" constraint is documented only in code comments, with no automated test pinning it as an executable assertion, per Blind Hunter. A schema-introspection test (asserting `z.toJSONSchema(...)`'s `minItems` stays at 1 for both wire schemas) would guard against a future regression, but would require exporting currently-private schema constants -- a small design change of its own, left as a follow-up rather than done opportunistically here. (This project has no live-API integration tests anywhere, by design, since they'd cost real money in CI -- a comment-documented empirical finding is the established pattern, not unique to this story.)
- [x] [Review][Defer] The new test file doesn't cover a thin/empty Research response -- consistent with the Research-stage scope decision above, per Blind Hunter.

Dismissed as noise or already-decided (not filed as separate deferred items): retries being "blind" (identical prompt resent on each attempt, no feedback to the model about what was thin) -- matches the pre-existing Generation-retry pattern this story extends, and the Dev Notes explicitly reject a heavier design as premature; no evidence backing floor value "3" -- an acknowledged founder judgment call, documented in Dev Notes, not a defect; Generation having no second-tier floor above `.min(1)` (unlike Reasoning's `MIN_PROCESSING_INTENTS`) -- a deliberate, documented scope decision with explicit revisit criteria that still holds (every Generation-stage failure actually observed traces to thin Reasoning input, not a rich-input/thin-output case).

Note: this review's `defer` findings are recorded here only, not appended to `deferred-work.md` as the skill's default workflow would otherwise do -- that file has an unrelated pending edit in the working tree at review time (a pre-fix incident log for this exact story's bug) that was explicitly out of scope to touch further.

`npx tsc --noEmit`, `npx eslint .`, and `npx vitest run` all clean after these patches (104/104 tests, up from 102 -- 2 new regression tests for the issue-accumulation fix).

## Dev Notes

- **The `minItems` discovery is the most important thing in this story to sanity-check on review.** It was found empirically, not from documentation: a live `400 invalid_request_error` when `.min(3)` was first tried directly on `reasoningModelOutputSchema`, with the exact response body `"tools.0.custom: For 'array' type, 'minItems' values other than 0 or 1 are not supported (got: [2, 5])"`. Isolated to this specific schema (not research, not generation) via three separate live per-schema probe calls before landing on the `.min(1)` + manual-check split described in Task 1/2. Worth an independent check that this constraint is real and not a transient/misdiagnosed error, and that the split-enforcement design is the right response to it rather than, say, avoiding `strict: true` for this one tool.
- **Architecture AD-2 (`ModelClient is the only AI-provider boundary`) is unaffected.** No new provider-SDK imports; the new floors and retry logic live entirely in `generateVocalChain.ts` and the two stage files, none of which import `@anthropic-ai/sdk` directly.
- **Why 3, not some other number, for `MIN_PROCESSING_INTENTS`:** a judgment call, discussed directly with the founder rather than picked unilaterally. Real successful generations this session produced 6-15 intents; 3 was chosen as a floor low enough to never falsely reject a genuinely modest-but-real analysis, while still ruling out the empty/near-empty cases actually observed.
- **Why no equivalent manual floor above 1 for Generation:** a deliberate scope decision, not an oversight -- every Generation-stage failure actually observed (zero plugins, one plugin) is consistent with "thin Reasoning input in, thin chain out," which Task 2's Reasoning fix already addresses upstream. Revisit if a future thin Generation result is observed with a *rich* Reasoning input feeding it, which would indicate a distinct Generation-stage issue this story didn't anticipate.
- **This story's retry loops are a natural extension of an existing, already-reviewed pattern**, not new architecture: the Generation stage already retried on domain-rejection before this story; this story (a) extends that same loop to also catch a thrown schema error, and (b) adds one new but structurally identical loop for Reasoning. Considered and rejected a heavier design (e.g. a shared generic retry helper) as premature given there are only two call sites.

### Project Structure Notes

- Changes are inside `web/lib/ai/generateVocalChain.ts`, `web/lib/ai/stages/reasoningStage.ts`, `web/lib/ai/stages/generationStage.ts`, `web/lib/schema/reasoning.ts`, `web/lib/schema/chain.ts`, plus the new `web/lib/ai/generateVocalChain.test.ts`. No new source directories.

### References

- [Source: this session's live testing -- three real reproductions (Adele empty result, Blinding Lights one-plugin result, Billie Eilish "placeholder" result) that motivated this story]
- [Source: `_bmad-output/implementation-artifacts/1-4-results-page-real-chain.md` review findings -- the empty-`chain.plugins` concern this story confirms and closes]
- [Source: `_bmad-output/implementation-artifacts/deferred-work.md` -- "Found via live testing against the real Anthropic API, post-3.1" entry logging this bug before the fix was implemented]
- [Source: `web/lib/ai/errors.ts` -- `ModelResponseValidationError`'s own doc comment: "retry policy for it belongs to the orchestrator (per stage), not the client adapter", the design principle this story implements for both stages]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5

### Debug Log References

- `npx tsc --noEmit`, `npx eslint .`, `npx vitest run` all clean (102/102 tests passing, up from 94 -- 8 new in `generateVocalChain.test.ts`).
- Live-verified the bug before fixing it: reproduced the empty-result and one-plugin cases against the real API (see `deferred-work.md` entry).
- Live-verified the `minItems` constraint empirically: isolated per-schema probe calls against `research`/`reasoning`/`generation` wire schemas identified `reasoningModelOutputSchema` with `.min(3)` as the sole failure, confirmed `.min(1)` is accepted.
- Live-verified the actual fix end-to-end against the real API post-correction: a fresh "Harry Styles -- As It Was" generation returned 12 processing intents, 7 plugins, `validation.status: "valid"`.

### Completion Notes List

- Implemented as scoped in Tasks 1-4. One in-flight design correction: `.min(3)` was initially placed directly on the wire-facing `reasoningModelOutputSchema` (matching the domain schema's floor 1:1), discovered live to be rejected by Anthropic's strict tool mode, and redesigned as described in Tasks 1-2 before this story was considered complete.
- Also fixed, as a direct consequence of Task 3's generation-stage retry-loop change: a pre-existing gap where any Generation-stage schema-validation failure (not just the new too-thin case) previously crashed the whole request uncaught, with no retry at all. Not separately tracked as its own story since it's the same code path this story was already changing.

### File List

- `web/lib/ai/generateVocalChain.ts` (modified -- retry loops for both stages)
- `web/lib/ai/stages/reasoningStage.ts` (modified -- `.min(1)` wire floor + manual `MIN_PROCESSING_INTENTS` check)
- `web/lib/ai/stages/generationStage.ts` (modified -- `.min(1)` wire floor)
- `web/lib/schema/reasoning.ts` (modified -- `.min(3)` domain floor)
- `web/lib/schema/chain.ts` (modified -- `.min(1)` domain floor)
- `web/lib/ai/generateVocalChain.test.ts` (new -- 8 tests)
