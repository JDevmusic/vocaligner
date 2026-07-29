# VocAligner Design System

Version 1.4 — landing page is aligned to v1.1 (Story 1.1, 2026-07-24). The throwaway `/design-preview` exploration route has been deleted. v1.2 (2026-07-27) added the Plugin Visual Fidelity Standards section, following issues found in early Channel EQ mockups. v1.3 (2026-07-29) closes out that mockup process — the bespoke-per-plugin decision it validated is now confirmed in-scope for MVP (see PRD, Architecture, and Story 1.3), and the standards section carries the finalized rules for Channel EQ and Pitch Correction. v1.4 (2026-07-30) generalizes the "show the real panel's full structure, faded where there's no data" rule (previously only stated for Pitch Correction) to every plugin — the first pass on the other 8 knob-based plugins reverted to a generic single-row-of-available-knobs layout without it.

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

Functional pages (loading, results) keep the simpler warm sunset yellow gradient fading to white, as before. Reserve the fuller white-to-gold-to-purple treatment for the landing page, where there's room for it to breathe.

Avoid harsh colour changes anywhere. Blend, don't cut.

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

Background and chrome stay calm and simple (the existing sunset-to-white gradient, minimal decoration) — deliberately, not by default. Someone reading real plugin settings or waiting on a real result needs clarity and focus, not the landing page's richer wash; that treatment is reserved for the one-time first impression. Never import the dark storytelling palette here.

The Plugin Visual (how a generated chain is actually displayed) is the exception and the priority: it's the product's actual payoff moment, not a technical afterthought. It deserves the same design care as the landing page hero — this is where "premium" has to be true, not just claimed.

Typography, spacing, and component styling (buttons, cards) on these pages should read as the same product as the new landing page — a light consistency pass, not a full redesign, and never at the cost of the calm background principle above.

---

# Plugin Visual Fidelity Standards

Applies to every bespoke Plugin Visual (Channel EQ, Pitch Correction, and all knob-based plugins) — specific to this component family, not general UI guidance.

Always work from the real Logic Pro reference screenshot for that specific plugin (`docs/images.md/*_plugin.png`). Compare the built mockup against it directly before calling it done — "in the spirit of" is not the bar.

Verify the neutral/default state first. Before checking how a visual looks with real data applied, confirm it renders as genuinely neutral when every value sits at its Logic default — a computed or derived visual (a curve, a meter position, a highlighted note) is only trustworthy if its resting state actually reads as resting.

Custom icons and controls only. Never substitute a generic icon-library glyph, a placeholder text/ASCII character, or a default charting-library affordance (data-point markers, default gridline spacing, generic legend/tooltip styling) for what the real plugin actually shows. Logic's plugins have their own dense, specific visual language — match it.

Any scale, axis, or range in a bespoke visual should reflect the real plugin's own scale design (including asymmetric or dual scales, if that's what the real plugin uses), not a generic linear default sized to whatever charting approach produced it.

**Show the real panel's full structure, not just the controls the registry happens to have data for.** A plugin's real Logic panel is the layout target — sections, groupings, meters, mode tabs, gain staging — even where VocAligner doesn't generate a value for every element. Elements without backing data are shown in their real position, faded/grayed (same convention as literal control values: recommended data is bold/colored, everything else is muted) — never silently dropped from the layout. A visual that only renders the handful of controls with data, arranged as a generic single row, isn't "the real plugin, simplified" — it's the generic template this whole process was meant to replace, just wearing the right plugin name. This is the same principle already applied correctly to Pitch Correction (Settings/Tuning sections are shown in place and faded, not omitted) — it applies to every plugin, not just that one. Concretely, for a plugin like Compressor: the meter, circuit-mode tabs, Limiter section, and Input/Output Gain all have a real position on the real panel and should appear there, faded, even with no data behind them — not vanish because the registry only models 5 knobs.

**Pitch Correction's keyboard must highlight notes based on the actual researched Root Note + Scale/Chord** — never a fixed or literal black/white piano rendering. Compute the scale's member notes from standard music-theory interval patterns (e.g. major = W-W-H-W-W-W-H from the root) and apply the same bold/faded convention used elsewhere (in-scale notes highlighted, out-of-scale notes faded), regardless of whether a note is physically a white or black key. A C Major example will coincidentally highlight only the white keys — that matches literal piano coloring by chance, not evidence the mapping is correct. Verify against a scale that includes at least one black key (e.g. G Major, which includes F#) before considering this done.

This means literally the same two flat colors for every key, black or white — one for in-scale, one for faded/out-of-scale. Do not tint, darken, or blend the color differently for black keys (e.g. a black key's own natural darkness bleeding into the highlight/fade color) — that produces a muddy in-between tone that reads as ambiguous rather than clearly on or off. Black vs. white key identity should only be communicated by shape/size (the traditional shorter, narrower key silhouette), never by a color difference. Matches how real Logic does it — see PitchCorrection_plugin.png, where every key in Chromatic Scale mode is the exact same blue regardless of black/white.

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