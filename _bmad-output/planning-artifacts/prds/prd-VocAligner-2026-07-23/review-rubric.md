# PRD Quality Review — VocAligner

## Overall verdict

This PRD is unusually well-disciplined mechanically — Glossary, IDs, assumption roundtrips, and cross-references are all clean, and the honesty around placeholders (§7) and open tensions (§8, `[NOTE FOR PM]`) is genuine rather than performative. The one structural problem that undercuts its usefulness is that it's written as if VocAligner were greenfield: the repo already has a working mock generation pipeline (research/reasoning/generation stages, a Plugin Registry, a validation-and-repair layer, an API route, and a scaffolded-but-unwired Anthropic adapter) that maps almost line-for-line onto FR-2/FR-3/FR-4/FR-5, and the PRD never says so. A second, load-bearing gap: FR-2 has no testable consequence for when research finds little or nothing about an obscure song — only downstream Plugin Registry validity is checked, not research adequacy — which is a real risk to the product's core promise of *accuracy*, not just recreatability.

## Decision-readiness — adequate

Trade-offs are mostly named honestly rather than smoothed over. §4.3/§6.2 admit the MVP reuses "one default visual treatment" instead of bespoke per-plugin visuals and says why (time-to-ship), §6.2 flags that Save Vocal Chain is deliberately paired with the live-AI cutover rather than silently dropped, and §7 is refreshingly upfront that its own Success Metrics are placeholders, not KPIs — that's a PRD acknowledging its own weak spot rather than dressing it up. Open Questions in §8 are genuinely unresolved (cache-match rules, cache scope, pricing, failure-state copy, numeric targets) — none read as rhetorical.

The one place decision-readiness is dodged rather than surfaced: nowhere does the PRD name the risk that an AI "researching" an obscure or non-existent song may have little real information to work from, and could still emit a Plugin-Registry-valid chain that is essentially fabricated. §2.2 addresses a *related* but different concern (no claim of forensic accuracy vs. the real master), which is not the same as "did the AI actually find anything to base this on." A decision-maker pushing back with "how do we know the chain reflects real research and isn't just a plausible-sounding guess?" would find no answer in this document — see the matching Done-ness finding below, which is where this gap is most consequential.

### Findings
- **medium** Research-adequacy risk unacknowledged (§1, §2.2, §4.2) — The PRD scopes out forensic accuracy but never names the more basic risk that research may turn up nothing usable for an obscure/misspelled artist+song, and that the current validation gate (Plugin Registry conformance) can't catch this. *Fix:* Add a line to §1 or §8 naming this as a known limitation/open question, distinct from the "not forensic" framing already in §2.2.

## Substance over theater — strong

Persona discipline is good: one named protagonist (Jordan) carries both UJs rather than a roster of decorative personas, and §2.1's JTBD list of user types is written as market segments, not personas-in-disguise. The competitive scan in §1 is grounded in actual research (the `.memlog.md` shows named competitors — MixingGPT, iZotope Neutron/Nectar — and specific pricing), not a templated "differentiation" section. The Vision statement (§1) is specific to the product's actual mechanism (artist+song text in, Logic-stock-only chain out) rather than swappable boilerplate.

No NFR section exists at all (performance bounds, cost bounds, abuse/rate-limiting). That absence isn't "NFR theater" in the copied-boilerplate sense the rubric warns about — there's no vague "must be scalable" language to flag — but the absence itself has a real consequence, covered under Scope Honesty below.

## Strategic coherence — strong

The thesis is explicit and consistently applied: "not simply to generate plugin chains... to help creators achieve better vocals with confidence" (§1), backed by `docs/principles.md`'s decision hierarchy. Feature order (Input → Generation → Results) follows the thesis rather than ease-of-build. SM-C1 is a real counter-metric (don't optimize for chain complexity/novelty at the expense of simplicity), which is exactly the kind of counterbalance the rubric wants to see paired with SM-1/SM-2. This does not read as a backlog wearing section headings.

## Done-ness clarity — thin

Most FRs clear the bar: FR-1 (disabled-until-both-filled), FR-3 (never references anything outside the Plugin Registry; retries "at least once" before failing), FR-4 (cache-hit indicated in the response), FR-5 (nothing displayed unless validation-passed), FR-7 (literal values only) all have genuinely testable consequences.

Two gaps matter enough to flag:

