import { generateVocalChain, VocalChainGenerationError } from "@/lib/ai/generateVocalChain";
import { getModelClient } from "@/lib/ai/getModelClient";
import { vocalChainInputSchema } from "@/lib/schema/vocalChain";
import { getCachedGeneration, saveGeneration } from "@/lib/store/generationStore";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsedInput = vocalChainInputSchema.safeParse(body);
  if (!parsedInput.success) {
    return Response.json(
      { error: "Invalid input.", issues: parsedInput.error.issues },
      { status: 400 }
    );
  }

  const cached = await getCachedGeneration(parsedInput.data.artist, parsedInput.data.song);
  if (cached) {
    // Deep-clone before flipping cacheHit -- `cached` may be the same object still held
    // by the store (InMemoryStore) or a freshly-deserialized one (real Redis), but either
    // way a shallow spread here would risk leaving nested fields (chain/research/
    // reasoning/validation) aliased between the response we return and the stored record.
    // structuredClone is safe: VocalChainResponse is plain JSON-shaped data
    // (strings/numbers/booleans/arrays/objects only). Its `id` may later be
    // fetched directly via GET /api/generate/[id], which must keep
    // reflecting the true, permanent fact that this specific record was
    // originally a fresh generation (Architecture AD-7/AD-8/AD-10).
    const hitResponse = structuredClone(cached);
    hitResponse.meta.cacheHit = true;
    return Response.json(hitResponse, { status: 200 });
  }

  try {
    const modelClient = getModelClient();
    const response = await generateVocalChain(modelClient, parsedInput.data);
    await saveGeneration(response);
    return Response.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof VocalChainGenerationError) {
      return Response.json(
        { error: "Failed to generate a valid vocal chain.", issues: error.issues },
        { status: 502 }
      );
    }
    throw error;
  }
}
