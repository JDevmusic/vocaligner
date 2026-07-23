---
title: 'Landing Page Design Direction Exploration'
type: 'chore'
created: '2026-07-23'
status: 'done'
route: 'one-shot'
---

# Landing Page Design Direction Exploration

## Intent

**Problem:** The current landing page (`web/app/page.tsx`) partially reflects `docs/DESIGN_SYSTEM.md`, but the owner isn't sure the design system itself is dialed in — they want to compare real alternatives before deciding whether to refine it.

**Approach:** Build a throwaway comparison route (`/design-preview`) with three structurally distinct full-page mockups — "Sunset Editorial" (refined version of today's direction), "Studio Console" (Linear/Raycast-style split hero with a channel-strip visual), and "Minimal Focus" (ElevenLabs/Notion-style single-input-as-hero) — for the owner to review live, then feed their pick/feedback into an updated `docs/DESIGN_SYSTEM.md` and a pass to align the rest of the app.

## Suggested Review Order

**Entry point**

- Start here — the route itself, three mockups stacked behind a sticky jump-nav.
  [`design-preview/page.tsx:12`](../../web/app/design-preview/page.tsx#L12)

**Design A — Sunset Editorial**

- Closest to the current shipped page; reuses the existing `.hero-gradient` class and `Wordmark` component.
  [`design-preview/page.tsx:51`](../../web/app/design-preview/page.tsx#L51)

**Design B — Studio Console**

- Asymmetric split hero with a real top nav; sunset gradient reduced to a blurred radial glow behind a channel-strip card.
  [`design-preview/page.tsx:140`](../../web/app/design-preview/page.tsx#L140)

**Design C — Minimal Focus**

- Vertically centered, single pill-shaped input bar as the visual hero; everything else reduced to a whisper.
  [`design-preview/page.tsx:264`](../../web/app/design-preview/page.tsx#L264)

**Shared data extraction**

- `CHAIN_PREVIEW` / `HOW_IT_WORKS` moved out of `page.tsx` (a client component) into a plain module — importing consts from a `"use client"` file into a server-rendered route crashes at runtime on the RSC boundary; this was caught and fixed during review.
  [`landing-copy.ts:1`](../../web/app/landing-copy.ts#L1)

**Peripherals**

- `page.tsx` now imports shared copy instead of defining it inline.
  [`page.tsx:1`](../../web/app/page.tsx#L1)
