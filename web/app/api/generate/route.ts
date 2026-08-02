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

  const cached = getCachedGeneration(parsedInput.data.artist, parsedInput.data.song);
  if (cached) {
    // Never mutate the stored entry -- its `id` may later be fetched directly
    // via GET /api/generate/[id], which must keep reflecting the true,
    // permanent fact that this specific record was originally a fresh
    // generation (Architecture AD-7/AD-8/AD-10).
    return Response.json({ ...cached, meta: { ...cached.meta, cacheHit: true } }, { status: 200 });
  }

  try {
    const modelClient = getModelClient();
    const response = await generateVocalChain(modelClient, parsedInput.data);
    saveGeneration(response);
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
