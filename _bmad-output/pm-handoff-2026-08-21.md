# Handoff: VocAligner, post-launch hardening complete, landing/loading polish underway

You're picking up mid-polish-pass. This file supersedes `pm-handoff-2026-08-11.md` (kept,
not deleted — it's committed history, unlike the 08-03 file that preceded it). Read this
fully before doing anything; a lot happened across two real sessions since 08-11, and the
project's actual state has moved a long way from what that file describes.

## Where things actually stand

**Everything the 08-11 handoff scoped as "next" is now done and live on `vocaligner.com`.**
That handoff described GetSongBPM as blocked on deployment, and the Anthropic-vs-Luna model
decision as unresolved. Both are resolved. On top of that, a full production-hardening pass
(Epics 4-5) shipped, the internal comparison tool that drove the model decision was retired,
a new results-page feature shipped, and — most recently — real landing/loading page polish
work is in progress at the founder's explicit direction ("improvements and polishing for the
landing page and loading page").

**MVP (Epics 1-3) + production hardening (Epics 4-5): all done, deployed, verified against
real production traffic.** `main` and `bmad` are fully in sync, working tree clean, as of this
writing. Every structural change described below went through the same cycle: implement
directly → self-verify (`tsc`/`eslint`/`vitest` + hit the real running app, often via a real
live API call and/or a Playwright screenshot) → independent background code review
(`bmad-code-review`) → independently re-verify the review's own claims → merge to `main` →
push. This cycle has now caught a real, ship-blocking-caliber bug in nearly every single
round — keep using it for anything non-trivial. See "The code review workflow" below for two
real quirks it has, one already known, one newly discovered this session.

## What got built (in order)

1. **GetSongBPM real key lookup** (Story 3.3, commits `f259f3b`..`0231382`) — overrides Pitch
   Correction's guessed rootNote/scale with a real looked-up value. Shipped broken once: every
   third-party doc source pointed at `api.getsongbpm.com`, which is real but silently blocked
   by a Cloudflare bot-challenge — the founder had to fetch GetSongBPM's actual current docs
   in their own authenticated browser (Cloudflare passes real humans, not scripts) before the
   real host (`api.getsong.co`, changed Sept 2024) was found. One-line fix once found.
2. **Anthropic → Luna as production model, with runtime failover** (commits `9b40fad`,
   `e088ce3`, `acaa8f1`) — founder's decision once the key-accuracy concern above was
   mitigated. Failover falls back to Anthropic only on a genuine transport-level error, not a
   malformed response (that's the existing per-stage retry's job).
3. **Epic 4 — persistent storage** (Stories 4.1+4.2, commits `41eb64f`, `dc7e205`,
   story file `4-1-4-2-persist-generation-results.md`) — `generationStore.ts` moved off an
   in-memory `Map` to Upstash Redis (the Marketplace-provisioned successor to the sunset
   "Vercel KV" product — verified live against Vercel's current docs, not assumed from
   training data). Real deployment gotcha found live: connecting the Upstash integration
   doesn't itself trigger a redeploy, so the app silently kept using the in-memory fallback
   against the real live site until a manual redeploy was triggered. Falls back gracefully to
   in-memory when Upstash isn't configured (safe deploy ordering, local dev).
