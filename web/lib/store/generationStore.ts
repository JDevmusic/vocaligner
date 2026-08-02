import { PIPELINE_VERSION } from "../ai/pipelineVersion";
import { PROMPT_VERSION } from "../ai/prompts/version";
import type { VocalChainResponse } from "../schema/vocalChain";

const generations = new Map<string, VocalChainResponse>();
const cachedByKey = new Map<string, VocalChainResponse>();

// Exact match only (Architecture AD-7) -- trim + lowercase, no fuzzy/typo
// matching in MVP. "::" can't appear in a real trimmed artist/song value in a
// way that would let two different pairs collide onto the same key.
function normalizeCacheKey(artist: string, song: string): string {
  return `${artist.trim().toLowerCase()}::${song.trim().toLowerCase()}`;
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
