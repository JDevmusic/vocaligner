import { PIPELINE_VERSION } from "../ai/pipelineVersion";
import { PROMPT_VERSION } from "../ai/prompts/version";
import { CURRENT_SCHEMA_VERSION, type VocalChainResponse } from "../schema/vocalChain";

const generations = new Map<string, VocalChainResponse>();
const cachedByKey = new Map<string, VocalChainResponse>();

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

export function saveGeneration(response: VocalChainResponse): void {
  generations.set(response.id, response);
  cachedByKey.set(normalizeCacheKey(response.input.artist, response.input.song), response);
}

export function getGenerationById(id: string): VocalChainResponse | undefined {
  return generations.get(id);
}

// A hit also requires the stored entry to have been generated under today's
// PIPELINE_VERSION/PROMPT_VERSION/schema version (Architecture AD-8, widened
// 2026-08-02 to include schemaVersion as its own explicit check rather than
// relying on the convention that a schema change always bumps
// PIPELINE_VERSION too) -- a version bump invalidates old entries for the
// same Artist+Song without needing to evict them. Never mutates the stored
// entry; the caller decides what a hit means for the response it returns.
export function getCachedGeneration(artist: string, song: string): VocalChainResponse | undefined {
  const entry = cachedByKey.get(normalizeCacheKey(artist, song));
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
