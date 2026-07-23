# Reconciliation: PRD vs. Source Docs (PRODUCT.md, ROADMAP.md, MILESTONES.md, project.md)

Date: 2026-07-23
PRD checked: `_bmad-output/planning-artifacts/prds/prd-VocAligner-2026-07-23/prd.md`

## Method

Read all four source docs in full and diffed every concrete noun/feature/phrase against the PRD's Vision, Glossary, Features, Non-Goals, and MVP Scope sections. Findings below are grouped by severity: dropped scope items, contradictions, and flattened tone/emphasis.

---

## 1. Concrete items present in source docs but absent from the PRD

### 1.1 "Visual plugin interfaces" — dropped (project.md, Core MVP)

`docs/project.md` lists Core MVP as: *Artist input, Song input, AI research, Logic plugin recommendations, **Visual plugin interfaces**, Cached results.* "Visual plugin interfaces" is listed as its own bullet, distinct from "Logic plugin recommendations" — implying the results page should render something resembling the actual Logic plugin GUIs/graphics, not just a text list of settings.

The PRD's FR-6 ("Display the chain in signal-chain order with settings") only describes "an ordered list of Stock Plugins, each with specific settings" and settings "specific enough... that a user can input them directly into Logic Pro's own plugin UI." Nothing in FR-6, §4.3, or §6.1 mentions any visual/graphical representation of the plugins themselves. This looks like a real scope item that got silently dropped or folded into "settings" without being named.

### 1.2 "Confidence scores" — dropped (PRODUCT.md, Future Vision)

`docs/PRODUCT.md`'s Future Vision list: *Dry vocal upload, Personalised vocal analysis, Confidence scores, Saved vocal chains, Community presets, Project export.*

The PRD's Glossary (§3) and Non-Goals (§5) carefully name and defer every other item on this list (Dry Vocal, Save Vocal Chain, community features, project export, personalization-to-voice) — but "Confidence scores" never appears anywhere in the PRD, not even as a deferred/future item. This is a distinct, named future feature that has no trace in the PRD at all.

### 1.3 Footer — dropped (ROADMAP.md, Landing Page checklist)

`docs/ROADMAP.md`'s Landing Page section lists four checklist items: Hero, Inputs, CTA, **Footer**. The PRD's landing-page description (§4.1) and MVP In-Scope list (§6.1) enumerate "hero, Artist Input, Song Input, single Generate CTA" but never mention a footer. Minor, but it is a named, still-unchecked roadmap item that the PRD's scope list simply omits.

### 1.4 "Database" — not called out (ROADMAP.md, AI checklist)

`docs/ROADMAP.md`'s AI section lists three pending items: Research Prompt, Cache, **Database**. The PRD covers Research (FR-2) and Cache (FR-4) explicitly, but never mentions a database as its own component/requirement — caching is discussed only in behavioral terms ("the system returns the Cached Result"), with no acknowledgment that persistence infrastructure is itself a tracked roadmap deliverable. Lower severity since it's arguably implied by FR-4, but it is a named, separate checklist line the PRD doesn't surface.

### 1.5 "Purchasing expensive presets" — dropped from problem framing (PRODUCT.md)

`docs/PRODUCT.md`'s Core Problem: *"Finding this information requires watching hours of YouTube tutorials **or purchasing expensive presets**."* The PRD's JTBD narrative (§2.1) only carries forward "so I don't have to guess or trawl tutorials" — the "expensive presets" alternative is dropped from the problem statement itself (though the PRD's §1 competitive scan does separately note that AI-generated, artist-specific presets don't currently exist, which is related but not the same claim).

---

## 2. Contradiction: Save Vocal Chain / Dry Vocal timing vs. MILESTONES.md's actual sequence

The PRD states twice, as founder-confirmed facts:

- §5: Dry vocal upload "is a confirmed future feature, planned to arrive **alongside live Anthropic integration** (post-MVP, post-mock)."
- §5: Save Vocal Chain "confirmed by founder as deferred, **to land with the Dry Vocal / live-AI milestone**, not MVP."
- §6.2: "Save Vocal Chain — deferred to land alongside live Anthropic integration."

But `docs/MILESTONES.md`'s actual numbered sequence does not support this pairing:

- **M4** (Intelligence Engine) is where "Anthropic Integration, Live Generation, Cache" live (Phase 4).
- **M5** is "Accurate Logic Pro plugin generation" — a separate milestone after live AI ships.
- **M6** is "User accounts" — still separate.
- **M7** is "Saved vocal chains" — three milestones (and, implicitly, user accounts) after live Anthropic integration, not alongside it.
- Dry Vocal / Audio Upload is **not scheduled to any numbered milestone at all** in MILESTONES.md — it only appears, unordered, in `docs/ROADMAP.md`'s "Premium" checklist grouped with "User Accounts" and "Saved Chains," with no milestone number or sequencing attached.

So MILESTONES.md's own explicit sequence puts Saved Vocal Chain three milestones after live-AI integration (and gated behind User Accounts, M6, which makes sense — you need an account to save something), while the PRD asserts it lands "alongside" live Anthropic integration. This is flagged in the PRD as founder-confirmed, so it may reflect a real conversation outside these docs — but as written, it contradicts the one source doc (MILESTONES.md) that actually lays out a concrete milestone order, and Dry Vocal isn't anchored to any milestone number in that doc at all despite the PRD implying it is.

---

## 3. Tone / emphasis flattened

### 3.1 "Become the leading AI vocal engineering assistant" — ambition dropped

`docs/project.md`'s Long-term Vision: *"Become the leading AI vocal engineering assistant by combining AI research, production knowledge and personalised vocal analysis."*

This is a distinct, competitive-positioning statement — not just a feature list, but a stated ambition to be *the* category leader. The PRD's Vision (§1) is deliberately modest and grounded ("help creators achieve better vocals with confidence," chain accuracy over AI sophistication, per `docs/principles.md`'s decision hierarchy) and never carries forward this "leading assistant" ambition anywhere — not in §1 Vision, not in §7 Success Metrics, not in the Open Questions. Given the PRD explicitly cites `docs/principles.md` as its north star for tone, this omission may be intentional (the founder's principles doc pushes against AI-first framing), but it is a real flattening of project.md's stated long-term ambition, and worth the founder confirming it was a deliberate choice rather than an oversight.

### 3.2 "Without requiring... years of mixing experience" — accessibility framing softened

`docs/PRODUCT.md`'s Vision: *"make professional vocal production accessible to creators without requiring expensive third-party plugins or years of mixing experience."* The PRD's Target User (§2) captures the persona breadth ("any skill level... a mixing beginner") and the "no third-party plugins" angle (§2.2 Non-Users), but never states the underlying accessibility promise as a vision-level claim the way PRODUCT.md does — it's implicit in persona list rather than asserted as a goal. Minor, but it's a real softening of PRODUCT.md's explicit framing.

---

## Summary judgment

This is not a case of "nothing found" — there are five concrete dropped items (visual plugin interfaces, confidence scores, footer, database, the "expensive presets" problem framing), one real contradiction (Save Vocal Chain / Dry Vocal timing vs. MILESTONES.md's actual milestone sequence), and two tone flattenings (the "leading AI vocal engineering assistant" ambition, and the accessibility-vs-experience framing). The most material of these are §1.1 (Visual plugin interfaces — a named, distinct MVP scope item) and §2 (the milestone-sequencing contradiction), both of which should be resolved with the founder before this PRD is treated as final.
