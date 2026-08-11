# Handoff: VocAligner, extended Anthropic-vs-Luna evaluation session, several real bugs found and fixed

You're picking up mid-decision — the founder (Pilki/Jake) is actively comparing Claude Sonnet 5
(Anthropic) against GPT-5.6 Luna (via OpenRouter) as the production model, using real Logic Pro
listening tests as the actual evidence, not just synthetic metrics. This file supersedes
`pm-handoff-2026-08-03.md` (deleted as part of this session's cleanup — everything in it is
either resolved or carried forward here). Read this fully before doing anything; it's long
because a lot of real, load-bearing findings came out of this session.

## Where things actually stand

The MVP (per `CLAUDE.md`'s five priorities) is still fully shipped, per the 08-03 handoff. This
session was entirely spent on: (1) building tooling to visually compare Anthropic vs. Luna
side by side, (2) using that tooling to run repeated real A/B trials, and (3) fixing a chain of
real bugs the trials surfaced — several of which were self-inflicted by changes made *during*
this same session, caught and fixed within it.

## The model decision itself — still not fully committed, but leaning Luna

Evidence gathered across ~5 real trials on 3 different songs (Tame Impala's "The Less I Know
The Better" x3, The Strokes' "Last Night", Travis Scott's "goosebumps"):

- **Cost**: confirmed via real measured API responses, not estimates. One full Anthropic
  generation (research + reasoning + generation, 3 calls) = ~$0.073 at Anthropic's current
  rate ($2/$10 per million input/output tokens). **That rate is introductory and expires
  2026-08-31** — standard pricing after that is $3/$15/million, a flat 50% increase on every
  future generation (~11¢ instead of ~7.4¢), confirmed directly from Anthropic's own pricing
  page. Luna costs roughly $0.002-0.005 per generation — 30-100x cheaper.
- **Speed**: Luna consistently faster (~27s vs ~55-58s for Anthropic in direct comparison).
- **Sound quality, by ear, in real Logic**: genuinely mixed across the 3 songs — Anthropic
  clearly preferred once, Luna clearly preferred once (The Strokes), "fairly similar" the third
  time. Not a clean win either way.
- **Reliability**: Anthropic failed outright twice during this session, but **both were bugs
  introduced by changes made this session, not organic Anthropic unreliability** — see below.
  Once fixed, Anthropic was reliable again. Luna never failed once in this session's trials.
- **The one real, still-unresolved red flag**: **key/root-note detection is unreliable on both
  models.** Confirmed wrong 3 separate times across 2 songs: Tame Impala's real key is C♯
  minor — Luna guessed C Major once, F♯ minor another time (both wrong). Travis Scott's
  "goosebumps" is real-key E minor — Luna guessed C♯ minor, Anthropic guessed C minor (both
  wrong, and this time even the root note was off, not just the scale variant). This isn't
  model-specific; neither model can reliably recall a song's actual key from training data.
  See "GetSongBPM integration" below — this is the planned real fix, not yet built.

**Founder's own read as of the last message**: leaning Luna given the scale of the cost/speed
advantage and now-mixed quality signal, but hasn't fully committed and wants the key-accuracy
question resolved (or at least mitigated) before doing so.

## What was built this session

1. **`/compare/plugins` internal tool** (`web/app/compare/plugins/page.tsx`) — runs the real
   pipeline against exactly Anthropic + Luna in parallel (via a new `models` filter added to
   `web/app/api/compare/route.ts`, so it doesn't pay for the other 4 configured comparison
   models every time) and renders both resulting plugin chains full-width, stacked (not
   side-by-side — see the layout bug below for why), using the real `PluginVisual` components,
   so the founder can visually compare knob-for-knob, not just read summary stats. The plugin-
   visual dispatch table was extracted out of `results/page.tsx` into a new shared
   `web/app/components/PluginChainVisual.tsx` so it isn't duplicated between the real results
   page and this comparison tool.
2. Cost/time breakdown UI on that same page, using real measured token counts and per-model
   pricing from `comparisonModels.ts` (unchanged from before this session).

## Real bugs found via live testing this session, all fixed

1. **ChromaVerb's Dry/Wet faders were being silently clipped** — not a ChromaVerb-specific
   sizing bug like it first appeared (two rounds of bumping its own declared width, 1000px →
   1080px → 1250px, did nothing). The actual cause, found only after Tape Delay started showing
   the same symptom: the `/compare/plugins` page's original 2-column grid squeezed every
   ~1000px+-wide plugin card into ~650px columns, and these components' internal layout (fixed-
   pixel padding, fixed-size knob SVGs) doesn't reflow to fit a smaller box the way the outer
   card's `maxWidth: 100%` does — so content overflowed and got clipped by `overflow-hidden`,
   for *any* wide plugin, not just ChromaVerb. Fixed by switching that page from a 2-column grid
   to a stacked (full-width, one model's chain after the other) layout — the same rendering
   context the real results page already used correctly. **Lesson for next time a "just widen
   it" fix doesn't work on the second try: check whether the actual constraint is the parent
   container, not the component.**
2. **Claude Sonnet 5 hard-rejects the `temperature` parameter** — confirmed live, 100%
   reproducible (not intermittent), 400 `invalid_request_error`: `` `temperature` is deprecated
   for this model ``. This broke every single Anthropic generation for a window of this session,
   immediately after temperature was added to the Research/Reasoning stages (see next item) to
   reduce run-to-run variance. Fixed by never sending `temperature` to the Anthropic client
   specifically — OpenRouter-routed models (Luna) have no such restriction and keep the benefit.
   Consequence worth knowing: **there's currently no way to reduce Anthropic's own output
   variance via temperature** — that lever simply isn't available for this model.
3. **Generation stage had no real quality floor, unlike Reasoning** — Story 3.2 (a prior
   session) added `MIN_PROCESSING_INTENTS = 3` with retry to the Reasoning stage, but Generation
   was left with only `.min(1)`, so a single-plugin "just Compressor" response could be accepted
   as `"status": "valid"`. Confirmed live (exactly this happened during a real trial). Fixed by
   adding an equivalent `MIN_PLUGINS = 3` floor (`web/lib/schema/chain.ts`) with the same
   throw-and-retry pattern in `generationStage.ts`. Applies to both models equally.
4. **Channel EQ's Q value never got the bold/real-vs-default styling Freq and Gain already
   had** — a simple oversight (`ChannelEqVisual.tsx`), now matches its siblings using the exact
   same `band.enabled` flag they already used.
5. **Pitch Correction was being suggested far too often** — the Reasoning-stage prompt had
   zero guidance on when pitch correction is actually warranted; the model was inferring "I
   can name this song's key, therefore pitch is relevant" with nothing pushing back, so it got
   added even for songs like Tame Impala and The Strokes where it isn't stylistically called
   for. Fixed with an explicit instruction (with a Travis Scott "Highest in the Room" example)
   to only raise it for an audibly obvious pitch-correction/vocoder aesthetic.
6. **The Pitch Correction visual couldn't distinguish "no key detected" from "the model
   confidently said C Major"** — `rootNote`/`scale` both have registry defaults, so when a
   model didn't set them at all, the display silently showed the default as if it were a real
   answer. Now shows "Not detected" honestly when the model didn't set a key.
7. **`rootNote`/`scale` had no constraint tying them to Logic's actual real dropdown values** —
   confirmed live: models were free-text-generating imprecise descriptions like "Minor Scale"
   that don't correspond to any one of Logic's several distinct real minor variants (Natural/
   Aeolian, Harmonic, Melodic, Pentatonic), leaving the founder unable to tell which one to
   actually select in Logic. This codebase already had Logic's *exact* real Root Note/Scale-
   Chord list transcribed and verified (`web/lib/pitch/scaleIntervals.ts`) — it just wasn't
   being used to constrain generation. Added a new `options` field to the plugin registry's
   `ControlDefinition` type, populated it for these two controls, told the model to match one
   exactly (mirroring the existing min/max instruction), and added rejection (not silent
   repair) if a future response still doesn't match a real option.

**A sibling issue found but deliberately not fixed**: Phaser's `sweepMode` has the exact same
shape of problem (free-text string, no real option list) — not fixed because, unlike rootNote/
scale, there's no verified real Sweep Mode option list anywhere in this project's docs yet.
Logged in `deferred-work.md` rather than guessed at.

## The GetSongBPM integration — scoped, not yet built, blocked on deployment

Given both models are unreliable at recalling a song's real key from training data, the plan is
to stop asking the model to guess it at all: fetch the real key from a free external API
(GetSongBPM) in parallel with the Research stage, and if the generated chain includes Pitch
Correction, override its rootNote/scale with the real looked-up value (same "app-computed, not
model-trusted" treatment `order`/`wasRepaired` already get) — falling back to today's
model-guess behavior if the lookup doesn't find the song. Also picks up real tempo, which would
let Tape Delay's time be tempo-locked to a real musical subdivision instead of freely generated
— a second, smaller accuracy win.

**Spotify's Audio Features API was investigated and ruled out** — confirmed directly from
Spotify's own official policy that the endpoint has been closed to all new applications since
November 2024, no waitlist, no stated path back. Not a cost question (Spotify's API is free);
it's a hard access block for a new app.

**GetSongBPM turned out to be blocked on something bigger**: signing up requires a "Backlink
URL" — the URL of a page that **already has** a live link back to getsongbpm.com on it (per
`docs/images/reference/GetsongbpmAPI.png`, a screenshot of the actual signup form). VocAligner
only exists on `localhost:3000` right now — there's no real, public URL yet for that link to
live on. **This is why the founder is now moving to buy `vocaligner.com`** — the deployment
question (already flagged as an undecided architecture item back in the original planning
work) has effectively been forced by this integration. Once a real domain/deployment exists:
add the GetSongBPM attribution link (Footer component is the natural spot, but placement is
the founder's call, not decided yet), complete the GetSongBPM signup, add `GETSONGBPM_API_KEY`
to `.env.local` (**never `Read`/`cat` that file once it holds a real key** — see below), then
build the integration described above.

## The code review workflow this project uses

Per the 08-03 handoff: create a story → implement directly → background-agent code review via
the `bmad-code-review` skill → verify the commit yourself. **This session's fixes were NOT run
through that formal process** — they were implemented directly, verified with `tsc`/`eslint`/
`vitest` after every change, and several were verified live against the real Anthropic API
before being considered done (the temperature bug and the MIN_PLUGINS gap especially). Given
the founder's time pressure at the end of this session (needing to restart their machine), a
full formal review wasn't run before committing. **Worth running `bmad-code-review` against
this session's combined diff in a calmer moment**, even though every individual change was
carefully reasoned through and tested — that's exactly the "tests pass is never proof something
is actually correct" discipline this project has leaned on before.

## Hard rules, still in force

- **Never `Read`/`cat` `.env.local` once it holds a real secret.** Two rotation incidents in an
  earlier session are why this rule exists. Use `grep -c "^VAR_NAME=" .env.local` to check
  presence, `printf '...' >> .env.local` to append blind. This applies to the upcoming
  `GETSONGBPM_API_KEY` too.
- The founder is a beginner around day-to-day dev practice generally, not just secrets —
  continue explaining things plainly (this session included a from-scratch explanation of what
  a public GitHub repo does and doesn't expose, and what a "backlink URL" signup requirement
  actually means).

## Suggested next steps, in order

1. Founder is getting `vocaligner.com` and will deploy the app for the first time. That's a
   real, meaningful step (their app becomes reachable on the public internet, even if
   unlinked/unannounced) — walk through hosting choice (Vercel is the natural fit for this
   Next.js app, free tier, minutes not hours) and how the existing API keys move over safely
   before just doing it.
2. Once deployed: add the GetSongBPM attribution link, complete that signup, build the
   integration described above.
3. Re-run the Anthropic-vs-Luna key-accuracy test once GetSongBPM is wired in — this was
   explicitly requested as the next trial once the integration lands.
4. Consider running this session's combined diff through a real `bmad-code-review` pass in a
   calmer moment, per the note above.
5. The model decision itself is still open — worth deciding whether "good enough key accuracy
   via GetSongBPM regardless of which model" resolves the founder's last real hesitation about
   committing to Luna, once that data point exists.
