import { researchSchema, type Research } from "../../schema/research";
import type { ModelClient } from "../modelClient";
import { buildResearchPrompt } from "../prompts/researchPrompt";

export interface RunResearchStageInput {
  artist: string;
  song: string;
}

export async function runResearchStage(
  modelClient: ModelClient,
  input: RunResearchStageInput
): Promise<Research> {
  const { system, prompt } = buildResearchPrompt(input);
  return modelClient.generateStructured({ schema: researchSchema, system, prompt });
}