### Findings
- **high** FR-2 has no testable consequence for research quality (§4.2, FR-2, lines 93–98) — The only stated consequence is a UI one ("user sees a loading/progress state"). There is no verifiable condition for *whether the research actually found anything relevant* before generation proceeds. Downstream, FR-5's failure path only triggers on Plugin Registry validation failure — a chain built on thin/no research can still pass registry validation and reach the user looking authoritative. This is the dimension the rubric asks to be "unforgiving" on, and it's the one FR that most directly carries the product's accuracy promise. *Fix:* Add a testable consequence to FR-2 (e.g., research stage must return at minimum N non-empty findings, or a "low-confidence research" state that FR-5 can key off), or explicitly acknowledge in §8 that research adequacy is unvalidated in MVP.
- **medium** No performance/cost bounds anywhere (§4.2 FR-2/FR-3, §6.1) — "Duration of research + generation" (FR-2) and "retries at least once" (FR-3) have no upper bound stated (max wait time, max retry count, max cost per Generation). For an unauthenticated, free-text endpoint that will eventually call a paid AI provider, this is a real gap, not a nitpick — see the related Scope Honesty finding on abuse/cost risk. *Fix:* Either add a bound (e.g., "generation must fail after N attempts / T seconds") or flag it as an explicit Open Question alongside the existing five in §8.
- **low** FR-6's "settings specific enough (not vague ranges)" (line 138) is itself a soft qualifier of the kind the rubric asks to flag — it gestures at the right outcome (literal, enterable values) without a crisp test. In practice it's likely fine because FR-7 already commits to literal-values-only, but as written it's an adjective, not a bound.

## Scope honesty — adequate

Mechanically this is one of the PRD's strongest areas: §5's Non-Goals are specific and reasoned (not just "we're not doing X" but *why*, e.g. Save Vocal Chain "deferred... to land alongside live Anthropic integration"), and the Assumptions Index (§9) round-trips cleanly against every inline `[ASSUMPTION]` tag (verified: UJ-1 failure-state, UJ-2/FR-4 cache-match, FR-1 no-genre-restriction, FR-6 default-visual-treatment, §7 placeholder metrics, §8 cache-scope — all six index entries trace to inline tags and vice versa, including the FR-4/UJ-2 duplicate tag being correctly merged into one index entry).

Two omissions are silent rather than flagged:

### Findings
- **medium** No Non-Goal or Open Question names abuse/cost-control for the free, unauthenticated Generation endpoint (§5, §6.1) — Once live AI is wired in (already partially scaffolded — see Shape Fit below), an unauthenticated free-text form with no rate limiting is a real, near-term cost exposure for a solo founder paying per-call. The PRD is otherwise careful to flag deferred decisions explicitly; this one is simply absent rather than deferred-with-a-flag. *Fix:* Add a `[NON-GOAL for MVP]` or Open Question naming rate-limiting/abuse-prevention as an explicit, conscious omission rather than a silent one.
- **medium** Current implementation status is never disclosed (whole document) — see Shape Fit, which is where this is most load-bearing, but it is also a scope-honesty issue: a reader of §6.1 "In Scope" would reasonably infer these are all yet-to-be-built, when in fact most of the mechanics already exist in code.

## Downstream usability — strong

Glossary terms (Vocal Chain, Artist Input/Song Input, Generation, Cached Result, Stock Plugin, Plugin Registry, Plugin Visual, and the four explicitly-future terms) are used consistently across §2–§7 with no drift observed. FR IDs (FR-1…FR-7) and UJ IDs (UJ-1, UJ-2) are contiguous with no gaps or duplicates. Cross-references resolve correctly on inspection — e.g. FR-4's "see §8" and FR-7's "see §5, §6.2" both land on the sections they claim to. Both UJs have a named protagonist (Jordan) carrying context inline, satisfying the rubric's "no floating UJs" check.

The one thing that would trip up an Architecture or Epics workflow reading this cleanly: it cannot tell from the PRD alone that FR-2/FR-3/FR-4/FR-5 already have corresponding implementation (`web/lib/ai/stages/{research,reasoning,generation}Stage.ts`, `web/lib/registry/pluginRegistry.ts`, `web/lib/validation/repairChain.ts`, `web/app/api/generate/route.ts`) — it would need to cross-check the actual repo to avoid re-speccing what's built. See Shape Fit.

## Shape fit — thin

