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
    return entry.value as T;
  }

  async set(key: string, value: unknown, options?: { ex?: number }): Promise<"OK"> {
    const expiresAt = options?.ex ? Date.now() + options.ex * 1000 : null;
    this.data.set(key, { value, expiresAt });
    return "OK";
  }
}

let defaultStore: KeyValueStore | null = null;

function getDefaultStore(): KeyValueStore {
  if (!defaultStore) {
    const configured = process.env.UPSTASH_REDIS_REST_URL?.trim() && process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
    defaultStore = configured ? Redis.fromEnv() : new InMemoryStore();
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
  await Promise.all([
    s.set(generationKey(response.id), response, { ex: RETENTION_SECONDS }),
    s.set(cacheKey(key), response.id, { ex: RETENTION_SECONDS }),
  ]);
}

export async function getGenerationById(id: string, store?: KeyValueStore): Promise<VocalChainResponse | undefined> {
  const s = store ?? getDefaultStore();
  const value = await s.get<VocalChainResponse>(generationKey(id));
  return value ?? undefined;
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
  const id = await s.get<string>(cacheKey(normalizeCacheKey(artist, song)));
  if (!id) return undefined;

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
