import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { lookupSongKey, parseKeyOf } from "./getSongBpmClient";

describe("parseKeyOf", () => {
  it("parses a plain major key", () => {
    expect(parseKeyOf("C")).toEqual({ rootNote: "C", scale: "Major Scale" });
  });

  it("parses a sharp minor key", () => {
    expect(parseKeyOf("C#m")).toEqual({ rootNote: "C#", scale: "Natural Minor Scale (Aeolian)" });
  });

  it("parses a minor key from GetSongBPM's own example ('Em', Master of Puppets)", () => {
    expect(parseKeyOf("Em")).toEqual({ rootNote: "E", scale: "Natural Minor Scale (Aeolian)" });
  });

  it("normalizes a flat key to its sharp equivalent, matching Logic's own dropdown", () => {
    expect(parseKeyOf("Bb")).toEqual({ rootNote: "A#", scale: "Major Scale" });
  });

  it("normalizes a flat minor key", () => {
    expect(parseKeyOf("Ebm")).toEqual({ rootNote: "D#", scale: "Natural Minor Scale (Aeolian)" });
  });

  it("is case-insensitive on the letter and trims whitespace", () => {
    expect(parseKeyOf(" g ")).toEqual({ rootNote: "G", scale: "Major Scale" });
  });

  it("returns null for a malformed key string", () => {
    expect(parseKeyOf("not a key")).toBeNull();
    expect(parseKeyOf("H")).toBeNull();
    expect(parseKeyOf("")).toBeNull();
  });
});

describe("lookupSongKey", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("returns null without calling fetch when no API key is configured", async () => {
    const result = await lookupSongKey("Metallica", "Master of Puppets", { apiKey: undefined });
    expect(result).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns the parsed key on a successful lookup", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ search: [{ key_of: "Em" }] }),
    } as Response);

    const result = await lookupSongKey("Metallica", "Master of Puppets", { apiKey: "test-key" });

    expect(result).toEqual({ rootNote: "E", scale: "Natural Minor Scale (Aeolian)" });
    const [url] = vi.mocked(global.fetch).mock.calls[0];
    expect(String(url)).toContain("api_key=test-key");
    expect(String(url)).toContain(encodeURIComponent("song:Master of Puppets artist:Metallica"));
  });

  it("returns null when the response has no search results", async () => {
    vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => ({ search: [] }) } as Response);
    expect(await lookupSongKey("Unknown Artist", "Unknown Song", { apiKey: "test-key" })).toBeNull();
  });

  it("returns null on a non-ok HTTP response", async () => {
    vi.mocked(global.fetch).mockResolvedValue({ ok: false } as Response);
    expect(await lookupSongKey("A", "B", { apiKey: "test-key" })).toBeNull();
  });

  it("returns null instead of throwing on a network error", async () => {
    vi.mocked(global.fetch).mockRejectedValue(new TypeError("fetch failed"));
    expect(await lookupSongKey("A", "B", { apiKey: "test-key" })).toBeNull();
  });

  it("returns null when key_of is missing or not a string", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ search: [{ id: "abc" }] }),
    } as Response);
    expect(await lookupSongKey("A", "B", { apiKey: "test-key" })).toBeNull();
  });

  it("returns null when the top search result's artist clearly doesn't match the query (fuzzy-search mismatch)", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ search: [{ key_of: "Em", artist: { name: "A Completely Different Band" } }] }),
    } as Response);
    expect(await lookupSongKey("Metallica", "Master of Puppets", { apiKey: "test-key" })).toBeNull();
  });

  it("still trusts the key when the artist name matches loosely (missing 'The', case-insensitive)", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ search: [{ key_of: "Em", artist: { name: "strokes" } }] }),
    } as Response);
    const result = await lookupSongKey("The Strokes", "Last Night", { apiKey: "test-key" });
    expect(result).toEqual({ rootNote: "E", scale: "Natural Minor Scale (Aeolian)" });
  });

  it("still trusts the key when the response has no artist field to check (can't disprove it)", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ search: [{ key_of: "Em" }] }),
    } as Response);
    const result = await lookupSongKey("Metallica", "Master of Puppets", { apiKey: "test-key" });
    expect(result).toEqual({ rootNote: "E", scale: "Natural Minor Scale (Aeolian)" });
  });

  it("logs a warning (not the URL/API key) on a non-ok HTTP response", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.mocked(global.fetch).mockResolvedValue({ ok: false, status: 503 } as Response);

    await lookupSongKey("A", "B", { apiKey: "super-secret-key" });

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const [message] = warnSpy.mock.calls[0];
    expect(message).toContain("503");
    expect(message).not.toContain("super-secret-key");
  });

  it("logs a warning (not the URL/API key) on a network error", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.mocked(global.fetch).mockRejectedValue(new TypeError("fetch failed"));

    await lookupSongKey("A", "B", { apiKey: "super-secret-key" });

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const [message] = warnSpy.mock.calls[0];
    expect(message).toContain("fetch failed");
    expect(message).not.toContain("super-secret-key");
  });
});
