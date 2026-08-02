import { z } from "zod";
import { dawSchema, pluginTierSchema } from "../domain/registry";

export const confidenceSchema = z.enum(["low", "medium", "high"]);

export const controlValueSchema = z.object({
  parameter: z.string(),
  value: z.union([z.number(), z.string(), z.boolean()]),
  // Nullable, not optional: Anthropic's strict tool mode (anthropicModelClient.ts)
  // requires every property to appear in the JSON Schema's `required[]` list, so a
  // genuinely-absent unit (e.g. Compressor's "ratio", which has no unit string) must
  // be sent as an explicit `null`, never an omitted key.
  unit: z.string().nullable(),
  confidence: confidenceSchema,
  wasRepaired: z.boolean().default(false),
});

export const pluginInstanceSchema = z.object({
  order: z.number().int().positive(),
  pluginId: z.string(),
  addressesIntentIds: z.array(z.string()),
  rationale: z.string(),
  controls: z.array(controlValueSchema),
});

export const chainSchema = z.object({
  daw: dawSchema,
  registryContext: z.object({
    tier: pluginTierSchema,
  }),
  plugins: z.array(pluginInstanceSchema),
});

export type ControlValue = z.infer<typeof controlValueSchema>;
export type PluginInstance = z.infer<typeof pluginInstanceSchema>;
export type Chain = z.infer<typeof chainSchema>;
