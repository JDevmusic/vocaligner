import { describe, expect, it } from "vitest";
import { vocalChainResponseSchema } from "@/lib/schema/vocalChain";
import { getGenerationById } from "@/lib/store/generationStore";
import { POST } from "./route";

function postGenerate(body: unknown) {
  return POST(
    new Request("http://localhost/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

describe("POST /api/generate", () => {
  it("returns a schema-valid vocal chain for a valid request, without hitting live AI", async () => {
    const response = await postGenerate({ artist: "Frank Ocean", song: "Thinkin Bout You" });
    expect(response.status).toBe(201);

    const body = await response.json();
    const parsed = vocalChainResponseSchema.parse(body);

    expect(parsed.input).toEqual({ artist: "Frank Ocean", song: "Thinkin Bout You" });
    expect(parsed.meta.model).toBe("mock");
    expect(parsed.meta.cacheHit).toBe(false);
    expect(parsed.chain.plugins.length).toBeGreaterThan(0);
    expect(["valid", "repaired"]).toContain(parsed.validation.status);

    for (const plugin of parsed.chain.plugins) {
      expect(plugin.pluginId).toMatch(/^logic-pro\./);
    }
  });

  it("persists a successful generation so it can be retrieved by id", async () => {
    // Deliberately a different Artist + Song than the test above -- this test
    // asserts on a fresh generation's persisted shape, and reusing the same
    // pair would make this a cache hit instead (the stored record keeps
    // cacheHit: false forever, but this response would say true, so they'd
    // stop being equal).
    const response = await postGenerate({ artist: "Steve Lacy", song: "Bad Habit" });
    const body = await response.json();
    const parsed = vocalChainResponseSchema.parse(body);

    expect(await getGenerationById(parsed.id)).toEqual(parsed);
  });

  it("rejects a request missing the song field", async () => {
    const response = await postGenerate({ artist: "Frank Ocean" });
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it("rejects an empty artist string", async () => {
    const response = await postGenerate({ artist: "", song: "Thinkin Bout You" });
    expect(response.status).toBe(400);
  });

  it("rejects a malformed JSON body", async () => {
    const response = await POST(
      new Request("http://localhost/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not json",
      })
    );
    expect(response.status).toBe(400);
  });

  it("serves the second identical request from cache, without a fresh generation", async () => {
    const first = await postGenerate({ artist: "Tyler, The Creator", song: "See You Again" });
    const firstBody = await first.json();
    const firstParsed = vocalChainResponseSchema.parse(firstBody);
    expect(firstParsed.meta.cacheHit).toBe(false);

    const second = await postGenerate({ artist: "Tyler, The Creator", song: "See You Again" });
    expect(second.status).toBe(200);
    const secondBody = await second.json();
    const secondParsed = vocalChainResponseSchema.parse(secondBody);

    // Same id and generatedAt as the first response proves this is the exact
    // stored record replayed, not a new generation (a fresh one would produce
    // a new randomUUID() and a new timestamp).
    expect(secondParsed.id).toBe(firstParsed.id);
    expect(secondParsed.meta.generatedAt).toBe(firstParsed.meta.generatedAt);
    expect(secondParsed.meta.cacheHit).toBe(true);
    expect(secondParsed.chain).toEqual(firstParsed.chain);
  });

  it("matches a repeat request regardless of case or surrounding whitespace", async () => {
    const first = await postGenerate({ artist: "Kali Uchis", song: "After the Storm" });
    const firstBody = await first.json();
    const firstParsed = vocalChainResponseSchema.parse(firstBody);

    const second = await postGenerate({ artist: "  KALI uchis  ", song: " after THE storm " });
    expect(second.status).toBe(200);
    const secondBody = await second.json();
    const secondParsed = vocalChainResponseSchema.parse(secondBody);

    expect(secondParsed.id).toBe(firstParsed.id);
    expect(secondParsed.meta.cacheHit).toBe(true);
  });
});
