import { z } from "zod";
import { chainSchema, controlValueSchema, pluginInstanceSchema, MIN_PLUGINS, type Chain } from "../../schema/chain";
import type { ProcessingIntent } from "../../schema/reasoning";
import { ModelResponseValidationError } from "../errors";
import type { RegistryContext } from "../../registry/pluginRegistry";
import type { PluginRegistryEntry } from "../../registry/types";
import type { ModelClient } from "../modelClient";
import type { ObserveStage } from "../observability";
import { buildGenerationPrompt } from "../prompts/generationPrompt";

// Order and repair-state are bookkeeping the app controls, not something the model
// should be asked to get right — only request the fields that require real judgement.
const generationControlSchema = controlValueSchema.omit({ wasRepaired: true });
const generationPluginSchema = pluginInstanceSchema
  .omit({ order: true })
  .extend({ controls: z.array(generationControlSchema) });
// `.min(1)` is a quality floor, not just a shape check: a zero-plugin response fails
// validation here and becomes retryable by the caller, rather than silently returning
// an empty "successful" chain.
const generationModelOutputSchema = z.object({
  plugins: z.array(generationPluginSchema).min(1),
});

export interface RunGenerationStageInput {
  artist: string;
  song: string;
  processingIntents: ProcessingIntent[];
  availablePlugins: PluginRegistryEntry[];
  context: RegistryContext;
}

export async function runGenerationStage(
  modelClient: ModelClient,
  input: RunGenerationStageInput,
  observe?: ObserveStage
): Promise<Chain> {
  const { system, prompt } = buildGenerationPrompt(input);
  const start = performance.now();
  const result = await modelClient.generateStructured({
    schema: generationModelOutputSchema,
    system,
    prompt,
  });
  observe?.({ durationMs: performance.now() - start, usage: result.usage, retryCount: result.retryCount });

  // Thrown here (not just left to `.min(1)`) so it reaches generateVocalChain.ts's
  // existing rejected/retry loop -- same pattern as reasoningStage.ts's
  // MIN_PROCESSING_INTENTS check, and closes the exact gap that check didn't cover:
  // a schema-valid, single-plugin (e.g. just Compressor) response previously sailed
  // through as a "successful" chain.
  if (result.data.plugins.length < MIN_PLUGINS) {
    throw new ModelResponseValidationError(
      `Generation stage returned only ${result.data.plugins.length} plugin(s); at least ${MIN_PLUGINS} are required.`
    );
  }

  const plugins = result.data.plugins.map((plugin, index) => ({
    ...plugin,
    order: index + 1,
    controls: plugin.controls.map((control) => ({ ...control, wasRepaired: false })),
  }));

  return chainSchema.parse({
    daw: input.context.daw,
    registryContext: { tier: input.context.tier },
    plugins,
  });
}
