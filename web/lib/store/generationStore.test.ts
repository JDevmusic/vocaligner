import { describe, expect, it } from "vitest";
import { createMockModelClient } from "../ai/mockModelClient";
import { generateVocalChain } from "../ai/generateVocalChain";
import { getGenerationById, saveGeneration } from "./generationStore";

async function buildGeneration() {
  return generateVocalChain(createMockModelClient(), {
    artist: "Frank Ocean",
    song: "Thinkin Bout You",
  });
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
});
