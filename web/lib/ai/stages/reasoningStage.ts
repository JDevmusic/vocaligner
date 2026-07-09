import { z } from "zod";
import type { Research } from "../../schema/research";
import { processingIntentSchema, reasoningSchema, type Reasoning } from "../../schema/reasoning";
import type { ModelClient } from "../modelClient";
import type { ObserveStage } from "../observability";
import { buildReasoningPrompt } from "../prompts/reasoningPrompt";

// The model reasons about category, observation, goal, and priority; stable ids are
// assigned deterministically afterwards so the Generation stage can reference them reliably.
const reasoningModelOutputSchema = z.object({
  processingIntents: z.array(processingIntentSchema.omit({ id: true })),
});

export interface RunReasoningStageInput {
  artist: string;
  song: string;
  research: Research;
}

export async function runReasoningStage(
  modelClient: ModelClient,
  input: RunReasoningStageInput,
  observe?: ObserveStage
): Promise<Reasoning> {
  const { system, prompt } = buildReasoningPrompt(input);
  const start = performance.now();
  const result = await modelClient.generateStructured({
    schema: reasoningModelOutputSchema,
    system,
    prompt,
  });
  observe?.({ durationMs: performance.now() - start, usage: result.usage, retryCount: result.retryCount });

  const processingIntents = result.data.processingIntents.map((intent, index) => ({
    ...intent,
    id: `${intent.category}-${index + 1}`,
  }));

  return reasoningSchema.parse({ processingIntents });
}
