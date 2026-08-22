// Thin client-side fetch wrappers for the /api/suggest/* routes. Deliberately swallow
// every failure mode (network error, non-ok response, malformed JSON) and return an empty
// array instead -- autocomplete is a nice-to-have overlay on a plain text input, never a
// hard dependency, matching the same philosophy as the server-side spotifyClient.ts.

interface SuggestResponse {
  suggestions?: unknown;
}

function parseSuggestions(data: SuggestResponse): string[] {
  return Array.isArray(data.suggestions) ? data.suggestions.filter((item): item is string => typeof item === "string") : [];
}

export async function fetchArtistSuggestions(query: string): Promise<string[]> {
  try {
    const response = await fetch(`/api/suggest/artists?q=${encodeURIComponent(query)}`);
    if (!response.ok) return [];
    return parseSuggestions((await response.json()) as SuggestResponse);
  } catch {
    return [];
  }
}

export async function fetchSongSuggestions(artist: string, query: string): Promise<string[]> {
  try {
    const params = new URLSearchParams({ artist, q: query });
    const response = await fetch(`/api/suggest/songs?${params.toString()}`);
    if (!response.ok) return [];
    return parseSuggestions((await response.json()) as SuggestResponse);
  } catch {
    return [];
  }
}
