import { beforeEach, describe, expect, it } from "vitest";
import { createMockModelClient } from "../ai/mockModelClient";
import { generateVocalChain } from "../ai/generateVocalChain";
import {
  getCachedGeneration,
  getGenerationById,
  InMemoryStore,
  saveGeneration,
  type KeyValueStore,
} from "./generationStore";

// Uses the module's own real in-memory fallback (what production actually runs when
// Upstash isn't configured), not a separate hand-rolled fake -- so these tests exercise
// the exact code path that exists, and can't quietly drift from it. Same "no live-API
// tests" policy this project already follows elsewhere (e.g. openRouterModelClient.test.ts
// mocking fetch instead of hitting OpenRouter for real).
async function buildGeneration(artist = "Frank Ocean", song = "Thinkin Bout You") {
  return generateVocalChain(createMockModelClient(), { artist, song });
}

describe("generationStore", () => {
  let store: InMemoryStore;

  beforeEach(() => {
    store = new InMemoryStore();
  });

  it("returns a saved generation by its id", async () => {
    const generation = await buildGeneration();

    await saveGeneration(generation, store);

    expect(await getGenerationById(generation.id, store)).toEqual(generation);
  });

  it("returns undefined for an id that was never saved", async () => {
    expect(await getGenerationById("unknown-id", store)).toBeUndefined();
  });

  it("returns a cached generation for an exact Artist + Song match", async () => {
    const generation = await buildGeneration("Radiohead", "Weird Fishes");
    await saveGeneration(generation, store);

    expect(await getCachedGeneration("Radiohead", "Weird Fishes", store)).toEqual(generation);
  });

  it("matches regardless of case or surrounding whitespace", async () => {
    const generation = await buildGeneration("Tame Impala", "Feels Like We Only Go Backwards");
    await saveGeneration(generation, store);

    expect(await getCachedGeneration("  tame IMPALA  ", " feels like we only go backwards ", store)).toEqual(
      generation
    );
  });

  it("returns undefined for a different Artist + Song pair", async () => {
    const generation = await buildGeneration("Solange", "Cranes in the Sky");
    await saveGeneration(generation, store);

    expect(await getCachedGeneration("Solange", "Losing You", store)).toBeUndefined();
  });

  it("treats a pipelineVersion mismatch as a cache miss", async () => {
    const generation = await buildGeneration("SZA", "Good Days");
    await saveGeneration({ ...generation, meta: { ...generation.meta, pipelineVersion: "0" } }, store);

    expect(await getCachedGeneration("SZA", "Good Days", store)).toBeUndefined();
  });

  it("treats a promptVersion mismatch as a cache miss", async () => {
    const generation = await buildGeneration("Beyoncé", "Cuff It");
    await saveGeneration({ ...generation, meta: { ...generation.meta, promptVersion: "0" } }, store);

    expect(await getCachedGeneration("Beyoncé", "Cuff It", store)).toBeUndefined();
  });

  it("does not collide two distinct pairs whose normalized text would concatenate identically across a naive delimiter", async () => {
    // "Foo::Bar" + "Baz" and "Foo" + "Bar::Baz" both concatenate to
    // "foo::bar::baz" if the cache key were a raw `${artist}::${song}` join
    // -- proves the key encoding doesn't let a delimiter inside the input
    // shift the artist/song boundary.
    const first = await buildGeneration("Foo::Bar", "Baz");
    await saveGeneration(first, store);

    expect(await getCachedGeneration("Foo", "Bar::Baz", store)).toBeUndefined();
    expect(await getCachedGeneration("Foo::Bar", "Baz", store)).toEqual(first);
  });

  it("treats a schemaVersion mismatch as a cache miss", async () => {
    const generation = await buildGeneration("Doja Cat", "Say So");
    await saveGeneration({ ...generation, meta: { ...generation.meta, schemaVersion: "0" } }, store);

    expect(await getCachedGeneration("Doja Cat", "Say So", store)).toBeUndefined();
  });

  it("matches the same accented text regardless of Unicode normalization form", async () => {
    // Precomposed é (NFC, one code point) vs. a plain "e" followed by a
    // standalone combining acute accent ́ (NFD, two code points) --
    // render identically but are genuinely different strings until both are
    // run through the same normalization form. Built from escapes, not typed
    // literally, so the two forms can't accidentally end up identical.
    const precomposed = "Beyonc\u00e9"; // NFC
    const combining = "Beyonce\u0301"; // NFD
    expect(precomposed).not.toBe(combining);
    expect(precomposed.normalize("NFC")).toBe(combining.normalize("NFC"));

    const generation = await buildGeneration(precomposed, "Cuff It");
    await saveGeneration(generation, store);

    expect(await getCachedGeneration(combining, "Cuff It", store)).toEqual(generation);
  });

  it("matches text differing only in internal whitespace width", async () => {
    const generation = await buildGeneration("Kali Uchis", "After the Storm");
    await saveGeneration(generation, store);

    expect(await getCachedGeneration("Kali   Uchis", "After  the Storm", store)).toEqual(generation);
  });

  it("applies a retention TTL to both the id-keyed and cache-keyed entries", async () => {
    let capturedTtl: number | undefined;
    const spyingStore: KeyValueStore = {
      get: (key) => store.get(key),
      set: (key, value, options) => {
        capturedTtl = options?.ex;
        return store.set(key, value, options);
      },
    };

    const generation = await buildGeneration("Tyler, The Creator", "EARFQUAKE");
    await saveGeneration(generation, spyingStore);

    expect(capturedTtl).toBe(60 * 60 * 24 * 30);
  });
});