This is a consumer product with meaningful UX, and UJ-1/UJ-2 with a named protagonist are appropriately load-bearing — no over- or under-formalization on that axis.

The mismatch is the brownfield one. Git history (`ca2d4a1` → `065e2f3`) and the current tree show VocAligner already has: a mock AI pipeline implementing the exact research → reasoning → generation sequence FR-2/FR-3 describe (`web/lib/ai/stages/`), a Plugin Registry (`web/lib/registry/pluginRegistry.ts`, `logicPro.ts`) that FR-3 constrains chains against, a validation-and-repair layer (`web/lib/validation/repairChain.ts`) implementing FR-3/FR-5's retry-then-fail behavior almost verbatim (`generateVocalChain.ts`'s `MAX_GENERATION_ATTEMPTS = 2` is literally "retries... at least once" from FR-3), a working API route with tests, and an Anthropic adapter already committed (`anthropicModelClient.ts`, per commit `065e2f3` "Add Phase 4a: Anthropic adapter and observability foundation") that simply isn't wired into `getModelClient()` yet (`getModelClient.ts` still hard-returns `createMockModelClient()`). `cacheHit` is a real field in the schema but is hardcoded `false` — so FR-4 genuinely is unbuilt, unlike FR-2/FR-3/FR-5.

Nowhere in the PRD — not in §0 Document Purpose, not in §6.1 MVP Scope, not in §9 Assumptions — is any of this acknowledged. §6.2 frames "live Anthropic integration" as a distant, paired-with-Save-Vocal-Chain future milestone ("post-mock cutover"), which reads as further off than the code suggests (the adapter and observability foundation are already committed). The rubric's brownfield criterion is explicit: "existing-code references must be accurate; new UJs and existing UJs must be distinguished" — this PRD makes no such distinction anywhere, which risks Architecture or Epics/Stories treating FR-2/FR-3/FR-4/FR-5 as unbuilt and re-designing or re-scoping work that already exists.

### Findings
- **high** PRD presents a substantially brownfield feature set as if greenfield (whole document, esp. §0, §6.1, §6.2) — No section distinguishes already-implemented mechanics (research/reasoning/generation stages, Plugin Registry, validation/repair, API route, Anthropic adapter) from work still to be done (cache, live-AI wiring, UI polish). *Fix:* Add a short "Current Implementation Status" note (even a few lines) to §0 or §6.1 mapping each FR to its actual build state, so Architecture/Epics work from ground truth instead of re-deriving it from the repo independently.
- **medium** "Live Anthropic integration" framed as more distant than the code suggests (§5, §6.2) — the adapter exists and is committed; only the `getModelClient()` switch and cache are outstanding. Framing it as paired with a not-yet-scoped Save Vocal Chain feature may cause unnecessary schedule pessimism. *Fix:* Decouple the "when does live AI ship" question from "when does Save Vocal Chain ship" — they don't have to move together now that the adapter exists.

## Mechanical notes

- **Assumptions Index roundtrip:** clean. All 6 index entries in §9 trace to inline `[ASSUMPTION]` tags and vice versa; the duplicate cache-match tag (UJ-2 line 50 and FR-4 line 114) is correctly merged into a single index entry rather than double-counted.
- **Glossary drift:** none observed. Domain nouns (Vocal Chain, Generation, Cached Result, Plugin Registry, Plugin Visual, Stock Plugin) are used with consistent case and form throughout.
- **ID continuity:** FR-1 through FR-7 contiguous, no gaps/duplicates. UJ-1/UJ-2 contiguous. SM-1/SM-2/SM-C1 contiguous.
- **Cross-reference resolution:** spot-checked §4.2 FR-4 → §8, §4.3 FR-7 → §5/§6.2, §6.2 → FR-1/2/3/4/5/6/7 — all resolve to the sections/FRs they claim.
- **Source-doc staleness (upstream of the PRD, not a PRD defect per se):** `docs/MILESTONES.md`, which the PRD cites as authoritative for future milestones (§7, §8), marks Milestone 4 Phases 2–4 as "⏳" (in progress), but git history shows Phases 2, 3, and 4a already committed (`63bf475`, `ad54b49`, `065e2f3`). Similarly `docs/ROADMAP.md` still shows "Cache" and "Database" unchecked, which is at least still accurate (cache is genuinely unbuilt — `cacheHit` is hardcoded `false`). Worth a pass on the source docs themselves before they're leaned on again downstream.
