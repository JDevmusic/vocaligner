---
baseline_commit: 8548d3694f02a7ac54813afe362bc8ea23b6a96f
---

# Story 1.1: Promote the converged landing page design into production

Status: review

## Story

As a visitor,
I want the landing page I actually see to be the design the founder converged on (not the old placeholder, not a throwaway preview route),
so that the product's first impression matches what's actually been decided.

## Acceptance Criteria

1. Given the converged design currently lives only at `/design-preview` (`DesignH.tsx` hero + `MeetSection.tsx`), when this story is done, then that composition renders at `/` — the real landing page.
2. Given the mockup's form currently no-ops (`event.preventDefault()`, button titled "Preview only — not wired up"), when this story is done, then the Artist/Song input is wired to real submission: controlled inputs, disabled-until-both-non-empty gating (matching the old `page.tsx`'s `canGenerate` logic), and on submit it navigates to `/loading?artist=&song=` exactly as the old page did.
3. Given the design is promoted, when this story is done, then the throwaway `/design-preview` route and its wrapper (`DesignPreviewClient.tsx`, `design-preview/page.tsx`) are deleted, and the genuinely reusable pieces (`MeetSection.tsx`, `AnimatedButton.tsx`, `motion-shared.ts`) are moved into the real app structure — not left behind in a throwaway folder.
4. Given `docs/DESIGN_SYSTEM.md`'s Footer section, when this story is done, then a reusable `Footer` component (brand mark + wordmark, copyright, Apple trademark disclaimer) renders on the landing page — no links to pages that don't exist yet.
5. Given `loading/page.tsx` and `results/page.tsx`, when this story is done, then **neither is touched** — they keep their current simple gradient/visual treatment exactly as-is (Design System v1.1 scopes the new palette to the landing page only; the functional-pages consistency pass is Story 1.4's job, not this one).
6. Given any markup this story adds or moves, when styled, then it follows Architecture AD-6 exactly: semantic tokens for flat colors, `--wash-*` custom properties via inline `style` for gradients, no confusing shadcn's `--accent`/`--muted` with the brand's `--brand-accent`/`text-muted`, and never a raw hex value or raw Tailwind palette utility.

## Tasks / Subtasks

- [x] Task 1: Promote the hero (AC: 1, 2)
  - [x] Bring `DesignH.tsx`'s markup into `web/app/page.tsx` as the real landing page (whether inlined or kept as an imported component is your call — it must be the only thing rendered at `/`, not a design-preview import).
  - [x] Convert the Artist/Song inputs to controlled state (`useState`, matching the old `page.tsx`'s pattern) and wire a real `handleGenerate`: prevent default, guard on both fields non-empty, `router.push(`/loading?${new URLSearchParams({artist, song})}`)`.
  - [x] `AnimatedButton` is `type="button"`, not `type="submit"` — either change it to `type="submit"` for this usage or call the submit handler directly from its click. Carry over the disabled-until-both-filled (`canGenerate`) gating from the old `page.tsx`; the button currently has no disabled state at all.
- [x] Task 2: Promote Meet VocAligner (AC: 1)
  - [x] Move `MeetSection.tsx` to `web/app/components/MeetSection.tsx`; render it directly below the hero on `/`.
  - [x] Reconcile the "how it works" copy duplication: `MeetSection.tsx` has its own inline `STEPS` array; `landing-copy.ts` still exports the old `HOW_IT_WORKS`, which becomes dead code once this ships (the old `page.tsx` was its only consumer). Consolidate to one source — moving `STEPS` into `landing-copy.ts` matches how `CHAIN_PREVIEW` is already shared — and delete `HOW_IT_WORKS`.
- [x] Task 3: Move reusable pieces out of the throwaway folder (AC: 3)
  - [x] Move `AnimatedButton.tsx` and `motion-shared.ts` to `web/app/components/` (same location as `Wordmark.tsx`, `Mark.tsx`, `MeetSection.tsx`); update imports.
- [x] Task 4: Delete the throwaway route (AC: 3)
  - [x] Delete `web/app/design-preview/` entirely (`page.tsx`, `DesignPreviewClient.tsx`) once nothing else references it. Leave `_bmad-output/implementation-artifacts/spec-landing-design-directions.md` alone — that's a historical record, not code, and isn't covered by the "delete once aligned" note.
- [x] Task 5: Footer (AC: 4)
  - [x] Create `web/app/components/Footer.tsx`: brand mark + wordmark, "© {year} VocAligner", "Not affiliated with or endorsed by Apple. Logic Pro is a trademark of Apple Inc." — no links to Privacy/Terms/Contact or anything else that doesn't exist yet.
  - [x] Render it on the landing page only.
- [x] Task 6: Confirm no collateral damage (AC: 5)
  - [x] Diff review: `loading/page.tsx` and `results/page.tsx` must show zero changes from this story.

## Dev Notes

- **What's being promoted, precisely:** `DesignPreviewClient.tsx` currently renders `<MotionConfig reducedMotion="user"><DesignH /><MeetSection /></MotionConfig>`. **Preserve the `MotionConfig reducedMotion="user"` wrapper** in the promoted version — the Design System's Animations section states respecting reduced-motion is "not optional," not a nice-to-have.
- **No new dependencies needed.** `DesignH.tsx` already imports `Mark` (`components/Mark.tsx`, already in production), `CHAIN_PREVIEW` (`landing-copy.ts`), `AnimatedButton`, and `item` (`motion-shared.ts`) — all either already exist or are moved by this story.
- **The gradient is already tokenized** — `DesignH.tsx`'s hero background is an inline `style` referencing `--wash-deep`/`--wash-coral`/`--sunset-start`/`--wash-lavender`/`--sunset-fade`, all already defined in `globals.css`. Don't invent new tokens unless a genuinely new visual need arises.
- **Port the old submission logic, don't reinvent it.** The current (soon-to-be-replaced) `page.tsx` already has correct `handleGenerate`/`canGenerate`/`useRouter`/`useState` logic for real submission — carry it over into the new hero rather than writing it fresh.
- **Footer is landing-page-only.** Do not add it to `loading` or `results`.
- **Testing note** (same constraint as Stories 1.2/1.3): no component-rendering test infrastructure exists in this codebase yet. This story's changes are markup/visual — manual verification via the dev server is expected; no automated test is required.

### Project Structure Notes

- Deleted: `web/app/design-preview/` (entire directory).
- Modified: `web/app/page.tsx` (becomes the promoted hero, wired to real submission), `web/app/landing-copy.ts` (consolidate `STEPS`, remove dead `HOW_IT_WORKS`).
- New/moved to `web/app/components/`: `MeetSection.tsx`, `AnimatedButton.tsx`, `motion-shared.ts`, `Footer.tsx` (new).
- Explicitly untouched: `web/app/loading/page.tsx`, `web/app/results/page.tsx`.

### References

- [Source: docs/DESIGN_SYSTEM.md v1.1 — Hero Section, Storytelling Sections, Footer, Functional Pages]
- [Source: _bmad-output/planning-artifacts/architecture/architecture-VocAligner-2026-07-23/ARCHITECTURE-SPINE.md#AD-6]
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 1: See a Real Vocal Chain, Not a Preview / Story 1.1]
- [Source: web/app/design-preview/DesignH.tsx, MeetSection.tsx, DesignPreviewClient.tsx, AnimatedButton.tsx, motion-shared.ts]
- [Source: web/app/page.tsx (old — the real-submission logic to port)]
- [Source: web/app/landing-copy.ts]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (Amelia, bmad-agent-dev)

### Debug Log References

- Deleting `web/.next` mid-implementation (to clear a stale generated type reference to the deleted `/design-preview` route) broke the already-running dev server (started returning HTTP 500). Restarted it (`lsof -ti:3000 | xargs kill` → `npm run dev`); confirmed healthy afterward (all three routes HTTP 200, no console-visible errors in SSR output).

### Completion Notes List

- `AnimatedButton` gained three new optional props (`type`, `disabled`, `form`) to support real form submission — it previously only supported a fixed `type="button"` with no disabled state, which was fine for the inert design-preview mockup but not for production. Hover/tap motion is now suppressed when `disabled`.
- The button is visually separated from the input sentence (`mt-8` div) but associated with the form via the HTML `form="hero-form"` attribute rather than DOM nesting, matching the original DesignH layout exactly rather than restructuring it.
- `landing-copy.ts`'s `HOW_IT_WORKS` (dead once the old `page.tsx` was replaced) is now `STEPS`, matching `MeetSection.tsx`'s copy exactly and consumed by `MeetSection.tsx` as the single source, per AC and Dev Notes.
- Footer's background uses `var(--wash-purple-deep)` (matching where `MeetSection` ends) rather than introducing a new color, so the page ends in one continuous tone instead of another hard cut — not explicitly specified by the AC, but consistent with the Design System's "blend, don't cut" principle applied elsewhere on this page.
- No automated test added, per this story's explicit Dev Notes exception (no component-rendering test infra exists yet). Verified via: `tsc --noEmit` clean, `eslint` clean, existing Vitest suite still passing (13/13, no regressions), and manual SSR/HTML verification of all three routes (`/`, `/loading`, `/results`) plus confirming `/design-preview` now 404s.
- AC 6 (Architecture AD-6 compliance) verified by inspection: all colors in the moved/new markup are either existing semantic tokens (`text-foreground`, `text-muted`-derived, `text-supporting`) or the pre-existing `--wash-*`/`--sunset-*` custom properties via inline `style`; no new raw hex or Tailwind palette utility was introduced.

### File List

**New:**
- `web/app/components/AnimatedButton.tsx`
- `web/app/components/Footer.tsx`
- `web/app/components/MeetSection.tsx`
- `web/app/components/motion-shared.ts`

**Modified:**
- `web/app/page.tsx` (promoted hero, real submission wiring)
- `web/app/landing-copy.ts` (`HOW_IT_WORKS` → `STEPS`, consolidated)

**Deleted:**
- `web/app/design-preview/` (entire directory: `page.tsx`, `DesignPreviewClient.tsx`, `DesignH.tsx`, `MeetSection.tsx`, `AnimatedButton.tsx`, `motion-shared.ts`)

**Untouched (verified via diff against baseline commit):**
- `web/app/loading/page.tsx`
- `web/app/results/page.tsx`

## Change Log

- 2026-07-24: Story implemented end-to-end in one session (Tasks 1–6). No review follow-ups yet — first pass.
