import { describe, expect, it } from "vitest";
import { vocalChainResponseSchema } from "@/lib/schema/vocalChain";
import { POST } from "../route";
import { GET } from "./route";

async function seedGeneration() {
  const response = await POST(
    new Request("http://localhost/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ artist: "Frank Ocean", song: "Thinkin Bout You" }),
    })
  );
  const body = await response.json();
  return vocalChainResponseSchema.parse(body);
}

function getGeneration(id: string) {
  return GET(new Request(`http://localhost/api/generate/${id}`), { params: Promise.resolve({ id }) });
}

describe("GET /api/generate/[id]", () => {
  it("returns the stored generation for a known id", async () => {
    const seeded = await seedGeneration();

    const response = await getGeneration(seeded.id);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(vocalChainResponseSchema.parse(body)).toEqual(seeded);
  });

  it("returns 404 with an error body for an unknown id", async () => {
    const response = await getGeneration("does-not-exist");
    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body).toEqual({ error: "Not found" });
  });
});
