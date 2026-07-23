---
title: Reconciliation — PRD vs. USER_FLOW / DESIGN_SYSTEM / principles / workflow / Inspiration / ARCHITECTURE
prd: prd.md
sources:
  - docs/USER_FLOW.md
  - docs/DESIGN_SYSTEM.md
  - docs/principles.md
  - docs/workflow.md
  - docs/Inspiration.md
  - docs/ARCHITECTURE.md
generated: 2026-07-23
---

# Method

Read all six source documents and the PRD in full, then diffed concrete facts, flow
steps, feature mentions and stated principles against what the PRD actually says.
`DESIGN_SYSTEM.md`'s visual/brand detail and `ARCHITECTURE.md`'s implementation detail
are correctly left undplicated by the PRD per its own §0 — those are not flagged below
unless a specific line item is product-scope (a feature, a flow step, a user-facing
behaviour) rather than pure visual/engineering styling.

---

## 1. Concrete items from source docs not reflected anywhere in the PRD

### 1.1 Landing page "how it works" / "what's inside VocAligner" explanatory section — missing from Features/MVP scope

`docs/Inspiration.md` explicitly calls for a landing-page section explaining the product,
distinct from the hero:

> "I like the format of explaining 'What is inside Vocaligner' with possible an image of
> the EQ settings to the left of the explanation."

This is reinforced by `DESIGN_SYSTEM.md`'s Golden Rules ("Every page should answer: 1.
What is this? 2. Why should I care? 3. What should I do next?") and its Hero Section
guidance, which describes the hero as answering those questions but implies the "what's
inside" explanation is a separate, additional section beyond the hero+inputs.

The PRD's §4.1 (Artist & Song Input) describes the landing page as only "hero copy...two
inputs...single primary CTA," and §6.1 MVP scope lists "Landing page: hero, Artist Input,
Song Input, single Generate CTA (FR-1)" with no mention of an explanatory/how-it-works
section at all. This is a concrete, named content block from a source doc that has no
corresponding feature, FR, or scope line in the PRD — not even as an out-of-scope or
open-question item.

**Recommendation:** Either add a "How It Works" explanatory section to §4.1 / §6.1 MVP
scope, or explicitly note it as deferred/out-of-scope with a reason, so it isn't silently
lost between drafting and implementation.

### 1.2 "Every plugin should become interactive" — stated future direction absent from PRD

`docs/principles.md`'s Future section lists three forward-looking commitments:

> "Every component should be reusable. Every plugin should become interactive. Audio
> analysis should extend existing architecture."

The PRD's forward-looking material (Glossary future items, §5 Non-Goals, §6.2 Out of
Scope for MVP) names exactly two future features — Dry Vocal upload and Save Vocal Chain
— both tied to the "live Anthropic integration" milestone. "Every plugin should become
interactive" (i.e., the results page evolving from static settings text toward
interactive/adjustable plugin representations) is a distinct, explicitly stated future
product direction that doesn't appear anywhere in the PRD — not in Non-Goals, not in
MVP-out-of-scope, not in Open Questions. It's silently dropped rather than deferred with
a reason.

**Recommendation:** Add it to §5/§6.2 as a named future item (even if unscheduled), the
same way Dry Vocal and Save Vocal Chain are handled, so it's tracked rather than lost.

---

## 2. Contradictions / drift between the PRD and what the source docs say

### 2.1 USER_FLOW.md's "Optional: Save chain" step vs. PRD's full MVP deferral

`docs/USER_FLOW.md` presents the canonical user journey ending in:

> "User recreates chain inside Logic Pro. ↓ Optional: Save chain."

This positions "Save chain" as an optional but present step in *the* user flow — not
flagged there as a future/deferred milestone. The PRD (§5 Non-Goals, §6.2 Out of Scope)
instead states save/history is fully out of MVP, deferred to "land alongside live
Anthropic integration." The PRD's own §0 claims `docs/USER_FLOW.md` "remains
authoritative" for flow, yet the PRD overrides part of that flow's final step without
flagging it as a deviation from USER_FLOW.md specifically (it's framed only as "confirmed
by founder," with no note that this diverges from the flow doc it claims to defer to).
This isn't necessarily wrong — founder confirmation is a legitimate reason to override a
doc — but it is drift that isn't labeled as drift, and a future reader comparing the two
docs would reasonably see a conflict.

**Recommendation:** Add one line in §5 or §9 (Assumptions Index) noting that this
supersedes the "Optional: Save chain" step in USER_FLOW.md, so the two docs don't read as
silently disagreeing.

---

## 3. Qualitative / tone items flattened or omitted

### 3.1 "Teach rather than impress" and "Reduce uncertainty" (principles.md, UX section) — not carried into the Results Display feature

`docs/principles.md`'s UX section states three specific, named principles:

> "Reduce uncertainty. Teach rather than impress. Every screen should build confidence."

The PRD's Vision section (§1) captures "confidence" as a headline goal ("help creators
achieve better vocals with confidence") and correctly cites the decision hierarchy from
the same doc. But it never mentions "teach rather than impress" or "reduce uncertainty"
specifically, and — more importantly — that omission shows up concretely in §4.3 Results
Display: FR-6 describes the results page purely as settings-per-plugin ("specific enough
... a user can input them directly"), with no mention of any explanatory/educational
framing (e.g., why a given plugin or setting was chosen for that artist's style). Given
"teach rather than impress" is a named product principle specifically about *how* output
should be presented, its complete absence from the one feature (Results Display) it most
directly governs is a meaningful flattening, not just a stylistic nicety left to the
design doc — it's a product-behaviour question (does the result explain itself, or just
list numbers?) that the PRD leaves silent.

**Recommendation:** Consider adding an FR or at least an open question to §4.3/§8 asking
whether the Results Display should include brief rationale/explanatory copy per plugin
(directly serving "teach rather than impress" / "reduce uncertainty"), so this doesn't
get lost before UX/Architecture phases.

### 3.2 Minor: "One action per screen" (principles.md, Design section) only explicitly satisfied for the landing page

`docs/principles.md` states "One action per screen" as a general design principle (all
screens), and the PRD only operationalizes it for the landing page (§4.1: "a single
primary 'Generate Vocal Chain' call-to-action"). It's not contradicted for the loading or
results screens, but it's also never explicitly extended to them (e.g., no confirmation
that the results page has exactly one primary action, or what it is). This is minor and
borderline visual/interaction rather than product-scope, so it's noted here only as a
smaller, secondary point rather than a hard gap.

---

# Summary

- Two concrete source-doc items have no footprint anywhere in the PRD: the Inspiration.md
  "how it works" landing-page section, and principles.md's "every plugin should become
  interactive" future direction.
- One drift: PRD's full deferral of "Save chain" isn't reconciled against USER_FLOW.md's
  inclusion of that step (as optional) in the current-state user journey.
- One qualitative flattening: "teach rather than impress" / "reduce uncertainty" (named
  UX principles) don't surface in the Results Display feature they most directly bear on.
