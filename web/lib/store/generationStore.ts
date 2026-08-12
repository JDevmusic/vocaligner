import { Redis } from "@upstash/redis";
import { PIPELINE_VERSION } from "../ai/pipelineVersion";
import { PROMPT_VERSION } from "../ai/prompts/version";
import { CURRENT_SCHEMA_VERSION, type VocalChainResponse } from "../schema/vocalChain";

// Minimal shape this module actually needs from a key-value store -- lets tests inject a
// simple in-memory fake instead of hitting real Upstash over the network, same pattern as
// this project's other injectable clients (e.g. anthropicModelClient.ts's `client` option).
export interface KeyValueStore {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, options?: { ex?: number }): Promise<unknown>;
}

// Long enough that no real user's /results link goes stale while they're actually using
// it, short enough to bound storage growth indefinitely -- a judgment call (Story 4.2),
// not derived from a hard requirement. Easy to change; not exposed as an env var since
// there's no current need to tune it per-environment.
const RETENTION_SECONDS = 60 * 60 * 24 * 30; // 30 days

// In-memory fallback (this module's entire behavior before Story 4.1) used when Upstash
// isn't configured -- same "graceful, not broken" pattern as getModelClient.ts's mock
// fallback. This matters for two real cases: local dev without provisioning Upstash, and
// a safe deploy order (this code can ship to production before the Upstash integration is
// actually provisioned in Vercel, without taking down /api/generate in the meantime).
// Exported so tests can exercise this exact fallback path directly, instead of a separate
// hand-rolled fake that could quietly drift from the real thing.
export class InMemoryStore implements KeyValueStore {
  private readonly data = new Map<string, { value: unknown; expiresAt: number | null }>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.data.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && entry.expiresAt < Date.now()) {
      this.data.delete(key);
      return null;
    }
    // structuredClone matches real Redis's actual behavior: every GET deserializes a
    // fresh copy from JSON, so mutating what's returned can never corrupt what's stored.
    // Without this, a caller mutating a returned object would silently corrupt this
    // fallback store in a way real Redis could never reproduce -- a divergence that
    // would only ever show up when Upstash isn't configured (local dev, or the window
    // before it's provisioned in production), not in a test run against this same class.
    return structuredClone(entry.value) as T;
  }

  async set(key: string, value: unknown, options?: { ex?: number }): Promise<"OK"> {
    const expiresAt = options?.ex ? Date.now() + options.ex * 1000 : null;
    this.data.set(key, { value: structuredClone(value), expiresAt });
    return "OK";
  }
}

let defaultStore: KeyValueStore | null = null;

function getDefaultStore(): KeyValueStore {
  if (!defaultStore) {
    // Mirrors Redis.fromEnv()'s own fallback exactly (confirmed by reading the installed
    // @upstash/redis source): it accepts UPSTASH_REDIS_REST_URL/TOKEN, or falls back to
    // KV_REST_API_URL/TOKEN "for compatibility with Vercel KV and other platforms that
    // may use different naming conventions." If this check only recognized the UPSTASH_*
    // names, a project where Vercel's Upstash integration happened to provision the
    // KV_* names instead would silently pick InMemoryStore over a perfectly reachable
    // Redis instance -- reintroducing the exact cross-instance bug this module exists to
    // fix, with nothing in the logs to explain why.
    const url = process.env.UPSTASH_REDIS_REST_URL?.trim() || process.env.KV_REST_API_URL?.trim();
    const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim() || process.env.KV_REST_API_TOKEN?.trim();

    if (url && token) {
      defaultStore = Redis.fromEnv();
    } else {
      if (url || token) {
        // Exactly one half of a pair is set. Local dev with neither set is expected and
        // silent; this is not that -- it's much more likely a typo'd or half-copied env
        // var, and it degrades to InMemoryStore just as silently unless flagged here.
        console.warn(
          "[generationStore] Only one of the Upstash URL/token environment variables is set " +
            "(checked UPSTASH_REDIS_REST_URL/KV_REST_API_URL and UPSTASH_REDIS_REST_TOKEN/KV_REST_API_TOKEN). " +
            "Falling back to an in-memory store, which does not share data across serverless instances."
        );
      }
      defaultStore = new InMemoryStore();
    }
  }
  return defaultStore;
}

function generationKey(id: string): string {
  return `generation:${id}`;
}

function cacheKey(normalizedKey: string): string {
  return `cache:${normalizedKey}`;
}

