import { researchSchema, type Research } from "../../schema/research";
import { RESEARCH_REASONING_TEMPERATURE, type ModelClient } from "../modelClient";
import type { ObserveStage } from "../observability";
import { buildResearchPrompt } from "../prompts/researchPrompt";

export interface RunResearchStageInput {
  artist: string;
  song: string;
}

export async function runResearchStage(
  modelClient: ModelClient,
  input: RunResearchStageInput,
  observe?: ObserveStage
): Promise<Research> {
  const { system, prompt } = buildResearchPrompt(input);
  const start = performance.now();
  const result = await modelClient.generateStructured({
    schema: researchSchema,
    system,
    prompt,
    temperature: RESEARCH_REASONING_TEMPERATURE,
  });
  observe?.({ durationMs: performance.now() - start, usage: result.usage, retryCount: result.retryCount });
  return result.data;
}
