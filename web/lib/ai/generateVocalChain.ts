import { randomUUID } from "crypto";
import { ModelResponseValidationError } from "./errors";
import { pluginRegistry } from "../registry/pluginRegistry";
import type { RegistryContext } from "../registry/pluginRegistry";
import { CURRENT_SCHEMA_VERSION, type VocalChainInput, type VocalChainResponse } from "../schema/vocalChain";
import type { Reasoning } from "../schema/reasoning";
import { validateAndRepairChain } from "../validation/repairChain";
import type { ModelClient } from "./modelClient";
import type { ObserveStage } from "./observability";
import { PIPELINE_VERSION } from "./pipelineVersion";
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

function issueFor(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const REGISTRY_CONTEXT: RegistryContext = { daw: "logic-pro", tier: "stock" };
const MAX_REASONING_ATTEMPTS = 2;
const MAX_GENERATION_ATTEMPTS = 2;

export async function generateVocalChain(
  modelClient: ModelClient,
  input: VocalChainInput,
  observe?: ObserveStage
): Promise<VocalChainResponse> {
  const research = await runResearchStage(modelClient, input, observe);

  // runReasoningStage throws ModelResponseValidationError for any schema-shape failure,
  // including (but not limited to) a too-thin result -- reasoningModelOutputSchema's own
  // `.min(1)` catches a fully empty response, and the stage's manual MIN_PROCESSING_INTENTS
  // check catches a schema-valid-but-still-too-thin one. Retried here up to
  // MAX_REASONING_ATTEMPTS before giving up, on the same "this is a model behaviour issue
  // the orchestrator should retry" basis documented on the error class itself. Issues from
  // every failed attempt are kept (not just the last one) so a final thrown error reflects
  // the full retry history.
  let reasoning: Reasoning | undefined;
  const reasoningIssues: string[] = [];
  let reasoningAttempts = 0;

  do {
    reasoningAttempts += 1;
    try {
      reasoning = await runReasoningStage(modelClient, { ...input, research }, observe);
    } catch (error) {
      if (!(error instanceof ModelResponseValidationError)) throw error;
      reasoningIssues.push(issueFor(error));
    }
  } while (!reasoning && reasoningAttempts < MAX_REASONING_ATTEMPTS);

  if (!reasoning) {
    throw new VocalChainGenerationError(reasoningIssues);
  }

  const availablePlugins = pluginRegistry.getAvailable(REGISTRY_CONTEXT);

  let chain;
  let validation;
  let generationAttempts = 0;
  const generationIssues: string[] = [];

  do {
    generationAttempts += 1;
    try {
      const candidate = await runGenerationStage(
        modelClient,
        {
          ...input,
          processingIntents: reasoning.processingIntents,
          availablePlugins,
          context: REGISTRY_CONTEXT,
        },
        observe
      );
      ({ chain, validation } = validateAndRepairChain(candidate, pluginRegistry));
    } catch (error) {
      // A too-thin generation result throws here one of two ways: a fully empty
      // response fails generationModelOutputSchema's `.min(1)` inside runGenerationStage,
      // and a schema-valid-but-still-too-thin one (e.g. a single plugin) fails
      // runGenerationStage's own MIN_PLUGINS check -- same two-layer pattern
      // reasoningStage.ts uses for MIN_PROCESSING_INTENTS. Both fold into the same
      // rejected/retry shape validateAndRepairChain already produces, so the one
      // attempts budget below covers "malformed," "too thin," and "domain-rejected" alike.
      if (!(error instanceof ModelResponseValidationError)) throw error;
      validation = { status: "rejected" as const, issues: [issueFor(error)] };
    }
    if (validation.status === "rejected") {
      generationIssues.push(...validation.issues);
    }
  } while (validation.status === "rejected" && generationAttempts < MAX_GENERATION_ATTEMPTS);

  if (validation.status === "rejected") {
    throw new VocalChainGenerationError(generationIssues);
  }
  // chain and validation are always assigned together by validateAndRepairChain, so
  // a non-rejected validation guarantees chain is set -- this check only narrows the
  // type for TypeScript, which can't see that link across the try/catch above.
  if (!chain) {
    throw new VocalChainGenerationError(["Internal error: no chain was produced."]);
  }

  return {
    id: randomUUID(),
    input,
    meta: {
      generatedAt: new Date().toISOString(),
      model: modelClient.modelId,
      pipelineVersion: PIPELINE_VERSION,
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