4. **Epic 5 — rate-limiting `/api/generate`** (Story 5.1, commits `bd898ef`, `86f9a88`,
   story file `5-1-rate-limit-generate-endpoint.md`) — `@upstash/ratelimit`, sliding window,
   10 requests/hour per client IP (`x-forwarded-for`, verified safe to trust specifically on
   Vercel — they overwrite it at the edge, don't forward client-supplied values). Review found
   a real gap: the original "fails open" claim only covered "Upstash not configured," not "a
   live Redis error" — fixed to fail open on any error.
5. **Comparison tool removed** (commit `40f9257`) — `/compare`, `/api/compare`,
   `comparisonModels.ts` all deleted once the model decision was made; this also resolved a
   real cost-exposure finding from the Epic 5 review (the tool had zero rate limiting and
   fanned out to 6+ paid models per request). `openRouterModelClient.ts` and
   `PluginChainVisual.tsx` were kept — both are real production dependencies now, confirmed
   via the actual import graph before deleting anything.
6. **Results page research summary** (commit `8a25e04`, fixed in `452fc18`) — a "What we
   found" section above the Plugin Visuals, surfacing the `research`/`reasoning` data the
   pipeline already generated on every request but never showed anyone. Iterated on wording
   twice with the founder against real output: first pass (raw observation+goal) read as
   accurate but "bulky" and undercut the Plugin Visual's own visual weight; landed on a new
   AI-written `headline` field per processing intent (~6-10 words, added to the Reasoning
   stage's own prompt/schema, not mechanically truncated — truncation was tried and found
   unreliable on real examples, cutting off mid-thought). **Real bug caught by review**: making
   `headline` required broke every pre-existing `/results?id=` permanent link, since those
   never re-check `PIPELINE_VERSION`/`PROMPT_VERSION` by design (AD-10) — fixed by making it
   optional on the domain schema (backward-compat reads) while still required on the
   model-facing wire schema (every fresh generation always has one). Verified live against a
   real pre-existing production record that this actually works, not just in tests.
7. **Loading page fixed** (commits `eb50bf4`, `4ed28d0`, `692b627`) — it used to show 4 fixed
   phases advancing every 900ms (all shown within 3.6s), then freeze on "Step 4 of 4" with a
   full progress bar for the rest of a real ~20-60s generation — looked stuck, not working.
   Now cycles continuously through 12 varied phrases (looping, not capped) with an
   indeterminate pulse instead of a fake-completion fill bar. Review found two real bugs (a
   fixed-height container that could overflow/collide with the bar on long phrases or narrow
   viewports, and the reduced-motion setting not actually covering the opacity pulse — Motion
   only neutralizes transform/layout keys, not opacity) — both fixed.
8. **Landing page chain teaser** (commits `1061f45`, `8dc8112`) — new "See it in action"
   section after "Meet VocAligner": a real Channel EQ visual for a real, once-generated example
   ("The Weeknd" / "Blinding Lights"), fading into the background partway down so the exact
   values stay a reason to click through, "+7 more plugins suggested" (the real count from
   that generation), and a CTA straight to `/loading` with that artist/song pre-filled. Real
   bugs caught: an invisible CTA button (white-on-white, from confusing `--on-dark` — a fixed
   *text* color token — for a background color), and a genuine pre-existing React hydration
   mismatch in `channelEqCurve.ts`'s `freqToX()` (`Math.log10` isn't bit-identical across
   server/browser JS engines) that had never surfaced before because `ChannelEqVisual` was
   previously only ever rendered client-side on `/results` — this landing section is the first
   time it's ever server-rendered. Fixed at the source so every consumer benefits.

## The code review workflow — two known quirks, not silent failures

1. **Already known**: the skill's 3 parallel sub-reviewer agents (Blind Hunter, Edge Case
   Hunter, Acceptance Auditor) very often have their completion notifications misroute to the
   main session instead of the orchestrating background agent. Fix: relay the full verbatim
   content back to the orchestrator via `SendMessage` using its actual agentId. Happened
   again, multiple times, this session — expect it every time.
2. **New this session**: if the machine running Claude Code goes to sleep mid-review, the
   orchestrator and any in-flight sub-agents can fail outright (confirmed via an explicit
   "computer went to sleep" / stream-watchdog error, not a content problem). When this
   happened, a sub-agent (Edge Case Hunter) had actually survived and completed independently,
   reporting straight to the main session with no live orchestrator to relay to — in that
   case, don't try to relay to a dead agent; triage the findings directly, verify empirically
   whatever's checkable (one finding's hypothesis was specifically measured via a live
   Playwright screenshot and found not to hold up), and finish the fix/verify/ship cycle
   yourself rather than paying the cost of relaunching a whole new review round for what's by
   then a small, mostly-reviewed remainder.

## The ongoing knob-increment logging workflow — still active

