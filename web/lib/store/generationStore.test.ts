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
});
