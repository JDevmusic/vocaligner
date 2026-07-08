import { z } from "zod";
import { dawSchema, pluginTierSchema } from "../domain/registry";

export const confidenceSchema = z.enum(["low", "medium", "high"]);

export const controlValueSchema = z.object({
  parameter: z.string(),
  value: z.union([z.number(), z.string(), z.boolean()]),
  unit: z.string().optional(),
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
