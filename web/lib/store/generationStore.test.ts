import { describe, expect, it } from "vitest";
import { createMockModelClient } from "../ai/mockModelClient";
import { generateVocalChain } from "../ai/generateVocalChain";
import { getCachedGeneration, getGenerationById, saveGeneration } from "./generationStore";

async function buildGeneration(artist = "Frank Ocean", song = "Thinkin Bout You") {
  return generateVocalChain(createMockModelClient(), { artist, song });
}

describe("generationStore", () => {
  it("returns a saved generation by its id", async () => {
    const generation = await buildGeneration();

    saveGeneration(generation);

    expect(getGenerationById(generation.id)).toEqual(generation);
  });

  it("returns undefined for an id that was never saved", () => {
    expect(getGenerationById("unknown-id")).toBeUndefined();
  });

  it("returns a cached generation for an exact Artist + Song match", async () => {
    const generation = await buildGeneration("Radiohead", "Weird Fishes");
    saveGeneration(generation);

    expect(getCachedGeneration("Radiohead", "Weird Fishes")).toEqual(generation);
  });

  it("matches regardless of case or surrounding whitespace", async () => {
    const generation = await buildGeneration("Tame Impala", "Feels Like We Only Go Backwards");
    saveGeneration(generation);

    expect(getCachedGeneration("  tame IMPALA  ", " feels like we only go backwards ")).toEqual(generation);
  });

  it("returns undefined for a different Artist + Song pair", async () => {
    const generation = await buildGeneration("Solange", "Cranes in the Sky");
    saveGeneration(generation);

    expect(getCachedGeneration("Solange", "Losing You")).toBeUndefined();
  });

  it("treats a pipelineVersion mismatch as a cache miss", async () => {
    const generation = await buildGeneration("SZA", "Good Days");
    saveGeneration({ ...generation, meta: { ...generation.meta, pipelineVersion: "0" } });

    expect(getCachedGeneration("SZA", "Good Days")).toBeUndefined();
  });

  it("treats a promptVersion mismatch as a cache miss", async () => {
    const generation = await buildGeneration("Beyoncé", "Cuff It");
    saveGeneration({ ...generation, meta: { ...generation.meta, promptVersion: "0" } });

    expect(getCachedGeneration("Beyoncé", "Cuff It")).toBeUndefined();
  });

  it("does not collide two distinct pairs whose normalized text would concatenate identically across a naive delimiter", async () => {
    // "Foo::Bar" + "Baz" and "Foo" + "Bar::Baz" both concatenate to
    // "foo::bar::baz" if the cache key were a raw `${artist}::${song}` join
    // -- proves the key encoding doesn't let a delimiter inside the input
    // shift the artist/song boundary.
    const first = await buildGeneration("Foo::Bar", "Baz");
    saveGeneration(first);

    expect(getCachedGeneration("Foo", "Bar::Baz")).toBeUndefined();
    expect(getCachedGeneration("Foo::Bar", "Baz")).toEqual(first);
  });

  it("treats a schemaVersion mismatch as a cache miss", async () => {
    const generation = await buildGeneration("Doja Cat", "Say So");
    saveGeneration({ ...generation, meta: { ...generation.meta, schemaVersion: "0" } });

    expect(getCachedGeneration("Doja Cat", "Say So")).toBeUndefined();
  });

  it("matches the same accented text regardless of Unicode normalization form", async () => {
    // Precomposed \u00e9 (NFC, one code point) vs. a plain "e" followed by a
    // standalone combining acute accent \u0301 (NFD, two code points) --
    // render identically but are genuinely different strings until both are
    // run through the same normalization form. Built from escapes, not typed
    // literally, so the two forms can't accidentally end up identical.
    const precomposed = "Beyonc\u00e9"; // NFC
    const combining = "Beyonce\u0301"; // NFD
    expect(precomposed).not.toBe(combining);
    expect(precomposed.normalize("NFC")).toBe(combining.normalize("NFC"));

    const generation = await buildGeneration(precomposed, "Cuff It");
    saveGeneration(generation);

    expect(getCachedGeneration(combining, "Cuff It")).toEqual(generation);
  });

  it("matches text differing only in internal whitespace width", async () => {
    const generation = await buildGeneration("Kali Uchis", "After the Storm");
    saveGeneration(generation);

    expect(getCachedGeneration("Kali   Uchis", "After  the Storm")).toEqual(generation);
  });
});
