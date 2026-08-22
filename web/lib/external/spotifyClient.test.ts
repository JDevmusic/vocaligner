import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetSpotifyTokenCacheForTests, searchArtists, searchTracksByArtist } from "./spotifyClient";

const CREDENTIALS = { clientId: "test-client-id", clientSecret: "test-client-secret" };

function tokenResponse(accessToken = "test-access-token", expiresIn = 3600) {
  return {
    ok: true,
    json: async () => ({ access_token: accessToken, expires_in: expiresIn }),
  } as Response;
}

function searchArtistsResponse(items: Array<{ id: string; name: string }>) {
  return { ok: true, json: async () => ({ artists: { items } }) } as Response;
}

function searchTracksResponse(items: Array<{ name: string }>) {
  return { ok: true, json: async () => ({ tracks: { items } }) } as Response;
}

describe("searchArtists / searchTracksByArtist", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
    __resetSpotifyTokenCacheForTests();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("returns [] without calling fetch when no credentials are configured", async () => {
    const result = await searchArtists("Kendrick", { clientId: undefined, clientSecret: undefined });
    expect(result).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns [] when only one of clientId/clientSecret is set", async () => {
    const result = await searchArtists("Kendrick", { clientId: "only-id", clientSecret: undefined });
    expect(result).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("fetches a token then searches artists, returning simplified {id, name} objects", async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(searchArtistsResponse([{ id: "jnyrl", name: "Kendrick Lamar" }]));

    const result = await searchArtists("Kendrick", CREDENTIALS);

    expect(result).toEqual([{ id: "jnyrl", name: "Kendrick Lamar" }]);
    expect(global.fetch).toHaveBeenCalledTimes(2);

    const [tokenUrl, tokenInit] = vi.mocked(global.fetch).mock.calls[0];
    expect(String(tokenUrl)).toBe("https://accounts.spotify.com/api/token");
    expect((tokenInit as RequestInit).method).toBe("POST");

    const [searchUrl, searchInit] = vi.mocked(global.fetch).mock.calls[1];
    expect(String(searchUrl)).toContain("type=artist");
    expect(String(searchUrl)).toContain("q=Kendrick");
    expect((searchInit as RequestInit).headers).toMatchObject({ Authorization: "Bearer test-access-token" });
  });

  it("reuses a cached token across two calls instead of re-authenticating", async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(searchArtistsResponse([]))
      .mockResolvedValueOnce(searchArtistsResponse([]));

    await searchArtists("A", CREDENTIALS);
    await searchArtists("B", CREDENTIALS);

    // 1 token request + 2 search requests, not 2 token requests + 2 search requests.
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it("coalesces concurrent calls onto one in-flight token request instead of firing two", async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(searchArtistsResponse([]))
      .mockResolvedValueOnce(searchArtistsResponse([]));

    // Both start before either has a cached token to work with.
    const [resultA, resultB] = await Promise.all([searchArtists("A", CREDENTIALS), searchArtists("B", CREDENTIALS)]);

    expect(resultA).toEqual([]);
    expect(resultB).toEqual([]);
    // 1 token request (shared), not 2 -- confirms the two concurrent calls didn't each fire
    // their own POST to Spotify's token endpoint.
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it("re-authenticates once the cached token has expired", async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce(tokenResponse("first-token", 60)) // expires almost immediately (60s - 60s early-refresh margin = 0)
      .mockResolvedValueOnce(searchArtistsResponse([]))
      .mockResolvedValueOnce(tokenResponse("second-token", 3600))
      .mockResolvedValueOnce(searchArtistsResponse([]));

    await searchArtists("A", CREDENTIALS);
    await searchArtists("B", CREDENTIALS);

    expect(global.fetch).toHaveBeenCalledTimes(4);
  });

  it("returns [] and does not throw when the token request fails", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false, status: 401 } as Response);
    expect(await searchArtists("Kendrick", CREDENTIALS)).toEqual([]);
  });

  it("returns [] when the token response has an unexpected shape", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({ ok: true, json: async () => ({ oops: true }) } as Response);
    expect(await searchArtists("Kendrick", CREDENTIALS)).toEqual([]);
  });

  it("returns [] on a network error fetching the token", async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new TypeError("fetch failed"));
    expect(await searchArtists("Kendrick", CREDENTIALS)).toEqual([]);
  });

  it("returns [] when the artist search itself fails after a successful token fetch", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(tokenResponse()).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);
    expect(await searchArtists("Kendrick", CREDENTIALS)).toEqual([]);
  });

  it("filters out malformed items instead of throwing", async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(searchArtistsResponse([{ id: "ok1", name: "Real Artist" }, { id: 123, name: "Bad Id" } as never]));

    expect(await searchArtists("A", CREDENTIALS)).toEqual([{ id: "ok1", name: "Real Artist" }]);
  });

  it("never logs the client secret or access token on failure", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.mocked(global.fetch).mockRejectedValueOnce(new TypeError("fetch failed"));

    await searchArtists("Kendrick", { clientId: "id", clientSecret: "super-secret-value" });

    expect(warnSpy).toHaveBeenCalled();
    for (const call of warnSpy.mock.calls) {
      expect(String(call[0])).not.toContain("super-secret-value");
    }
  });

  describe("searchTracksByArtist", () => {
    it("scopes the query to artist:/track: fields and dedupes repeated titles", async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce(tokenResponse())
        .mockResolvedValueOnce(
          searchTracksResponse([{ name: "Pretty Girl" }, { name: "Pretty Girl" }, { name: "Pretty Girl (Remix)" }])
        );

      const result = await searchTracksByArtist("Clairo", "Pre", CREDENTIALS);

      expect(result).toEqual(["Pretty Girl", "Pretty Girl (Remix)"]);
      const [searchUrl] = vi.mocked(global.fetch).mock.calls[1];
      const parsedUrl = new URL(String(searchUrl));
      expect(parsedUrl.searchParams.get("q")).toBe("artist:Clairo track:Pre");
      expect(parsedUrl.searchParams.get("type")).toBe("track");
    });

    it("returns [] without calling fetch when no credentials are configured", async () => {
      const result = await searchTracksByArtist("Clairo", "Pre", { clientId: undefined, clientSecret: undefined });
      expect(result).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("returns [] on a non-ok search response", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(tokenResponse()).mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);
      expect(await searchTracksByArtist("Clairo", "Pre", CREDENTIALS)).toEqual([]);
    });

    it("returns [] on a network error", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(tokenResponse()).mockRejectedValueOnce(new TypeError("fetch failed"));
      expect(await searchTracksByArtist("Clairo", "Pre", CREDENTIALS)).toEqual([]);
    });
  });
});
