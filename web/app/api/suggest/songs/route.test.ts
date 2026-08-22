import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/rateLimit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/rateLimit")>();
  return { ...actual, checkSuggestRateLimit: vi.fn() };
});
vi.mock("@/lib/external/spotifyClient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/external/spotifyClient")>();
  return { ...actual, searchTracksByArtist: vi.fn() };
});

const { checkSuggestRateLimit } = await import("@/lib/rateLimit");
const { searchTracksByArtist } = await import("@/lib/external/spotifyClient");
const { GET } = await import("./route");

function getSongs(params: Record<string, string>, headers: Record<string, string> = {}) {
  const url = new URL("http://localhost/api/suggest/songs");
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return GET(new Request(url, { headers }));
}

describe("GET /api/suggest/songs", () => {
  afterEach(() => {
    vi.mocked(checkSuggestRateLimit).mockReset();
    vi.mocked(searchTracksByArtist).mockReset();
  });

  it("returns 429 with a Retry-After header and never calls searchTracksByArtist when rate limited", async () => {
    vi.mocked(checkSuggestRateLimit).mockResolvedValue({ allowed: false, retryAfterSeconds: 3 });

    const response = await getSongs({ artist: "Clairo", q: "Pre" }, { "x-forwarded-for": "203.0.113.7" });

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("3");
    expect(searchTracksByArtist).not.toHaveBeenCalled();
  });

  it("returns an empty suggestions array without searching when no artist is given", async () => {
    vi.mocked(checkSuggestRateLimit).mockResolvedValue({ allowed: true });

    const response = await getSongs({ q: "Pre" }, { "x-forwarded-for": "203.0.113.7" });
    const body = await response.json();

    expect(body).toEqual({ suggestions: [] });
    expect(searchTracksByArtist).not.toHaveBeenCalled();
  });

  it("returns an empty suggestions array without searching when the song query is empty", async () => {
    vi.mocked(checkSuggestRateLimit).mockResolvedValue({ allowed: true });

    const response = await getSongs({ artist: "Clairo", q: "" }, { "x-forwarded-for": "203.0.113.7" });
    const body = await response.json();

    expect(body).toEqual({ suggestions: [] });
    expect(searchTracksByArtist).not.toHaveBeenCalled();
  });

  it("allows a single-character song query (scoped search narrows meaningfully even at 1 char)", async () => {
    vi.mocked(checkSuggestRateLimit).mockResolvedValue({ allowed: true });
    vi.mocked(searchTracksByArtist).mockResolvedValue(["Pretty Girl"]);

    const response = await getSongs({ artist: "Clairo", q: "P" }, { "x-forwarded-for": "203.0.113.7" });
    const body = await response.json();

    expect(body).toEqual({ suggestions: ["Pretty Girl"] });
    expect(searchTracksByArtist).toHaveBeenCalledWith("Clairo", "P");
  });

  it("skips the rate-limit check when no x-forwarded-for header is present, and still proceeds", async () => {
    vi.mocked(searchTracksByArtist).mockResolvedValue([]);

    await getSongs({ artist: "Clairo", q: "Pre" });

    expect(checkSuggestRateLimit).not.toHaveBeenCalled();
    expect(searchTracksByArtist).toHaveBeenCalled();
  });

  it("trims whitespace from both artist and query", async () => {
    vi.mocked(checkSuggestRateLimit).mockResolvedValue({ allowed: true });
    vi.mocked(searchTracksByArtist).mockResolvedValue([]);

    await getSongs({ artist: "  Clairo  ", q: "  Pre  " }, { "x-forwarded-for": "203.0.113.7" });

    expect(searchTracksByArtist).toHaveBeenCalledWith("Clairo", "Pre");
  });
});
