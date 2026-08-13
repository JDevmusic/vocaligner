import { Redis } from "@upstash/redis";

// Shared by generationStore.ts and rateLimit.ts -- both need to know whether Upstash is
// configured and, if so, share one real client. Extracted so this detection logic exists
// in exactly one place: a prior version had this duplicated inline in generationStore.ts,
// and a second, independent copy for rate limiting would carry the same risk that bit that
// first copy -- silently drifting to only check one of the two possible env var name pairs.
//
// Mirrors Redis.fromEnv()'s own fallback exactly (confirmed by reading the installed
// @upstash/redis source): it accepts UPSTASH_REDIS_REST_URL/TOKEN, or falls back to
// KV_REST_API_URL/TOKEN "for compatibility with Vercel KV and other platforms that may use
// different naming conventions." Recognizing only the UPSTASH_* names would mean a project
// where Vercel's Upstash integration happened to provision the KV_* names instead silently
// gets no Redis-backed behavior anywhere, with nothing in the logs to explain why.
function resolveCredentials(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim() || process.env.KV_REST_API_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim() || process.env.KV_REST_API_TOKEN?.trim();

  if (url && token) return { url, token };

  if (url || token) {
    // Exactly one half of a pair is set. Neither set is expected and silent (local dev);
    // this is not that -- it's much more likely a typo'd or half-copied env var.
    console.warn(
      "[upstashConfig] Only one of the Upstash URL/token environment variables is set " +
        "(checked UPSTASH_REDIS_REST_URL/KV_REST_API_URL and UPSTASH_REDIS_REST_TOKEN/KV_REST_API_TOKEN). " +
        "Treating Upstash as not configured."
    );
  }
  return null;
}

export function isUpstashConfigured(): boolean {
  return resolveCredentials() !== null;
}

let sharedClient: Redis | null = null;

// Returns the same client instance across calls (matters for @upstash/ratelimit, which
// keeps a small internal ephemeral cache keyed to the Redis instance it was built with).
// Throws if called when Upstash isn't configured -- callers must check
// isUpstashConfigured() first, same "check before use" contract as the rest of this
// project's optional-integration pattern (e.g. getModelClient.ts).
export function getRedisClient(): Redis {
  if (!sharedClient) {
    const credentials = resolveCredentials();
    if (!credentials) {
      throw new Error("[upstashConfig] getRedisClient() called without Upstash configured.");
    }
    sharedClient = new Redis(credentials);
  }
  return sharedClient;
}
