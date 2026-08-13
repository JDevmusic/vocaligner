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
}

// Minimal shape this module actually needs from a limiter -- lets tests inject a fake
// instead of hitting real Upstash, same DI pattern as this project's other injectable
// clients (e.g. anthropicModelClient.ts's `client` option).
export interface Limiter {
  limit(identifier: string): Promise<{ success: boolean; reset: number }>;
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

  const result = await limiter.limit(identifier);
  if (result.success) return { allowed: true };

  const retryAfterSeconds = Math.max(0, Math.ceil((result.reset - Date.now()) / 1000));
  return { allowed: false, retryAfterSeconds };
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
  const first = forwardedFor.split(",")[0]?.trim();
  return first || null;
}