Confirmed 2026-08-13 (memory: `feedback_knob_increment_logging.md`): generated numeric values
sometimes don't land on anything actually selectable in real Logic Pro, even via
double-click-to-type-exact-value — genuine quantization on at least some controls, not just
mouse-drag imprecision. This can't be researched (no public documentation covers real Logic
knob step resolution) — it's a hands-on-only data-gathering effort. **Whenever the founder
reports a real finding** (plugin, parameter, generated value, nearest real-selectable value —
or a clean step size when discoverable), log it straight into
`_bmad-output/implementation-artifacts/deferred-work.md`'s existing entry, matching its
format. Don't create a new file, don't try to research the gap. This is deliberately building
toward a real per-control audit dataset before "snap generated values to real increments" is
ever scoped as actual work.

## What's still open

1. **Landing/loading page polish — in progress, not "done done."** The founder explicitly
   asked to focus here next; the chain teaser and loading loop are two concrete pieces of it,
   not necessarily the whole scope. Ask directly what else is wanted before assuming the
   polish pass is finished — this file doesn't know if there's more the founder has in mind.
2. **Generation-accuracy backlog** (`deferred-work.md`, 2026-08-11 entries + whatever's been
   logged since via the knob-increment workflow above) — Tape Delay/Phaser knob-range issues,
   quality polish not correctness. Lower priority than landing/loading per the founder's own
   current focus.
3. **Insert vs. send/bus routing** for ChromaVerb/Tape Delay — flagged 2026-08-05, needs its
   own dedicated scoping pass, not yet an epic.
4. **Premium tier (accounts/payments)** — deliberate strategic fork per `CLAUDE.md`, not a
   backlog item, not started. See memory `project_accounts_payments_plan.md` for the founder's
   current thinking (accounts are "a while off") and the database-choice reasoning (Vercel
   KV/Upstash now, not Supabase) if this ever gets revisited — worth re-confirming the
   timeline still holds before trusting that memory, since it'll go stale.
5. **Two low-severity items the last review consciously left open, not fixed**: no
   alerting/monitoring on a silent Upstash misconfiguration in production (only a log line);
   `@upstash/ratelimit`'s `pending` promise isn't forwarded to `waitUntil` (low impact for a
   single-region MVP).

## Hard rules, still in force

- **Never `Read`/`cat` `.env.local` once it holds a real secret.** Use `grep -c "^VAR_NAME="` to
  check presence, `printf '...' >> .env.local` to append blind. Applies to every key in there
  now: `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GETSONGBPM_API_KEY`, and the Upstash
  credentials (`UPSTASH_REDIS_REST_URL`/`TOKEN` or legacy `KV_REST_API_URL`/`TOKEN`).
- **Vercel CLI caution** (memory: `feedback_vercel_cli_caution.md`): don't pass `--yes` to
  `vercel link` as a reflex, especially when the local directory name doesn't match the real
  Vercel project name — it silently created an unwanted duplicate project once this session.
  Check with a read-only command (`vercel project ls`, or plain `vercel link` without `--yes`)
  first. Destructive Vercel CLI commands will likely hit the harness's own auto-mode
  classifier block regardless (confirmed this session) — that's expected; hand those to the
  founder to run via the dashboard.
- The founder is a genuine beginner around day-to-day dev practice, not just secrets — keep
  explaining things plainly, from scratch, every time a new concept comes up (this session
  included: what a React hydration mismatch is, why `Math.log10` isn't bit-identical across
  JS engines, what a CDN/edge header guarantee means for trusting `x-forwarded-for`).

## Suggested next steps, in order

1. **Ask directly what else is in scope for the landing/loading polish pass** — don't assume
   it's finished just because two pieces shipped. The founder brought both the loading-page
   phrase issue and the landing teaser idea up unprompted; there may be more.
2. Once that's settled, the generation-accuracy backlog (Tape Delay/Phaser) and the
   insert-vs-send scoping pass are the next-most-concrete pieces of real, already-identified
   work whenever priorities shift there.
3. The premium tier fork stays a deliberate founder choice to make, not something to drift
   into — keep surfacing it as an option, not a default.
