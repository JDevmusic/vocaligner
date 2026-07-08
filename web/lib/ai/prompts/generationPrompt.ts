import type { ProcessingIntent } from "../../schema/reasoning";
import type { PluginRegistryEntry } from "../../registry/types";

export interface GenerationPromptInput {
  artist: string;
  song: string;
  processingIntents: ProcessingIntent[];
  availablePlugins: PluginRegistryEntry[];
}

export function buildGenerationPrompt({
  artist,
  song,
  processingIntents,
  availablePlugins,
}: GenerationPromptInput) {
  const system = [
    "You are an expert mixing engineer building a plugin chain from a fixed catalogue of available tools.",
    "Select plugins only from the provided catalogue — never invent a plugin or a control that is not listed.",
    "For every control you set, choose a value strictly within its defined min/max range.",
    "Assign a confidence level (low, medium, high) to each control reflecting how certain you are about that specific value.",
    "For each plugin you include, reference the id(s) of the processing intent(s) it addresses.",
  ].join(" ");

  const prompt = [
    `Artist: ${artist}`,
    `Song: ${song}`,
    "",
    "Processing intents to satisfy:",
    JSON.stringify(processingIntents, null, 2),
    "",
    "Available plugin catalogue:",
    JSON.stringify(
      availablePlugins.map((plugin) => ({
        id: plugin.id,
        displayName: plugin.displayName,
        category: plugin.category,
        controls: plugin.controls,
      })),
      null,
      2
    ),
    "",
    "Build the plugin chain.",
  ].join("\n");

  return { system, prompt };
}
