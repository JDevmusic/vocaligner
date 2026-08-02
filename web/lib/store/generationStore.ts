import { PIPELINE_VERSION } from "../ai/pipelineVersion";
import { PROMPT_VERSION } from "../ai/prompts/version";
import type { VocalChainResponse } from "../schema/vocalChain";

const generations = new Map<string, VocalChainResponse>();
const cachedByKey = new Map<string, VocalChainResponse>();

// Exact match only (Architecture AD-7) -- trim + lowercase, no fuzzy/typo
// matching in MVP. Encoded as JSON.stringify of a 2-element array (not a raw
// string join with a "::" separator) so a delimiter appearing inside a
// normalized artist or song value can never shift the key boundary and
// collide two genuinely different pairs onto the same key -- e.g. artist
// "Foo::Bar" + song "Baz" must not collide with artist "Foo" + song
// "Bar::Baz".
function normalizeCacheKey(artist: string, song: string): string {
  return JSON.stringify([artist.trim().toLowerCase(), song.trim().toLowerCase()]);
}

export function saveGeneration(response: VocalChainResponse): void {
  generations.set(response.id, response);
  cachedByKey.set(normalizeCacheKey(response.input.artist, response.input.song), response);
}

export function getGenerationById(id: string): VocalChainResponse | undefined {
  return generations.get(id);
}

// A hit also requires the stored entry to have been generated under today's
// PIPELINE_VERSION/PROMPT_VERSION (Architecture AD-8) -- a version bump
// invalidates old entries for the same Artist+Song without needing to evict
// them. Never mutates the stored entry; the caller decides what a hit means
// for the response it returns.
export function getCachedGeneration(artist: string, song: string): VocalChainResponse | undefined {
  const entry = cachedByKey.get(normalizeCacheKey(artist, song));
  if (!entry) return undefined;
  if (entry.meta.pipelineVersion !== PIPELINE_VERSION || entry.meta.promptVersion !== PROMPT_VERSION) {
    return undefined;
  }
  return entry;
}
