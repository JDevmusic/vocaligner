import { randomUUID } from "crypto";
import { pluginRegistry } from "../registry/pluginRegistry";
import type { RegistryContext } from "../registry/pluginRegistry";
import { CURRENT_SCHEMA_VERSION, type VocalChainInput, type VocalChainResponse } from "../schema/vocalChain";
import { validateAndRepairChain } from "../validation/repairChain";
import type { ModelClient } from "./modelClient";
import { PROMPT_VERSION } from "./prompts/version";
import { runGenerationStage } from "./stages/generationStage";
import { runReasoningStage } from "./stages/reasoningStage";
import { runResearchStage } from "./stages/researchStage";

export class VocalChainGenerationError extends Error {
  constructor(public readonly issues: string[]) {
    super("Failed to generate a valid vocal chain after retrying.");
    this.name = "VocalChainGenerationError";
  }
}

const REGISTRY_CONTEXT: RegistryContext = { daw: "logic-pro", tier: "stock" };
const MAX_GENERATION_ATTEMPTS = 2;

export async function generateVocalChain(
  modelClient: ModelClient,
  input: VocalChainInput
): Promise<VocalChainResponse> {
  const research = await runResearchStage(modelClient, input);
  const reasoning = await runReasoningStage(modelClient, { ...input, research });
  const availablePlugins = pluginRegistry.getAvailable(REGISTRY_CONTEXT);

  let chain;
  let validation;
  let attempts = 0;

  do {
    const candidate = await runGenerationStage(modelClient, {
      ...input,
      processingIntents: reasoning.processingIntents,
      availablePlugins,
      context: REGISTRY_CONTEXT,
    });
    ({ chain, validation } = validateAndRepairChain(candidate, pluginRegistry));
    attempts += 1;
  } while (validation.status === "rejected" && attempts < MAX_GENERATION_ATTEMPTS);

  if (validation.status === "rejected") {
    throw new VocalChainGenerationError(validation.issues);
  }

  return {
    id: randomUUID(),
    input,
    meta: {
      generatedAt: new Date().toISOString(),
      model: modelClient.modelId,
      promptVersion: PROMPT_VERSION,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      cacheHit: false,
    },
    research,
    reasoning,
    chain,
    validation,
  };
}
