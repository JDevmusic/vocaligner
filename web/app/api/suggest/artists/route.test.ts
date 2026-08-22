import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/rateLimit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/rateLimit")>();
  return { ...actual, checkSuggestRateLimit: vi.fn() };
});
vi.mock("@/lib/external/spotifyClient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/external/spotifyClient")>();
  return { ...actual, searchArtists: vi.fn() };
});

const { checkSuggestRateLimit } = await import("@/lib/rateLimit");
const { searchArtists } = await import("@/lib/external/spotifyClient");
const { GET } = await import("./route");

function getArtists(query: string | null, headers: Record<string, string> = {}) {
  const url = query === null ? "http://localhost/api/suggest/artists" : `http://localhost/api/suggest/artists?q=${encodeURIComponent(query)}`;
  return GET(new Request(url, { headers }));
}

describe("GET /api/suggest/artists", () => {
  afterEach(() => {
    vi.mocked(checkSuggestRateLimit).mockReset();
    vi.mocked(searchArtists).mockReset();
  });

  it("returns 429 with a Retry-After header and never calls searchArtists when rate limited", async () => {
    vi.mocked(checkSuggestRateLimit).mockResolvedValue({ allowed: false, retryAfterSeconds: 7 });

    const response = await getArtists("Kendrick", { "x-forwarded-for": "203.0.113.7" });

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("7");
    expect(searchArtists).not.toHaveBeenCalled();
    expect(checkSuggestRateLimit).toHaveBeenCalledWith("203.0.113.7");
  });

  it("skips the rate-limit check when no x-forwarded-for header is present, and still proceeds", async () => {
    vi.mocked(searchArtists).mockResolvedValue([{ id: "jnyrl", name: "Kendrick Lamar" }]);

    await getArtists("Kendrick");

    expect(checkSuggestRateLimit).not.toHaveBeenCalled();
    expect(searchArtists).toHaveBeenCalled();
  });

  it("returns an empty suggestions array without calling searchArtists when the query is missing", async () => {
    vi.mocked(checkSuggestRateLimit).mockResolvedValue({ allowed: true });

    const response = await getArtists(null, { "x-forwarded-for": "203.0.113.7" });
    const body = await response.json();

    expect(body).toEqual({ suggestions: [] });
    expect(searchArtists).not.toHaveBeenCalled();
  });

  it("returns an empty suggestions array without calling searchArtists when the query is below the minimum length", async () => {
    vi.mocked(checkSuggestRateLimit).mockResolvedValue({ allowed: true });

    const response = await getArtists("K", { "x-forwarded-for": "203.0.113.7" });
    const body = await response.json();

    expect(body).toEqual({ suggestions: [] });
    expect(searchArtists).not.toHaveBeenCalled();
  });

  it("returns just the artist names, not the full suggestion objects", async () => {
    vi.mocked(checkSuggestRateLimit).mockResolvedValue({ allowed: true });
    vi.mocked(searchArtists).mockResolvedValue([
      { id: "jnyrl", name: "Kendrick Lamar" },
      { id: "abc", name: "Kendrick" },
    ]);

    const response = await getArtists("Kendrick", { "x-forwarded-for": "203.0.113.7" });
    const body = await response.json();

    expect(body).toEqual({ suggestions: ["Kendrick Lamar", "Kendrick"] });
  });

  it("trims whitespace from the query before checking length and searching", async () => {
    vi.mocked(checkSuggestRateLimit).mockResolvedValue({ allowed: true });
    vi.mocked(searchArtists).mockResolvedValue([]);

    await getArtists("  Kendrick  ", { "x-forwarded-for": "203.0.113.7" });

    expect(searchArtists).toHaveBeenCalledWith("Kendrick");
  });
});
