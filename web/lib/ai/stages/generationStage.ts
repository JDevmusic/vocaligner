import { z } from "zod";
import { chainSchema, controlValueSchema, pluginInstanceSchema, type Chain } from "../../schema/chain";
import type { ProcessingIntent } from "../../schema/reasoning";
import type { RegistryContext } from "../../registry/pluginRegistry";
import type { PluginRegistryEntry } from "../../registry/types";
import type { ModelClient } from "../modelClient";
import { buildGenerationPrompt } from "../prompts/generationPrompt";

// Order and repair-state are bookkeeping the app controls, not something the model
// should be asked to get right — only request the fields that require real judgement.
const generationControlSchema = controlValueSchema.omit({ wasRepaired: true });
const generationPluginSchema = pluginInstanceSchema
  .omit({ order: true })
  .extend({ controls: z.array(generationControlSchema) });
const generationModelOutputSchema = z.object({
  plugins: z.array(generationPluginSchema),
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
  input: RunGenerationStageInput
): Promise<Chain> {
  const { system, prompt } = buildGenerationPrompt(input);
  const result = await modelClient.generateStructured({
    schema: generationModelOutputSchema,
    system,
    prompt,
  });

  const plugins = result.plugins.map((plugin, index) => ({
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
