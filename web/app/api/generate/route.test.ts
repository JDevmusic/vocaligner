import { describe, expect, it } from "vitest";
import { vocalChainResponseSchema } from "@/lib/schema/vocalChain";
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
});
