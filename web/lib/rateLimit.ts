import { Ratelimit } from "@upstash/ratelimit";
import { getRedisClient, isUpstashConfigured } from "./store/upstashConfig";

// Well above normal single-user behavior (a real user submits one generation, maybe a
// few more while trying different songs) but tight enough to bound a runaway script's
// AI cost quickly -- a judgment call (Epic 5 Story 5.1), not derived from measured
// traffic. Easy to tune later.
const REQUESTS_PER_WINDOW = 10;
const WINDOW = "1 h";

export interface RateLimitResult {
  allowed: boolean;
  // Only present when allowed is false. Seconds, suitable for a Retry-After header.
  retryAfterSeconds?: number;
  // Present whenever the underlying limiter reports one (real Upstash always does; a test
  // fake typically won't). Callers should forward this to `waitUntil` (see route.ts call
  // sites) -- @upstash/ratelimit uses it for background analytics/multi-region sync that
  // would otherwise risk being cut off once the serverless function's response is sent.
  pending?: Promise<unknown>;
}

// Minimal shape this module actually needs from a limiter -- lets tests inject a fake
// instead of hitting real Upstash, same DI pattern as this project's other injectable
// clients (e.g. anthropicModelClient.ts's `client` option). `pending` is optional so
// existing test fakes that don't supply one remain valid.
export interface Limiter {
  limit(identifier: string): Promise<{ success: boolean; reset: number; pending?: Promise<unknown> }>;
}

// The pure, fully-testable core: given a resolved limiter (or null, meaning "not
// configured"), decide allow/block. Always takes an explicit limiter rather than
// resolving a default internally, so tests never need to fight environment detection to
// exercise either branch.
export async function evaluateRateLimit(identifier: string, limiter: Limiter | null): Promise<RateLimitResult> {
  if (!limiter) {
    // Upstash isn't configured -- same "don't break local dev / safe deploy order"
    // fallback as generationStore.ts's InMemoryStore. Rate limiting is a hardening layer,
    // not core functionality; skipping it here is strictly safer than either blocking
    // everyone or building a separate in-memory limiter whose per-instance counts
    // wouldn't mean anything across Vercel's serverless instances anyway.
    return { allowed: true };
  }

  // A configured limiter can still fail at call time -- a Redis timeout or transient
  // Upstash outage, distinct from "not configured" above. Without this, that failure
  // would propagate as an unhandled rejection out of route.ts's POST (its only try/catch
  // wraps just the generation call, not this check) and 500 every request until the
  // outage clears -- turning a hardening layer into a full outage of the revenue path,
  // worse than having no rate limiter at all. Same fail-open-on-store-error convention as
  // generationStore.ts's getGenerationById/getCachedGeneration.
  let result: { success: boolean; reset: number; pending?: Promise<unknown> };
  try {
    result = await limiter.limit(identifier);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown error";
    console.error(`[rateLimit] limiter.limit() failed, failing open for this request: ${reason}.`);
    return { allowed: true };
  }
  // Forwarded regardless of allow/block -- the background work `pending` represents
  // (analytics, multi-region sync) happens either way, not just on a block.
  if (result.success) return { allowed: true, pending: result.pending };

  const retryAfterSeconds = Math.max(0, Math.ceil((result.reset - Date.now()) / 1000));
  return { allowed: false, retryAfterSeconds, pending: result.pending };
}

let defaultLimiter: Limiter | null | undefined;

function getDefaultLimiter(): Limiter | null {
  if (defaultLimiter === undefined) {
    defaultLimiter = isUpstashConfigured()
      ? new Ratelimit({
          redis: getRedisClient(),
          limiter: Ratelimit.slidingWindow(REQUESTS_PER_WINDOW, WINDOW),
          // Namespaces this limiter's keys away from generationStore.ts's generation:*/
          // cache:* keys in the same Redis instance -- @upstash/ratelimit prefixes every
          // key it writes with this string.
          prefix: "ratelimit:generate",
        })
      : null;
  }
  return defaultLimiter;
}

// The production entry point -- route.ts calls this directly.
export async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
  return evaluateRateLimit(identifier, getDefaultLimiter());
}

// Autocomplete's own limiter, separate from generate's above: a much higher budget,
// tuned for "several requests per keystroke burst while someone types" rather than
// generate's "a handful of real submissions per hour" -- these are cheap catalog searches
// against Spotify/GetSongBPM, not paid AI calls, so the risk profile is "don't let a
// runaway script hammer our server," not "bound AI cost."
const SUGGEST_REQUESTS_PER_WINDOW = 60;
const SUGGEST_WINDOW = "1 m";

let suggestLimiter: Limiter | null | undefined;

function getSuggestLimiter(): Limiter | null {
  if (suggestLimiter === undefined) {
    suggestLimiter = isUpstashConfigured()
      ? new Ratelimit({
          redis: getRedisClient(),
          limiter: Ratelimit.slidingWindow(SUGGEST_REQUESTS_PER_WINDOW, SUGGEST_WINDOW),
          prefix: "ratelimit:suggest",
        })
      : null;
  }
  return suggestLimiter;
}

export async function checkSuggestRateLimit(identifier: string): Promise<RateLimitResult> {
  return evaluateRateLimit(identifier, getSuggestLimiter());
}

// x-forwarded-for is safe to trust for this specifically on Vercel: they overwrite it at
// the edge and do not forward a client-supplied value (confirmed against Vercel's own
// docs), so this can't be spoofed to dodge the limit. Can contain a comma-separated chain
// (client, proxy, proxy, ...); the first entry is the original client. Returns null if the
// header is missing (shouldn't happen on Vercel per their docs, but real for local dev) --
// callers should skip rate limiting rather than lump every unidentified request into one
// shared bucket.
export function getClientIdentifier(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (!forwardedFor) return null;
  // .find(Boolean), not [0]: a header value with a leading/empty segment (e.g. ",203.0.113.7")
  // would otherwise yield an empty first entry and silently fall into the same "no
  // identifier, skip rate limiting" path as a genuinely missing header -- even though a
  // real client IP is present, just not in the first slot.
  const first = forwardedFor
    .split(",")
    .map((entry) => entry.trim())
    .find((entry) => entry.length > 0);
  return first ?? null;
}