// Exact-text match (Architecture AD-7) -- widened 2026-08-02 to explicitly
// cover text that's genuinely identical but encoded differently, which is
// not "fuzzy" matching (AD-7 still excludes typo/spelling tolerance):
//   - .normalize("NFC") so a precomposed accented character (e.g. the "é" in
//     "Beyoncé") and the visually-identical combining-character sequence for
//     the same letter collapse onto the same key.
//   - internal whitespace collapsed to a single space, so "Kali  Uchis"
//     (double space) matches "Kali Uchis".
// Encoded as JSON.stringify of a 2-element array (not a raw string join with
// a "::" separator) so a delimiter appearing inside a normalized artist or
// song value can never shift the key boundary and collide two genuinely
// different pairs onto the same key -- e.g. artist "Foo::Bar" + song "Baz"
// must not collide with artist "Foo" + song "Bar::Baz".
function normalizeText(value: string): string {
  return value.trim().toLowerCase().normalize("NFC").replace(/\s+/g, " ");
}

function normalizeCacheKey(artist: string, song: string): string {
  return JSON.stringify([normalizeText(artist), normalizeText(song)]);
}

export async function saveGeneration(response: VocalChainResponse, store?: KeyValueStore): Promise<void> {
  const s = store ?? getDefaultStore();
  const key = normalizeCacheKey(response.input.artist, response.input.song);
  // Both keys get the same retention window, set in the same call -- they expire within
  // moments of each other. getCachedGeneration already treats a cache-key hit whose
  // generation has separately expired as a miss, so the sub-second gap this could
  // theoretically leave has no observable effect.
  //
  // allSettled, not all, and this never rethrows: by the time this runs, the AI call
  // has already succeeded and its response is what the caller is about to hand back to
  // the user. A store outage should cost a future cache-miss or a 404-by-id, not throw
  // away a result that already cost real time and an AI-provider bill to produce.
  const results = await Promise.allSettled([
    s.set(generationKey(response.id), response, { ex: RETENTION_SECONDS }),
    s.set(cacheKey(key), response.id, { ex: RETENTION_SECONDS }),
  ]);
  const labels = ["generation entry", "cache entry"] as const;
  for (const [i, result] of results.entries()) {
    if (result.status === "rejected") {
      // error.message only, same convention as getSongBpmClient.ts -- verified against
      // @upstash/redis's source that its errors echo the command body, never the auth
      // token (sent as a header, never included in the client's thrown errors).
      const reason = result.reason instanceof Error ? result.reason.message : "unknown error";
      console.error(`[generationStore] Failed to persist ${labels[i]} for generation ${response.id}: ${reason}.`);
    }
  }
}

export async function getGenerationById(id: string, store?: KeyValueStore): Promise<VocalChainResponse | undefined> {
  const s = store ?? getDefaultStore();
  try {
    const value = await s.get<VocalChainResponse>(generationKey(id));
    return value ?? undefined;
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown error";
    console.error(`[generationStore] Failed to read generation ${id}: ${reason}.`);
    return undefined;
  }
}

// A hit also requires the stored entry to have been generated under today's
// PIPELINE_VERSION/PROMPT_VERSION/schema version (Architecture AD-8, widened
// 2026-08-02 to include schemaVersion as its own explicit check rather than
// relying on the convention that a schema change always bumps
// PIPELINE_VERSION too) -- a version bump invalidates old entries for the
// same Artist+Song without needing to evict them. Never mutates the stored
// entry; the caller decides what a hit means for the response it returns.
export async function getCachedGeneration(
  artist: string,
  song: string,
  store?: KeyValueStore
): Promise<VocalChainResponse | undefined> {
  const s = store ?? getDefaultStore();
  let id: string | null;
  try {
    id = await s.get<string>(cacheKey(normalizeCacheKey(artist, song)));
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown error";
    console.error(`[generationStore] Failed to read cache entry for "${artist}" / "${song}": ${reason}.`);
    return undefined;
  }
  if (!id) return undefined;

  // getGenerationById already treats its own store error as "not found" -- no separate
  // try/catch needed here.
  const entry = await getGenerationById(id, s);
  if (!entry) return undefined;
  if (
    entry.meta.pipelineVersion !== PIPELINE_VERSION ||
    entry.meta.promptVersion !== PROMPT_VERSION ||
    entry.meta.schemaVersion !== CURRENT_SCHEMA_VERSION
  ) {
    return undefined;
  }
  return entry;
}
