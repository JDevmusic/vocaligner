import { generateVocalChain, VocalChainGenerationError } from "@/lib/ai/generateVocalChain";
import { getModelClient } from "@/lib/ai/getModelClient";
import { vocalChainInputSchema } from "@/lib/schema/vocalChain";

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

  try {
    const modelClient = getModelClient();
    const response = await generateVocalChain(modelClient, parsedInput.data);
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
