import { z } from "zod";
import type { Research } from "../../schema/research";
import {
  MIN_PROCESSING_INTENTS,
  processingIntentSchema,
  reasoningSchema,
  type Reasoning,
} from "../../schema/reasoning";
import { ModelResponseValidationError } from "../errors";
import { RESEARCH_REASONING_TEMPERATURE, type ModelClient } from "../modelClient";
import type { ObserveStage } from "../observability";
import { buildReasoningPrompt } from "../prompts/reasoningPrompt";

// The model reasons about category, observation, goal, and priority; stable ids are
// assigned deterministically afterwards so the Generation stage can reference them reliably.
// `.min(1)` only rules out a fully empty response -- Anthropic's strict tool mode rejects
// any `minItems` other than 0 or 1 outright (a live 400, confirmed empirically), so the
// real "at least a few distinct goals" quality floor (MIN_PROCESSING_INTENTS, imported
// from schema/reasoning.ts to stay in sync with that schema's own `.min()`) can't live
// in this wire-facing schema and is enforced as an explicit check after the call instead.
// `.required({ headline: true })`: `processingIntentSchema`'s `headline` is optional at
// the domain-schema level (backward compat for pre-existing cached records read by
// permanent id -- see reasoning.ts's comment on that field), but every *fresh* model call
// must still produce one, so the wire schema re-requires it here.
const reasoningModelOutputSchema = z.object({
  processingIntents: z.array(processingIntentSchema.omit({ id: true }).required({ headline: true })).min(1),
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
    temperature: RESEARCH_REASONING_TEMPERATURE,
  });
  observe?.({ durationMs: performance.now() - start, usage: result.usage, retryCount: result.retryCount });

  if (result.data.processingIntents.length < MIN_PROCESSING_INTENTS) {
    throw new ModelResponseValidationError(
      `Reasoning stage returned only ${result.data.processingIntents.length} processing intent(s); at least ${MIN_PROCESSING_INTENTS} are required.`
    );
  }

  const processingIntents = result.data.processingIntents.map((intent, index) => ({
    ...intent,
    id: `${intent.category}-${index + 1}`,
  }));

  return reasoningSchema.parse({ processingIntents });
}
