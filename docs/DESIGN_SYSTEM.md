# VocAligner Design System

Version 1.14 — landing page is aligned to v1.1 (Story 1.1, 2026-07-24). The throwaway `/design-preview` exploration route has been deleted. v1.2 (2026-07-27) added the Plugin Visual Fidelity Standards section, following issues found in early Channel EQ mockups. v1.3 (2026-07-29) closes out that mockup process — the bespoke-per-plugin decision it validated is now confirmed in-scope for MVP (see PRD, Architecture, and Story 1.3), and the standards section carries the finalized rules for Channel EQ and Pitch Correction. v1.4 (2026-07-30) generalizes the "show the real panel's full structure, faded where there's no data" rule (previously only stated for Pitch Correction) to every plugin — the first pass on the other 8 knob-based plugins reverted to a generic single-row-of-available-knobs layout without it. v1.5 (2026-07-31) adds three more knob-based-plugin rules surfaced by a dedicated Compressor design-spike process (`docs/images/spikes/compressor/Dev_Compressor_v1.png`–`v6.png`): real panel proportions instead of full-width stretching, radial tick-mark knobs (with a primary/secondary size hierarchy) as the standard knob treatment, and full-height gain/meter columns where the real panel has them. v1.6 (2026-07-31) applies the radial tick-mark knob to the live `PluginKnobPrimitives.tsx`, rolled out to all 8 knob-based plugins at once (ticks computed generically from each control's own registry min/max) — the panel-proportions and full-height-column rules from v1.5 are *not* part of this rollout, deliberately deferred to a per-plugin review (see Story 1.3's Dev Agent Record). v1.7 (2026-07-31) adds the arc-ring knob as an alternative to tick-marks (used when the real dial has none, per a ChromaVerb design spike), extends the "filled = reached, grey = remaining" convention to non-knob faders, and generalizes "verify each control's real type against the reference screenshot" after catching two briefed-as-wrong-type controls (Compressor's Distortion/Mix, ChromaVerb's Dry/Wet). v1.8 (2026-08-01) adds the bipolar (centered-at-zero) knob fill rule, surfaced by Tape Delay's Clip Threshold during that plugin's design spike. v1.9 (2026-08-01) closes out Tape Delay's own four-round design-spike process (`docs/images/spikes/tape-delay/Dev_TapeDelay_v1.png`–`v4.png`): confirms the full-height outer-column pattern (v1.5) with a second real example (Feedback/Output), and adds a section-heading typography note (sized up and centered within their own section, not small and left-aligned) for plugins whose reference shows that treatment. v1.10 (2026-08-01) adds the "Standard practice" card-level label for plugins whose settings are never researched (currently DeEsser 2 only) — resolves an FR-6 tension between that distinction and the results page's signal-chain-order guarantee in favor of a label over a results-page section split. v1.11 (2026-08-01) adds two rules from DeEsser 2's design spike: verify a knob's value-to-angle direction against its printed labels rather than assuming min-left/max-right, and a meter with no live signal can still carry a real, data-tied marker while the meter itself stays faded. v1.12 (2026-08-01) adds Overdrive's design-spike findings: compute a plugin's graph for real when the data genuinely supports it, and the "wrong curve family" lesson — a shelf-shaped response can't be retuned into one that never re-flattens, only a different filter type can. v1.13 (2026-08-01) adds a caveat to the real-proportions rule from Flanger's design spike: a real full-window ratio can overstate how tall this app's own box needs to be when Logic's toolbar chrome is doing work this app's shorter header doesn't reproduce. v1.14 (2026-08-02) adds the card-width derivation rule, found once all 10 Plugin Visuals landed on the real results page together: each component had picked its own card width independently (some none at all), producing widths with no relationship to the plugins' actual real-world proportions relative to each other. Widths should be measured from each plugin's own reference screenshot, normalized for that screenshot's View% zoom. v1.15 (2026-07-31) resolves the results-page background decision below: the `/results` route (its ready, in-flight, and not-found states) moves from the shared sunset `hero-gradient` to the near-black purple already used by the landing page's storytelling sections, for contrast against the white plugin cards. Scope is `/results` only — the separate `/loading` route and the landing page keep the sunset gradient. v1.16 (2026-07-31) corrects a long-standing but never pixel-verified assumption about Channel EQ's gain axis (see the Plugin Visual Fidelity Standards correction note): it's two independent linear scales (right-hand ±15dB, left-hand static 0-60), not one non-linear scale with a steepened outer zone. v1.17 (2026-07-31) corrects Channel EQ's band-type icon row: it was positioned by computing each band's real frequency on the graph's log axis, when the reference actually places these icons in 8 fixed, evenly-spaced columns matching the band-data readout row beneath — a static per-slot layout, not a data-driven one (see the Plugin Visual Fidelity Standards correction note for the general rule this surfaced). v1.18 (2026-07-31) adds the bounded-display-vs-full-height-column distinction to the Plugin Visual Fidelity Standards section, surfaced by four related Compressor layout fixes (pixel-measured against the reference): the Gain Reduction Meter was flex-filling its column instead of sizing to its own measured proportions (first measured ~2.92:1, corrected to ~2.62:1 in v1.19 below once the bezel's real bottom edge was measured properly), Circuit Mode tabs needed to be bigger two-line buttons spanning the meter's full width, Auto Gain's 3-button cluster needed its heading floated above it (instead of pushing it down) to center on Threshold/Ratio/Make Up's row, and the Limiter/Distortion/Mix column's flexible spacer needed to move from above Limiter to below it so Limiter anchors to the meter's top edge while Distortion/Mix keep their existing alignment. v1.19 (2026-07-31) fixes the dead space those same v1.18 changes left behind, and re-measures the meter's aspect ratio to ~2.62:1 (the first pass undercounted the bezel's real bottom thickness): the card's overall height was still derived from Logic's full-window ratio (`1.3 / 1`), which includes a toolbar this app's shorter header doesn't have, so once the meter stopped flex-filling, the two `flex-1` spacers from v1.18 absorbed that same leftover space as visible dead gaps instead. Fixed by dropping the card's fixed aspect ratio and sizing it bottom-up from its own sections instead (see the "full-window ratio" correction note above) — the second time this exact pattern has hit a Plugin Visual, after Flanger. v1.20 (2026-07-31) closes out Compressor's remaining layout issues: its tick-mark `Knob` now puts the label above the dial (matching `ArcKnob`'s already-established convention) with `whitespace-nowrap` to stop long labels from wrapping and throwing off centering; a knock-on overlap between the floated "Auto Gain" heading and the meter (caused by an earlier fix removing space that heading depended on) is resolved; and the standalone "Auto" toggle's wrapper was changed from a row flex to a column flex so `items-center` actually centers it horizontally, matching every knob above it. v1.21 (2026-07-31) fixes DeEsser 2's knob/Mode/Range section, which was centered as a flex block within its column instead of left-anchored against the meters' divider (see the Plugin Visual Fidelity Standards correction note): rebuilt as a 3-column grid so Mode (occupying only the Threshold column, not centered across the full row) and Range/Filter/Filter Solo (already spanning all three columns) share exactly the same column positions as the knobs above them, with any leftover width now falling entirely on the right as one margin instead of split before and after the content. v1.22 (2026-07-31) fixes ChromaVerb's header, which routed "Room"/"Main"/"Details" through the generic `FadedField` component (pill value + caption label below it) — for "Room" that added an unwanted "ALGORITHM" caption the reference doesn't have, and for "Main"/"Details" the same string was passed as both value and caption, rendering each one twice. "Room" is now a standalone, bigger label (still faded rather than the reference's bright orange, since it isn't backed by real data); "Main"/"Details"/"Freeze" now use `FadedTabs`, one label each. Also increases the knob row's gaps (Attack/Size/Density spacing, section-divider padding), pixel-measured against the reference after they turned out to be arbitrary small values well short of real proportions, closing dead space on the right where the Damping EQ graph above already filled the card's width. A separately-claimed Distance-knob size difference did not survive a rigorous pixel re-measurement (see Story 1.3's Dev Agent Record) and was correctly not applied — worth remembering that an eyeballed size comparison between two similar knobs needs an actual pixel measurement before it's trusted. v1.23 (2026-07-31) fixes Pitch Correction's overall card proportions (was ~0.96:1, taller than wide, with no explicit height constraint at all -- the reference is ~1.26:1) and its Settings/Tuning boxes (Neural Pitch Detection/Pitch Range, and Global Tuning/Reference, now stack as their own left-hand columns with Response/Tolerance/Detune beside them, not a single wrapped row). The card is hand-rolled, predating `PluginPanel`, so the width+aspectRatio+h-full-flex-col structure is reproduced by hand rather than inherited. The real fix that made the target ratio achievable without cramming: the keyboard was `w-full`, stretching to fill its entire flex-1 middle column out to the Correction meter -- pixel-measured, the reference's keyboard is a fixed ~49% of the card's own width, left-aligned with the button row above it, not stretched to fill whatever space happens to be available. The same lesson as the bounded-display-vs-full-height-column distinction above (v1.18), on a different element: not everything should default to filling its container just because a flex parent makes that easy. v1.24 (2026-07-31) closes most of Pitch Correction's remaining gaps: added the Correction meter (a faded, static scale resting at 0 Cent — there's no `correction` registry parameter and never will be, it's a live analysis output, not something a Generation ever sets, same treatment as every other no-live-data meter on this project); replaced the bespoke tiny `PitchKnob` with the shared `ArcKnob` family (`NumberArcKnob`/`FadedArcKnob`) for Response/Tolerance/Detune, matching every other plugin's knob style instead of a one-off plain dial; rebuilt Neural Pitch Detection and Global Tuning as single self-labeled toggle buttons instead of a caption-plus-separate-"On"-value pattern the reference doesn't actually have (there's no separate "On" text anywhere near either control in the real plugin — the button's own text *is* the label, colored when active); and corrected the Settings/Tuning grid from an even 50/50 split to the reference's actual ~1.45:1 ratio (Settings has three columns of real content, Tuning only two). v1.25 (2026-08-01) reverses a mistake from v1.20's own pattern applied incorrectly here, plus five smaller fixes, all on Pitch Correction: Edit Scale/Bypass Notes/Bypass All were incorrectly "fixed" with `whitespace-nowrap` in an earlier round, assuming their two-line wrapping was a bug — a close reference crop shows they're genuinely meant to be two-line labels, the same treatment already established for Compressor's circuit-mode tabs (v1.5/`CircuitModeTabs`). Also fixes: the Correction meter's tick numbers were on the wrong side (reference has them left of the tick marks/bar, not right); the keyboard's black keys were narrower than the reference relative to the white keys; Neural Pitch Detection's button didn't actually fit its own wrapped text (constrained to a fixed column width instead of sized to content, so the first line overflowed past the border); and several gaps were re-measured and widened, most notably the space above "Show Pitch" — measured at roughly 3.6x the gap between Root Note and Scale/Chord in the reference, not the same small spacing used everywhere else. The generalizable lesson from the whitespace-nowrap reversal: a fix pattern that was correct on one plugin (Compressor's labels really were an unintentional wrap) isn't automatically correct applied to a different plugin's wrapping — check the reference for whether multi-line text is the bug or the design before reapplying a known fix. v1.26 (2026-08-01) fixes four Overdrive issues, all pixel-verified against `Overdrive_plugin.png`. Drive/Output now print a fixed decimal count (2dp/1dp) via parameter-specific cases in `formatKnobValue`, the same pattern `ratio`'s ":1" suffix already used — the shared default (which drops trailing zeros) stays unchanged for every other knob. Tone's knob was pointing at the wrong angle: a linear value-to-angle mapping is wrong for any knob whose range is a frequency sweep (20Hz-20kHz here) — real dials over that range are log-scaled, same convention as Channel EQ's own frequency axis. Added `logKnobRotationDeg` alongside `invertedKnobRotationDeg` in `knobRotation.ts` and a `log` option on `NumberArcKnob`, for reuse by any future frequency knob. Level Compensation's toggle needed a `mt-[51px]` offset to center on Tone's knob — the same one-line-vs-two-line label offset already documented for Compressor's Auto Gain cluster (v1.20), now confirmed as a recurring pattern: any `ArcKnob` (two lines above its dial: label + value) sitting next to a `TogglePill`/tick-mark `Knob` (fewer lines above its own control) in the same grid row needs this compensation, and the exact offset should be pixel-measured per case rather than reused verbatim, since it depends on the specific text sizes involved. The Drive response curve's steepness formula was recalibrated by directly pixel-tracing the plotted curve in two reference screenshots and fitting `tanh(k*x)/tanh(k)` to each by least squares, rather than trusting the existing formula's extrapolation: `Overdrive2.png` (13.75dB, the original design-spike anchor) measured k=8.61, confirming that anchor was accurate, but `Overdrive_plugin.png` (6dB, the value this component is actually verified against) measured k=3.51 — 4x steeper than the existing exponential-in-t formula produced at that point. The generalizable lesson: a steepness/response formula calibrated against a single reference value can fit that one point well while still being badly wrong elsewhere on its curve; a second measured anchor exposed it here. The fix also changed the formula's shape, not just its constants — an exponential-in-t mapping couldn't pass through both measured points while staying near-linear at very low drive (it forces a non-zero steepness floor at 0dB), so it was replaced with a power-law-in-t mapping (`k = scale * t^exponent`), which fits both measurements and naturally reaches true zero steepness at zero drive. v1.27 (2026-08-01) fixes four Phaser issues, pixel-verified against `Phaser_plugin.png`. `SectionHeading` gained an opt-in `large` size (kept the shared default untouched, since Compressor/DeEsser 2/Tape Delay/etc. already signed off on it) — Phaser's own SWEEP/LFO/FEEDBACK/OUT titles read noticeably bigger in the reference, relative to its own knob diameters, than the shared default reproduces. Floor sat higher than Sweep Mode beside it; the reference has both on the same baseline, fixed with a pixel-measured `mt-[29px]` before Floor's label (the CeilingFloorSlider column's own tight internal spacing has nothing forcing it down to that row, unlike Sweep Mode's column, which already relies on a fixed gap against Stages for the same reason). Rate 1/2's knob rotation was linear over their 0-10Hz range, but the real dial reads log-scaled — the same lesson as Overdrive's Tone (v1.26), except this range starts at exactly 0, where log10 is undefined. The epsilon-floor trick already used for this file's own Ceiling/Floor Hz slider (`logFraction`) transfers, but *not* with that helper's existing 1e-6 floor — pixel-measuring both Rate knobs' real needle angles (not just checking they show the right printed Hz value) showed 1e-6 badly over-compresses a 0-10 range, and the correct epsilon (0.214) had to be fit by least-squares against both measured angles simultaneously, landing within a single-parameter fit's unavoidable ~7deg of each. The generalizable lesson: an epsilon-floor log mapping's right constant depends on the specific range it's applied to (Ceiling/Floor's 20-20000Hz vs. Rate's 0-10Hz aren't interchangeable), and verifying a knob fix means checking the needle's actual angle against the reference, not just confirming the printed value text is unchanged. Low Cut/High Cut's faders were shorter than the reference, which shows them extending well past the Warmth button beside them — fixed with a taller explicit `height` override on both. v1.28 (2026-08-01) fixes the LFO Mix slider, which was `w-full` inside the whole LFO section, stretching it under Phase — the reference's track stops at Rate 2's own right edge and never reaches Phase at all. Fixed by nesting Rate 1+2 in their own flex column (Mix slider beneath them, still `w-full`) with Phase as a sibling outside that wrapper, so the slider's full width now means "full width of Rate 1+2" rather than "full width of the section" — no change to `LfoMixSlider` itself, just what it's scoped inside. v1.29 (2026-08-01) fixes a post-approval regression-in-place caught on a second look at Channel EQ: `BandData`'s per-band numbers (Frequency/Gain/Q, below the graph) were left-aligned within their column, while `BandIconRow`'s icons above them are centered (`justify-center`) — so despite sharing the same column width, the icon and its own numbers didn't actually line up on the same point. This was an oversight in the original v1.17 icon fix, which confirmed the two rows shared column *widths* but never checked they shared text *alignment*. Fixed by centering `BandData`'s per-band content the same way. The lesson: matching a sibling row's column structure isn't enough on its own — check every dimension that needs to agree (width *and* alignment *and* anything else visually load-bearing), not just the one that was the original bug's focus. v1.30 (2026-08-01) fixes a post-approval re-review of Compressor: five knob ranges (Threshold, Ratio, Attack, Release, Make Up) didn't match the printed min/max on the reference at all — all five were corrected by reading the reference's own labels directly rather than trusting the original registry values, which had drifted from real Logic at some point before this review pass started. Knee (not a real registry parameter — Logic doesn't expose it as generateable data) needed the same correction, hardcoded directly in `CompressorVisual.tsx`. Fixing Ratio's range exposed a second bug: its real dial ticks are a deliberately irregular set (1, 1.4, 2, 3, 5, 8, 12, 20, 30, read off the reference) that the shared evenly-spaced tick generator can't produce, *and* that set needs `logKnobRotationDeg` (not linear) to actually spread out legibly — a linear mapping across 1-30 bunched the low values illegibly close to the minimum stop, the same problem already solved once for Overdrive's Tone knob. Release had the identical issue (linear angle, auto-generated ticks that didn't match the reference's real 5/10/20/50/100/200/500/1k/2k/5k set) and got the same fix. `numericTicks`/`NumberKnob` gained `tickValues`/`excludeTicks`/`log`/`formatTickLabel` options to support this — all opt-in, defaulting to the existing behavior, so no other plugin's knobs are affected. Make Up also needed a specific tick (40) excluded — confirmed the reference *does* print it, so this is a deliberate founder-requested deviation, not a fidelity correction, and shouldn't be "fixed" back. The generalizable lesson: even an already-shipped, already-approved component's underlying data (registry min/max here) can drift from the real reference and go unnoticed until someone reads the printed labels directly — pixel/label verification doesn't stop being worth doing once something's been signed off. v1.31 (2026-08-01) fixes ChromaVerb's Decay knob rotation, a subtler variant of the wide-range-log-knob bug already fixed for Overdrive's Tone and Compressor's Ratio/Release: Decay's 0.3-100s range needed `logKnobRotationDeg`, but a *plain* log10 over the printed 0.3-100 range still fell short — pixel-tracing the reference's own needle at its shown value (1.1s) put it at ~39% of the sweep, while plain log10 only predicts ~22%. `logKnobRotationDeg` gained an optional `floor` param (defaults to `min`, so Overdrive's Tone call is unaffected) so a dial's log-scale floor can differ from its printed minimum — fit here to 0.06 by solving backward from that one measured point (the only real Decay reference value this project has; the `docs/images/spikes/chromaverb/` PNGs predate this fix and show the same wrong linear mapping, so they don't help). The printed "0.3"/"100" labels are unchanged; only the internal angle math uses the fitted floor. Noted in the code as a single-point fit, to be re-tightened with Phaser's Rate-knob two-point least-squares approach (v1.27) if a second real Decay reference value ever turns up. The generalizable lesson: confirming a control needs a log mapping isn't the same as confirming *which* log mapping — the same category of bug can still be off by a lot if the effective floor doesn't match the printed range, and that gap is only caught by measuring a real value's needle position, not just checking the min/max labels or the printed value text. v1.32 (2026-08-01) fixes two Tape Delay issues, pixel-verified against `TapeDelay_plugin.png`. The Smoothing and Low Cut/High Cut tracks were both `w-full`, stretching edge-to-edge in their column — the reference insets both: Smoothing's whole label+track block sits at ~50% of the Delay column's width (the track closely tracks the label row's own width, not independently narrower), while Low Cut/High Cut's track alone (its label row stays close to full width) sits at ~59% of the Character column, both centered. Fixed by constraining each track's wrapper width rather than touching the shared `HorizontalFillTrack`/`DualRangeTrack` primitives — `HorizontalFillTrack` is also used by Phaser's LFO Mix slider, which genuinely *is* full-width in its own reference, so a primitive-level fix would have regressed an already-signed-off plugin. Separately, the two tracks sat at different heights relative to the divider above "Modulation" (Smoothing 65.5px above it, Low Cut/High Cut only 19.5px) even though the reference has them at the same height (~80px above, within 1px of each other) — caused by Delay and Character being sibling columns in one CSS grid row (stretched to equal height, set by Character's taller content) with neither column pushing its last child to the bottom, so the shorter column's content just clustered at the top. Fixed with `mt-auto` on both sliders' wrappers, not just the misaligned one, so this stays correct if either column's content height changes later. The generalizable lesson: two controls that read as "the same kind of element" can still need different fixes (whole-block inset vs. track-only inset) — check each one's own label-row-to-track ratio against the reference rather than assuming a shared pattern, and a vertical misalignment between grid siblings is usually a missing bottom-anchor, not a magic-number offset. v1.33 (2026-08-01) fixes Pitch Correction's Show Pitch Input/Output control, which rendered as two independent gap-separated buttons (each with its own border) — the reference shows one continuous segmented pill: a single shared outer border with a thin internal divider between "Input" and "Output". Fixed directly in `PitchCorrectionVisual.tsx` rather than via the shared `FadedTabs` component, since `FadedTabs` is relied on elsewhere for genuinely gap-separated tab rows (Tape Delay's Tape Head Mode, ChromaVerb's Main/Details) that aren't the same control — a shared-component fix would have changed those too. The generalizable lesson: not every row of two faded button-like labels is the same widget — check whether the reference shows a shared border (one joined control) or independent gaps (separate buttons) before reusing an existing tab/pill component. v1.34 (2026-08-01) fixes Flanger's Intensity knob, pixel-measured against `Flanger_plugin.png`: at its printed 50.0% (0-100 range, same as Mix beside it), the needle sits at ~25-27deg clockwise of 12 o'clock — Mix, same 0-100 range and same 50% value, measures ~0deg, confirming the plain linear mapping is correct there and the discrepancy is specific to Intensity. Fixed with the existing `log`/`logFloor` mechanism (`logKnobRotationDeg`, already used for ChromaVerb's Decay and Phaser's Rate 1/2) rather than new code — `logFloor=18.3`, solved backward from this one measured point. Unlike those two prior cases, Intensity has no frequency/time dynamic-range justification for a log taper; the fix is applied anyway because the *mechanism* needed (decouple the needle's rotation curve from its printed value) is identical regardless of what physical quantity underlies it, and it's the least invasive way to reproduce a real dial's actual non-linear response. Registry min/max (0/100) and the printed "50.0%" label are unchanged, only the internal angle math uses the fitted floor — same discipline as Decay. Noted as a single-point fit, to be re-tightened if a second real Intensity reference value ever turns up. A separately-noticed, smaller deviation on Feedback's needle (67%, bipolar -100..100, measures ~101deg where linear predicts ~90deg) was flagged but deliberately not fixed in this round — out of scope for what was asked, and unconfirmed against a second data point. v1.35 (2026-08-01) fixes decimal-precision mismatches found by a full pass across all 10 plugins, checking every live numeric readout against its own reference screenshot's printed decimal count. ChromaVerb's Decay now prints "1.10 s" (was "1.1 s"); Flanger's and Chorus's Intensity (same parameter name on both) now print "50.0 %"/"10.0 %" (was "50 %"/"10 %") — confirmed control-specific, not a blanket percentage rule, since Flanger's own Feedback/Mix on the same reference print with no decimal at all; DeEsser 2's Max Reduction now prints "20.0 dB" on both the knob and its meter marker (was "20 dB"), with Threshold's already-correct value made consistently `.toFixed(1)` too rather than relying on a raw template literal that happened to work only because its own default has a nonzero decimal digit. Channel EQ's band Frequency needed a different kind of fix: the old rule ("decimal only if the value has a fractional part") was actually wrong, not just incomplete — bands 1 and 2 (20Hz, 75Hz) print "20.0 Hz"/"75.0 Hz" in the reference despite being whole numbers, while every band >=100Hz never shows a decimal even though those are also whole numbers. The real rule is a 100Hz magnitude threshold, confirmed against all 8 printed band values, not value shape. Also checked and confirmed already correct: Tape Delay, Pitch Correction, Overdrive, Phaser, Channel EQ's Gain/Q/Slope. Compressor's knobs were confirmed out of scope entirely — its real panel shows no live numeric readout at all (tick marks only), so the value text this app displays there is a deliberate augmentation with no reference decimal convention to check against. Also found and flagged, not fixed (not a decimal issue): DeEsser 2's Frequency shows "6000 Hz" in this app but the reference's own factory default reads "7001 Hz" — a value drift, a separate open question from formatting.

---

# Design Philosophy

VocAligner should feel like a premium creative tool.

The design should immediately communicate:

Professional.

Simple.

Trustworthy.

Creative.

Confident.

The interface should never feel busy or overwhelming.

Every design decision should reduce friction and increase clarity.

Whitespace is a feature.

The homepage should feel like walking into a beautifully organised recording studio.

Not a software dashboard.

---

# Brand Personality

VocAligner is:

- Premium
- Intelligent
- Calm
- Creative
- Modern
- Minimal
- Professional

VocAligner is NOT:

- Flashy
- Gimmicky
- Loud
- Over-designed
- Childish
- Corporate

---

# Brand Mark

VocAligner has a real mark now, not just a text wordmark: `web/app/components/Mark.tsx` (source: `web/public/va-mark.svg`), a "VA" monogram built from chamfered (cut-corner) letterforms.

Use it in navigation, paired tightly with the wordmark. It can also appear large and very faint as a background watermark — a confident, quiet way to reinforce identity without becoming decoration.

---

# Emotional Goal

When somebody lands on VocAligner they should think:

"I trust this."

"I understand exactly what this product does."

"I want to try it."

---

# Colour Palette

Primary Background — Landing Hero

The landing page hero gradient runs white at the top, through a warm sunset gold, down into a deep purple base.

Not a pale wash. The gold and purple should read as real, saturated colour — restrained, not flamboyant, but not dulled down either.

Sections below the hero that continue the story (e.g. "how it works") pick up exactly where the hero's gradient ends and deepen further into a near-black purple, rather than cutting back to white. Use white text on these sections.

Explored and rejected: pink/red/coral as part of this gradient, and a fully-saturated "vivid" version of the same gradient used edge-to-edge. Both read as generic AI-product styling rather than premium.

Primary Background — Other Pages

The loading page keeps the simpler warm sunset yellow gradient fading to white. Reserve the fuller white-to-gold-to-purple treatment for the landing page, where there's room for it to breathe.

Avoid harsh colour changes anywhere. Blend, don't cut.

**Results page is the one exception (v1.15, 2026-07-31, founder decision).** While reviewing a Plugin Visual QA comparison page (dark ground, light plugin cards), the founder preferred that dark-background/light-card contrast and asked for it on the results page specifically. Rather than inventing a new dark tone, it reuses the near-black purple (`--wash-purple` → `--wash-purple-deep`) that the landing page's storytelling sections already deepen into — see `.results-gradient` in `globals.css`, and `MeetSection.tsx`/`Footer.tsx` for the precedent. The plugin cards themselves stay white/light, as in every reference screenshot; only what sits behind them changed. Text on the results page follows the same `text-white` / `text-white/70` scale the storytelling sections use for readability on that background. Scope is results-only — the loading page and landing page are unaffected.

---

Text

Primary:

Near black (#111111)

Secondary:

Muted grey

Supporting:

Warm dark grey

---

Buttons

Primary buttons:

Black background

White text

Rounded corners

Subtle hover animation

No excessive gradients

Secondary buttons:

White background

Black border

Black text

---

Accent Colour

Warm golden yellow, used sparingly on functional pages (progress bars, small highlights). Should guide attention rather than dominate.

Deep purple is a secondary brand colour, not just an accent — it's used deliberately at real scale in the hero and storytelling sections, not sprinkled in small doses.

---

# Layout

Large hero section.

Generous spacing.

Maximum content width around 1200px.

Consistent vertical rhythm.

Never overcrowd the interface.

Each section should have a clear purpose.

---

# Typography

Typography is one of the primary design elements.

Use large headings.

Use bold weights.

Avoid decorative fonts.

Use a clean modern sans-serif.

Allow typography and spacing to create hierarchy.

Avoid relying on colour for emphasis.

---

# Hero Section

The homepage hero should immediately communicate:

What the product is.

Who it is for.

What the user should do next.

The primary call-to-action should be obvious.

The artist and song inputs should be immediately visible.

Layout: an asymmetric two-column top section, not centered. Headline on the left, sized as the dominant element on the page. A short, inspiring (not mechanical) explanation of what the product does on the right, beside it — not below it.

The artist/song input itself sits lower, centered, as a secondary interaction: "Match [artist] on [song], in Logic Pro" — one sentence, not a stacked form. It should be visibly smaller than the headline.

---

# Footer

Landing page only, for MVP. Minimal, single row: brand mark + wordmark (small, muted) on one side, a copyright line and a one-line trademark disclaimer on the other — "© {{year}} VocAligner. Not affiliated with or endorsed by Apple. Logic Pro is a trademark of Apple Inc."

No links to pages that don't exist yet (no Privacy Policy, Terms, or Contact until those are real). Add them when there's something real to link to, not before.

---

# Storytelling Sections

Below the hero, a "Meet VocAligner" section explains how the product works. Dark, continuing the hero's gradient into near-black rather than cutting back to white — the hero and this section should read as one continuous piece.

Layout: two columns. Left is the "Meet VocAligner" headline and a short, inspiring explanation (how it listens, what it hands back). Right is the process broken into stages — three vertically stacked cards, each numbered, not a horizontal row.

Keep the explanation brief and benefit-led, not a feature list. Reference: ToneAdapt's landing page (a close analog product — guitar tone matching instead of vocals) pairs inspiring copy with a concrete, concise breakdown; follow that shape.

---

# Functional Pages (Loading & Results)

These are not lower-priority than the landing page — they're a different *kind* of page, and get treated accordingly, not neglected.

Background and chrome stay calm and simple, minimal decoration, deliberately not by default. Someone reading real plugin settings or waiting on a real result needs clarity and focus, not the landing page's richer wash; that treatment is reserved for the one-time first impression. The loading page keeps the sunset-to-white gradient. The results page is a deliberate, scoped exception (v1.15) — see "Primary Background — Other Pages" above — but stays calm in its own way: a flat near-black purple, not the landing hero's full gold-to-purple wash, and the plugin cards stay white/light regardless.

The Plugin Visual (how a generated chain is actually displayed) is the exception and the priority: it's the product's actual payoff moment, not a technical afterthought. It deserves the same design care as the landing page hero — this is where "premium" has to be true, not just claimed.

Typography, spacing, and component styling (buttons, cards) on these pages should read as the same product as the new landing page — a light consistency pass, not a full redesign, and never at the cost of the calm background principle above.

---

# Plugin Visual Fidelity Standards

Applies to every bespoke Plugin Visual (Channel EQ, Pitch Correction, and all knob-based plugins) — specific to this component family, not general UI guidance.

Always work from the real Logic Pro reference screenshot for that specific plugin (`docs/images/reference/*_plugin.png`). Compare the built mockup against it directly before calling it done — "in the spirit of" is not the bar.

Verify the neutral/default state first. Before checking how a visual looks with real data applied, confirm it renders as genuinely neutral when every value sits at its Logic default — a computed or derived visual (a curve, a meter position, a highlighted note) is only trustworthy if its resting state actually reads as resting.

Custom icons and controls only. Never substitute a generic icon-library glyph, a placeholder text/ASCII character, or a default charting-library affordance (data-point markers, default gridline spacing, generic legend/tooltip styling) for what the real plugin actually shows. Logic's plugins have their own dense, specific visual language — match it.

Any scale, axis, or range in a bespoke visual should reflect the real plugin's own scale design (including asymmetric or dual scales, if that's what the real plugin uses), not a generic linear default sized to whatever charting approach produced it.

**Bipolar (centered-at-zero) knobs fill from the center, not from the knob's absolute minimum.** For a knob whose range straddles zero (e.g. Tape Delay's Clip Threshold, -20 to +20), the neutral/zero position sits at 12 o'clock. The value-arc fills from 12 o'clock toward whichever side the current value sits on — counter-clockwise toward the minimum for a negative value, clockwise toward the maximum for a positive one — never from the knob's absolute minimum position (typically ~7-8 o'clock) the way a unipolar knob (e.g. Compressor's Threshold, ChromaVerb's Size) does. Check whether a knob's range is bipolar before applying the fill logic — don't assume unipolar by default.

**A Plugin Visual's card width on the results page is derived from its own reference screenshot's real window size, not picked per-plugin by eye.** Real Logic plugins genuinely have different native window sizes — this is authentic, not something to normalize away by forcing every card to the same width. But the reference screenshots were captured at different zoom levels (check the "View: X%" shown in each screenshot's own toolbar — some are 100%, some 75%), so raw pixel width isn't directly comparable across plugins until normalized: `real_width = screenshot_width / (view_percent / 100)`. Once normalized, the 10 plugins cluster into three real size tiers, confirmed by direct measurement:
  - **Large** (~2030-2044px real width): Channel EQ, Compressor, ChromaVerb, Tape Delay, Phaser.
  - **Medium** (~1452-1453px): DeEsser 2, Overdrive, Pitch Correction.
  - **Small** (~1021-1027px): Flanger, Chorus.

  Scale all three tiers down by the same factor to fit the results page (e.g. ~1000px / ~715px / ~505px keeps the large tier comfortably within the page's 1200px content column while preserving the real relative proportions between tiers) — don't collapse them to one width, and don't pick a width for a new plugin without measuring its own reference screenshot first.

**A plugin whose settings are never researched (currently only DeEsser 2 — see PRD §8.9) gets a small "Standard practice" label on its own card, in its true signal-chain position** — never physically regrouped into a separate section of the results page. Style the label muted/faded, same visual weight as everything else on the card without backing data (a small pill near the plugin name/category header, not a banner). This is a card-level detail specific to that plugin's component, not a registry-wide mechanism — don't build a generic flag for it until a second plugin genuinely needs the same treatment.

**Show the real panel's full structure, not just the controls the registry happens to have data for.** A plugin's real Logic panel is the layout target — sections, groupings, meters, mode tabs, gain staging — even where VocAligner doesn't generate a value for every element. Elements without backing data are shown in their real position, faded/grayed (same convention as literal control values: recommended data is bold/colored, everything else is muted) — never silently dropped from the layout. A visual that only renders the handful of controls with data, arranged as a generic single row, isn't "the real plugin, simplified" — it's the generic template this whole process was meant to replace, just wearing the right plugin name. This is the same principle already applied correctly to Pitch Correction (Settings/Tuning sections are shown in place and faded, not omitted) — it applies to every plugin, not just that one. Concretely, for a plugin like Compressor: the meter, circuit-mode tabs, Limiter section, and Input/Output Gain all have a real position on the real panel and should appear there, faded, even with no data behind them — not vanish because the registry only models 5 knobs.

**Build to the real plugin's own proportions — don't stretch a panel to fill the results page's column width.** Logic's own plugin windows have a real width:height ratio (Compressor is ~1.3:1, close to a box); recreating that ratio is part of matching the real panel, the same as matching its layout or its scale design. A knob-based Plugin Visual should size itself to its own content, not expand to fill whatever container width happens to be available. This deliberately leaves an open question this document doesn't resolve: how a box-proportioned panel sits inside a results page showing a full stacked chain (centered with margin? left-aligned? does a ragged-width stack read as intentional?) is a results-page layout decision, separate from the Plugin Visual component itself — don't let that open question become a reason to quietly revert to full-width stretching.

**Radial tick-mark knobs are the standard knob treatment, not plain dial-plus-label.** Implemented in `PluginKnobPrimitives.tsx`'s `Knob`, live for all 8 knob-based plugins. Real Logic knobs carry numeric (or, where the real control is qualitative — e.g. Compressor's Distortion sweep from Off through Soft/Hard to Clip, or Mix's Input/Output blend — labeled) tick marks arranged around the dial's circumference, not just a label above and a value below. Tick positions are computed generically from the control's own min/max (a "nice round number" step algorithm, the same idea as a chart axis — `niceTickValues` in `web/lib/controls/knobTicks.ts`), not hand-picked per knob. `NumberKnob` (real generated data) always gets ticks this way, for free, from the registry range that already exists. `FadedKnob` (no data) only gets ticks where a real Logic range has actually been researched for that specific faded control — e.g. Compressor's Knee (0.2–0.8), Input/Output Gain (±30dB), Limiter Threshold (-10–0dB), all read directly off the reference screenshot — never a fabricated range just to make a faded knob look more precise than the research behind it. Most faded knobs across the other 7 plugins haven't had this research done yet and correctly render as a plain dial in the meantime. Where the real panel gives primary (data-backed) knobs more visual weight than secondary ones — Compressor's Threshold/Ratio/Make Up are visibly larger than Knee/Attack/Release below them — carry that size hierarchy through; it's part of matching the real panel's own emphasis, not decoration. (Not yet applied anywhere — all 8 plugins currently use one uniform knob size until each goes through its own per-plugin sizing review.)

**Where the real panel has a full-height gain/meter assembly (e.g. Compressor's Input Gain and Output Gain), build it as one continuous column spanning the panel's full height** — a meter strip that fills the available vertical space, transitioning into its knob pinned at the bottom — not a short meter near the top plus a disconnected knob partway down. It sits as an outer column with everything else in the middle, matching the real panel's own structure. Confirmed as a recurring pattern, not a Compressor one-off, by Tape Delay's Feedback/Output column (`docs/images/spikes/tape-delay/`): its Dry/Wet faders run almost the entire panel height, well past where the Delay/Character/Modulation block beside it ends — a first layout pass nested Output as a small box directly under Feedback within a three-way top row, which undersold how much of the real panel that column actually occupies.

**A bounded display (meter, graph, curve) is not the same shape rule as the full-height gain column above it — don't let a `flex-1` placeholder stand in for measuring the real element's actual proportions.** Compressor's own Gain Reduction Meter (`FadedDisplay`) shipped growing to fill whatever vertical space was left over in its column, which is correct for a full-height fader/meter *column* (the rule above) but wrong for a bounded *box* like this meter — the real reference shows it occupying a specific, modest fraction of the panel (~2.92:1 width:height, pixel-measured), not stretching to consume leftover space. An unconstrained flex-1 placeholder has no content of its own to size itself by, so nothing stops it from silently dominating the card. Size a bounded display box the same way everything else in this section gets sized: measure its real width:height ratio against the reference and apply that (`FadedDisplay`'s `aspectRatio` prop), not flex-fill by default. The two shapes look similar at a glance (both "a box with no data in it") but are structurally different real UI elements — check which one a given placeholder actually is before choosing how it sizes itself.

**Section headings (DELAY, CHARACTER, FEEDBACK, etc.) should match the real reference's own title treatment for size and alignment** — validated in the Tape Delay design spike, where the real panel's titles are noticeably large and centered within their own section's width, not a small left-aligned label. Check the specific reference screenshot's heading style before defaulting to whatever the previous plugin used.

**Arc-ring knobs are the alternative knob treatment when the real dial has no tick numbers** — validated in the ChromaVerb design spike (`docs/images/spikes/chromaverb/Dev_ChromaVerb_v1.png`–`v4.png`). Not every real Logic knob uses Compressor's tick-mark style; ChromaVerb's real dials show only a filled arc ring (brand-accent from the minimum up to the current value, thin muted grey for the remainder), a label above, and a value below — no numbers around the circumference. Check the specific reference screenshot to see which treatment that plugin's own knobs actually use, rather than defaulting to tick-marks everywhere. The same "filled = reached, grey = remaining" language extends to non-knob range controls too — ChromaVerb's Dry/Wet vertical faders use an accent fill growing from the bottom of the track up to the current value, muted grey above it, for visual consistency between knobs and faders in the same plugin. Where a real panel gives one knob deliberately more visual weight (ChromaVerb's Decay is visibly larger than Attack/Size/Density/Distance), match that size difference, but keep every knob's own block — label, value, and dial — starting at the same vertical position as its neighbors; only the dial itself should be bigger, not the whole block shifted down.

**Verify each control's actual type against the reference screenshot, not just its value/range.** A control's real type (knob vs. slider/fader vs. button vs. two independent controls vs. one combined one) is exactly the kind of thing a written brief can get wrong even when everything else about it is well-researched — confirmed twice now: Compressor's Distortion/Mix were briefed as buttons but the reference shows knobs; ChromaVerb's Dry/Wet were briefed as knobs but the reference shows vertical faders, and its registry originally modeled a single crossfade `mix` parameter when the real plugin has two fully independent Dry and Wet controls. Always open the specific reference screenshot and check before building, even for a control that seems unambiguous from its name alone.

**Don't assume a knob's value increases left-to-right — check the printed min/max labels.** DeEsser 2's Max Reduction dial runs high-to-low left-to-right (25 printed on the left, 0 on the right), confirmed directly against the reference before building it that way (`docs/images/spikes/de-esser-2/`). The fill mechanic itself doesn't change — still an arc growing from the dial's -135° position toward the needle — only the value-to-angle mapping inverts, so a high value shows a *small* fill and a low value shows a large one. Read the printed labels; don't assume standard min-left/max-right.

**A meter or scale display with no live signal behind it can still carry a real marker.** DeEsser 2's Detection/Reduction meters are vertical dB-scale strips with no data of their own (there's no live audio to show), but the marker line on each is tied to the real Threshold/Max Reduction value — genuinely computed, not hardcoded at an example position. The whole meter (frame, scale labels, marker) still renders in the muted/faded language of the rest of the meter — real data driving a marker's position doesn't automatically earn the bold/accent treatment a knob gets, when the display it's drawn on has no live reading behind it.

**Where a plugin's graph is genuinely computable from real parameter data, compute it for real — but the underlying math has to model the actual behavior, not just produce a smooth curve of roughly the right shape.** Overdrive's Drive/Tone response graph (`docs/images/spikes/overdrive/`) is the first Plugin Visual graph built from real math rather than a `FadedDisplay` placeholder: Drive is a textbook tanh soft-clip waveshaper (steepness genuinely driven by the drive value), Tone reuses `bandResponseDb` from `web/lib/eq/channelEqCurve.ts` directly. The Tone curve went through two wrong models before landing on the right one: a hand-rolled symmetric sigmoid, then a highshelf biquad — both flatten at both ends by construction, a structural property of any shelf-shaped response that no amount of retuning fixes. The reference's Tone curve keeps rolling off all the way to the graph's edge, which only a genuinely different filter type (lowpass, which has no target gain to level out at) can produce. When a re-tuned version of the same formula keeps failing the same way, the formula itself is usually the bug, not its parameters.

**A knob-based plugin's real full-window screenshot ratio doesn't always translate directly to the Plugin Visual's own box.** Flanger's real window measures ~1.42:1, but that includes Logic's own heavy toolbar chrome above the panel; this app's much shorter category/name header doesn't consume nearly as much vertical space, so building to the literal 1.42:1 ratio left a single content-sparse row of large knobs with a lot of unused space below it. Fit the box to the content it actually holds when the two diverge for this reason, rather than the literal measured ratio — confirmed correct after trimming Flanger's box to its content's own height (`docs/images/spikes/flanger/`). **Recurred on Compressor (2026-07-31), confirming this is a pattern, not a Flanger one-off:** its card kept the full-window `1.3 / 1` ratio through several rounds of internal layout fixes, and because the Gain Reduction Meter was flex-1 (silently absorbing whatever space was left over), the mismatch stayed invisible until the meter was fixed-size — at which point the leftover space had nowhere to go but two `flex-1` spacers, showing up as visible dead space. Fixed by dropping `PluginPanel`'s `aspectRatio` entirely and deriving the card's height bottom-up from its own sections (header, tabs, meter, two knob rows, real gaps between them) instead of top-down from Logic's window ratio; both spacers became small fixed gaps once there was no artificial surplus left to absorb. The general lesson: a `flex-1` filler anywhere in a card is worth a second look — it may be quietly compensating for the card's outer size being wrong, rather than doing real layout work.

**Compressor's tick-mark `Knob` was the one remaining knob style with its label below the dial in a tiny fixed size — every other plugin's `ArcKnob` already puts the label above, sized to the dial.** Since `Knob`/`NumberKnob`/`FadedKnob` have exactly one consumer (Compressor), this was safe to bring in line without touching any other already-approved plugin: label now renders above the dial with its own size-based scale-up (mirroring `ArcKnob`'s `isLarge` pattern, just with a lower size cutoff since Compressor's own PRIMARY_SIZE/SECONDARY_SIZE sit well under `ArcKnob`'s threshold). Also added `whitespace-nowrap` to both the label and value text — without it, longer labels could wrap and throw off the visual centering under their knob, which read as "the titles aren't centered" before the actual cause (wrapping, not a positioning bug) was found.

**A fix that removes a spacer can break something else that was quietly relying on that same space.** Floating the "Auto Gain" heading above its button row (so the buttons could center on Threshold/Ratio/Make Up without the heading pushing them down) depended on there being clear space above it. A later fix that closed the dead gap between the meter and that row removed exactly the space the floated heading needed, so it started overlapping the meter's bottom edge. Neither fix was wrong in isolation — but a positioned/floated element's assumptions about its surroundings are worth re-checking any time something nearby changes, not just when that element itself is touched.

**`items-center` only centers horizontally in a column flex (`flex-col`) — in a row flex (the default `flex`), it centers vertically instead.** The standalone "Auto" toggle's wrapper was `flex items-center`, a row container, so the button sat left-anchored rather than centered under Release like every knob above it (which all use `flex flex-col items-center`). An easy mistake to make since both produce a valid, unremarkable-looking layout — only comparing against the reference's actual centering revealed it. Worth a second look any time a single-child wrapper is centering only one axis.

**A multi-row section (knobs, then a single control, then a row of controls) should be built as one shared grid, not several independently-centered flex blocks stacked on top of each other.** DeEsser 2's Threshold/Max Reduction/Frequency knobs, "Mode" dropdown, and Range/Filter/Filter Solo row were three separate pieces inside one `items-center` flex column — which centered the whole group within its section instead of anchoring it flush against the meters' divider like the reference does, and centered "Mode" across the full three-knob width instead of under Threshold specifically (the reference shows Mode aligned with the first knob's own column, not spanning or centering across all three). Fixed by rebuilding the section as a single 3-column grid (`repeat(3, max-content)`), with Mode occupying only the first column (empty spacer cells for the other two) so every row shares exactly the same column positions, and left-anchoring the whole grid so any leftover width falls on the right as one margin, matching how the reference is actually constructed. When a section has one row with more columns of real content than another (three knobs vs. one dropdown), a shared grid keeps them genuinely aligned; separate centered flex blocks only look aligned by coincidence.

**A caption-plus-value pattern shouldn't be assumed for every control — check whether the reference actually has a separate caption, or whether the control's own label is the only text there.** Pitch Correction's "Neural Pitch Detection" and "Global Tuning" were both built as a small muted caption above a separate boxed "On" value, mirroring how Response/Tolerance/Detune show a caption above their real value. The reference has no such caption for either — each is one self-labeled toggle button (its own name as the button text, colored when active), with no "On" text anywhere nearby. Rebuilt to match: one button, no fabricated value. Since neither is backed by a real registry parameter, both stay faded/muted by default (same as every other not-backed-by-data control) — built so a future real parameter backing either would highlight it the same way a knob goes from faded to bold/accent-colored with real data, not requiring a structural rebuild.

**A "fix" that stops text from wrapping isn't automatically correct — the wrapping might be the actual design.** Compressor's knob labels (v1.20) really were an unintentional wrap, fixed with `whitespace-nowrap`. That same fix was then incorrectly reapplied to Pitch Correction's Edit Scale/Bypass Notes/Bypass All buttons, assuming their wrapping was the same kind of bug — but a close reference crop shows these are genuinely meant to be two-line labels ("Edit"/"Scale", "Bypass"/"Notes"), the same treatment already established for Compressor's own circuit-mode tabs (v1.5/`CircuitModeTabs`). A known-good fix pattern from one plugin doesn't transfer automatically to another plugin's superficially-similar symptom — check the reference specifically before reapplying it.

**A button rendering wrapped, multi-line text needs to actually be sized to fit that text — not squeezed into whatever fixed-width column it happens to sit in.** Pitch Correction's "Neural Pitch Detection" button was constrained to its column's fixed width, so its longer first line overflowed past the button's own border instead of the button growing to contain it. Size this kind of button to its own content (e.g. fit-content sizing on the longer wrapped line), not the column.

**Spacing that looks "roughly the same everywhere" in a hand-built layout is worth pixel-checking against the reference individually, not assumed uniform.** Several of Pitch Correction's internal gaps (Neural Pitch Detection to Pitch Range, Global Tuning to Reference, and especially Scale/Chord to Show Pitch) were all using the same small default spacing value, when the reference uses meaningfully different gaps in each position — the gap above Show Pitch measured at roughly 3.6x the gap between Root Note and Scale/Chord, not the same. Re-measure each gap on its own rather than reusing one spacing value across a whole column just because it reads as visually consistent at a glance.

**Pitch Correction's keyboard must highlight notes based on the actual researched Root Note + Scale/Chord** — never a fixed or literal black/white piano rendering. Compute the scale's member notes from standard music-theory interval patterns (e.g. major = W-W-H-W-W-W-H from the root) and apply the same bold/faded convention used elsewhere (in-scale notes highlighted, out-of-scale notes faded), regardless of whether a note is physically a white or black key. A C Major example will coincidentally highlight only the white keys — that matches literal piano coloring by chance, not evidence the mapping is correct. Verify against a scale that includes at least one black key (e.g. G Major, which includes F#) before considering this done.

This means literally the same two flat colors for every key, black or white — one for in-scale, one for faded/out-of-scale. Do not tint, darken, or blend the color differently for black keys (e.g. a black key's own natural darkness bleeding into the highlight/fade color) — that produces a muddy in-between tone that reads as ambiguous rather than clearly on or off. Black vs. white key identity should only be communicated by shape/size (the traditional shorter, narrower key silhouette), never by a color difference. Matches how real Logic does it — see PitchCorrection_plugin.png, where every key in Chromatic Scale mode is the exact same blue regardless of black/white.

**Correction (2026-07-31): Channel EQ's gain axis is two independent linear scales, not one non-linear "generous inside/steepened outside" scale.** `dbToY()` originally shipped with a two-slope model — a wider px/dB rate for ±15dB, a narrower one beyond it — described in its own code comment as "validated against the real reference." It never actually was: nobody had pixel-measured `ChannelEQ_plugin.png` against it, and a direct measurement round (this session) showed the real panel has a right-hand axis (+15 to -15) and a separate left-hand axis (0 to 60, most likely the Analyzer overlay's scale) that are each perfectly linear across the identical full plot height — +15/0/-15 line up exactly with the left axis's 0/30/60 at the top edge, dead center, and bottom edge. The lesson generalizes beyond this one plugin: an assumption that's been sitting in a code comment since a component was first built isn't "validated" just because it's old and nobody's questioned it — check it against the actual reference image, pixel by pixel, before trusting it or building further on top of it. (The general "asymmetric or dual scales, if that's what the real plugin uses" guidance a few paragraphs above this one is still correct as written — Channel EQ's own two-*axis* design is a real example of it; only the specific non-linear-single-axis model was wrong.)

**Correction (2026-07-31): a per-band UI element (icon, label) that represents a fixed "slot" in a plugin's layout belongs in a static, evenly-spaced column — not at its band's actual value plotted on a data axis.** Channel EQ's 8 band-type icons were originally positioned via `freqToX(band.freq)`, i.e. computed from each band's real frequency and placed on the same log-frequency axis the curve is drawn against. That's the wrong model: the real reference shows the icons sitting in 8 fixed, evenly-spaced columns that line up with the band-data readout row underneath (itself already built as 8 equal-width columns) — completely independent of where that band's frequency happens to fall on the graph's log axis. The two layouts only coincidentally look similar near the middle of the frequency range, which is what let this go unnoticed initially. General rule: before tying a UI element's position to a live-computed value, check whether the real reference actually plots it against that axis, or whether it's a fixed per-slot column that only looks data-driven.

---

# Components

Buttons

- Rounded corners
- High contrast
- Strong typography
- Comfortable padding
- Clear hover state

Inputs

- White background
- Soft border
- Large padding
- Comfortable spacing
- Simple icons only when useful

Cards

- White background
- Soft shadow
- Rounded corners
- Large internal spacing

Navigation

Minimal.

Simple.

Do not overload the navigation with unnecessary links.

---

# Spacing

Use generous whitespace.

If an element can breathe more, give it more room.

Avoid filling space simply because it exists.

---

# Animations

Animations should feel:

Fast.

Subtle.

Purposeful.

Avoid unnecessary movement.

Animation should reinforce interaction rather than distract.

Implementation: the `motion` library (Motion, formerly Framer Motion). Content fades/lifts in as the user scrolls to it, not all at once on page load. Buttons and interactive elements get a small hover/tap response.

Always respect reduced-motion preferences (`MotionConfig reducedMotion="user"` or equivalent) — this is not optional.

---

# Icons

Use simple outline icons.

Maintain a consistent style across the application.

Avoid mixing icon styles.

---

# Images

Avoid generic stock photography.

Avoid AI-generated people.

Where possible, showcase:

- Product interface
- Logic Pro inspiration
- Plugin visualisations
- Simple abstract gradients

Texture: a very faint film-grain overlay on large gradient areas (low single-digit opacity) stops them reading as flat/plasticky. Subtle enough that it shouldn't be consciously noticed.

---

# Design Inspiration

The overall aesthetic should take inspiration from:

- Linear
- Vercel
- Notion
- Raycast
- Stripe
- Apple
- ElevenLabs — restraint; colour as one confident moment, not a wash
- ToneAdapt — a close analog product (guitar tone matching instead of vocals); its "how it works" storytelling shape
- Lovable / Suno — for how much more colour and motion an AI product can carry before it stops feeling premium; don't over-correct back to plain

Take inspiration from:

- typography
- spacing
- visual hierarchy
- simplicity

Do not directly copy layouts.

---

# Music Identity

VocAligner is for music creators.

The interface should hint at music production without becoming cliché.

Avoid:

- neon waveforms
- flashing equalisers
- DJ aesthetics
- gaming-inspired UI

Instead:

- subtle waveform-inspired dividers
- elegant audio-inspired graphics
- Logic Pro-inspired interface elements
- clean plugin visualisations

Music should feel integrated rather than decorative.

---

# Accessibility

Design for readability.

Maintain strong colour contrast.

Ensure buttons are easily clickable.

Never sacrifice usability for aesthetics.

---

# Golden Rules

Every page should answer:

1. What is this?

2. Why should I care?

3. What should I do next?

If an element does not improve clarity...

Remove it.

Less is almost always better.

---

# Things to Avoid

Do not:

- overcrowd layouts
- use unnecessary gradients
- overuse shadows
- overuse animations
- use more than one primary call-to-action
- create visual noise
- make interfaces feel like dashboards unless they are dashboards

Every element should have a reason to exist.

---

# Final Principle

VocAligner should feel like software that could have been designed by Apple for Logic Pro users.

Simple.

Elegant.

Creative.

Professional.

Confident.