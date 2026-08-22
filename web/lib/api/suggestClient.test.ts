import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchArtistSuggestions, fetchSongSuggestions } from "./suggestClient";

describe("fetchArtistSuggestions", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("returns the suggestions array on success", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ suggestions: ["Kendrick Lamar", "Kendrick"] }),
    } as Response);

    expect(await fetchArtistSuggestions("Kendrick")).toEqual(["Kendrick Lamar", "Kendrick"]);
    const [url] = vi.mocked(global.fetch).mock.calls[0];
    expect(String(url)).toBe("/api/suggest/artists?q=Kendrick");
  });

  it("URL-encodes the query", async () => {
    vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => ({ suggestions: [] }) } as Response);
    await fetchArtistSuggestions("Earth, Wind & Fire");
    const [url] = vi.mocked(global.fetch).mock.calls[0];
    expect(String(url)).toContain(encodeURIComponent("Earth, Wind & Fire"));
  });

  it("returns [] on a non-ok response instead of throwing", async () => {
    vi.mocked(global.fetch).mockResolvedValue({ ok: false } as Response);
    expect(await fetchArtistSuggestions("Kendrick")).toEqual([]);
  });

  it("returns [] on a network error instead of throwing", async () => {
    vi.mocked(global.fetch).mockRejectedValue(new TypeError("fetch failed"));
    expect(await fetchArtistSuggestions("Kendrick")).toEqual([]);
  });

  it("returns [] when the response has no suggestions field", async () => {
    vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
    expect(await fetchArtistSuggestions("Kendrick")).toEqual([]);
  });

  it("filters out non-string entries instead of throwing", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ suggestions: ["Real Name", 123, null] }),
    } as Response);
    expect(await fetchArtistSuggestions("Kendrick")).toEqual(["Real Name"]);
  });
});

describe("fetchSongSuggestions", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("returns the suggestions array on success, including both artist and query in the URL", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ suggestions: ["Pretty Girl"] }),
    } as Response);

    expect(await fetchSongSuggestions("Clairo", "Pre")).toEqual(["Pretty Girl"]);
    const [url] = vi.mocked(global.fetch).mock.calls[0];
    expect(String(url)).toContain("artist=Clairo");
    expect(String(url)).toContain("q=Pre");
  });

  it("returns [] on a non-ok response instead of throwing", async () => {
    vi.mocked(global.fetch).mockResolvedValue({ ok: false } as Response);
    expect(await fetchSongSuggestions("Clairo", "Pre")).toEqual([]);
  });

  it("returns [] on a network error instead of throwing", async () => {
    vi.mocked(global.fetch).mockRejectedValue(new TypeError("fetch failed"));
    expect(await fetchSongSuggestions("Clairo", "Pre")).toEqual([]);
  });
});
