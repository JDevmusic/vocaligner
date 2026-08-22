const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API_BASE = "https://api.spotify.com/v1";
const TIMEOUT_MS = 5000;
const MAX_SUGGESTIONS = 8;
// Refresh this many seconds before Spotify's own expiry, so a request already in flight
// near the boundary never gets handed a token that expires mid-request.
const EARLY_REFRESH_SECONDS = 60;

export interface SpotifyCredentials {
  clientId?: string;
  clientSecret?: string;
}

interface CachedToken {
  accessToken: string;
  expiresAt: number; // epoch ms
}

let cachedToken: CachedToken | null = null;

// Test-only escape hatch for the module-level token cache -- exported specifically
// because a prior review (Story 2.1's "No test-only reset utility for the module-level
// store") flagged the lack of one on a similar module-level cache (generationStore.ts) as
// worth having once a test suite starts relying on cache behavior across multiple tests.
export function __resetSpotifyTokenCacheForTests(): void {
  cachedToken = null;
}

// Client Credentials flow -- server-to-server, no end-user Spotify login involved (see
// SPOTIFY_CLIENT_ID/SECRET in .env.example). Tokens last ~1 hour per Spotify's own
// `expires_in`; cached in memory so a burst of autocomplete requests doesn't re-authenticate
// on every keystroke. Best-effort only, same philosophy as getSongBpmClient.ts: every
// failure mode -- no credentials configured, network error, malformed response -- returns
// null, leaving the input exactly as usable as it was with no suggestions.
async function getAccessToken(credentials: SpotifyCredentials = {}): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.accessToken;
  }

  const clientId = credentials.clientId ?? process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = credentials.clientSecret ?? process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId?.trim() || !clientSecret?.trim()) return null;

  try {
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      console.warn(`Spotify token request failed with HTTP ${response.status}.`);
      return null;
    }

    const data = (await response.json()) as { access_token?: unknown; expires_in?: unknown };
    if (typeof data.access_token !== "string" || typeof data.expires_in !== "number") {
      console.warn("Spotify token request returned an unexpected response shape.");
      return null;
    }

    cachedToken = {
      accessToken: data.access_token,
      expiresAt: Date.now() + (data.expires_in - EARLY_REFRESH_SECONDS) * 1000,
    };
    return cachedToken.accessToken;
  } catch (error) {
    // Only ever logs error.message -- never the credentials or the constructed request,
    // same "never let a transport error echo a secret" discipline as getSongBpmClient.ts.
    console.warn(`Spotify token request failed: ${error instanceof Error ? error.message : "unknown error"}.`);
    return null;
  }
}

export interface ArtistSuggestion {
  id: string;
  name: string;
}

// Real-time fuzzy search across Spotify's artist catalog, ranked by Spotify's own
// relevance/popularity signal (confirmed live: "Tay" surfaces Taylor Swift first, "Bil"
// surfaces Billie Eilish first -- this is the reason Spotify was chosen over GetSongBPM,
// whose artist search had no such ranking).
export async function searchArtists(
  query: string,
  credentials: SpotifyCredentials = {}
): Promise<ArtistSuggestion[]> {
  const token = await getAccessToken(credentials);
  if (!token) return [];

  try {
    const url = new URL(`${API_BASE}/search`);
    url.searchParams.set("q", query);
    url.searchParams.set("type", "artist");
    url.searchParams.set("limit", String(MAX_SUGGESTIONS));

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      console.warn(`Spotify artist search failed with HTTP ${response.status}.`);
      return [];
    }

    const data = (await response.json()) as {
      artists?: { items?: unknown };
    };
    const items = Array.isArray(data.artists?.items) ? data.artists.items : [];
    return items
      .filter(
        (item): item is { id: string; name: string } =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as Record<string, unknown>).id === "string" &&
          typeof (item as Record<string, unknown>).name === "string"
      )
      .map((item) => ({ id: item.id, name: item.name }));
  } catch (error) {
    console.warn(`Spotify artist search failed: ${error instanceof Error ? error.message : "unknown error"}.`);
    return [];
  }
}

// Scopes track search to a specific artist by name, using Spotify's own `artist:`/`track:`
// query field filters. There's no reliable "list every song by this artist ID" endpoint
// available under Client Credentials auth (Spotify's artist top-tracks endpoint returns
// 403 under this flow, confirmed live) -- this is the closest equivalent: real-time fuzzy
// search pre-filtered to the chosen artist, which is what actually needs to happen anyway
// once someone's typing a specific song title.
export async function searchTracksByArtist(
  artist: string,
  query: string,
  credentials: SpotifyCredentials = {}
): Promise<string[]> {
  const token = await getAccessToken(credentials);
  if (!token) return [];

  try {
    const url = new URL(`${API_BASE}/search`);
    url.searchParams.set("q", `artist:${artist} track:${query}`);
    url.searchParams.set("type", "track");
    url.searchParams.set("limit", String(MAX_SUGGESTIONS));

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      console.warn(`Spotify track search failed with HTTP ${response.status}.`);
      return [];
    }

    const data = (await response.json()) as { tracks?: { items?: unknown } };
    const items = Array.isArray(data.tracks?.items) ? data.tracks.items : [];
    const titles = items
      .filter(
        (item): item is { name: string } =>
          typeof item === "object" && item !== null && typeof (item as Record<string, unknown>).name === "string"
      )
      .map((item) => item.name);

    // Spotify returns one entry per release a track appears on (a single, then its later
    // album re-release, a deluxe edition, ...) -- dedupe by title so the dropdown doesn't
    // show the same song name two or three times in a row.
    return Array.from(new Set(titles));
  } catch (error) {
    console.warn(`Spotify track search failed: ${error instanceof Error ? error.message : "unknown error"}.`);
    return [];
  }
}
