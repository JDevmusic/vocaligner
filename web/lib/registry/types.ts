import { z } from "zod";
import { dawSchema, pluginTierSchema } from "../domain/registry";

export const controlTypeSchema = z.enum(["number", "string", "boolean"]);

export const controlDefinitionSchema = z.object({
  parameter: z.string(),
  type: controlTypeSchema,
  unit: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  default: z.union([z.number(), z.string(), z.boolean()]),
});

export const pluginCategorySchema = z.enum([
  "eq",
  "dynamics",
  "de-esser",
  "space",
  "pitch",
  "character",
  "other",
]);

export const pluginEducationSchema = z.object({
  whyUsed: z.string(),
  whatToListenFor: z.string(),
  commonMistakes: z.string(),
  adjustmentGuidance: z.string(),
});

export const pluginRegistryEntrySchema = z.object({
  id: z.string(),
  displayName: z.string(),
  vendor: z.string(),
  category: pluginCategorySchema,
  daw: dawSchema,
  tier: pluginTierSchema,
  controls: z.array(controlDefinitionSchema),
  education: pluginEducationSchema,
});

export type ControlType = z.infer<typeof controlTypeSchema>;
export type ControlDefinition = z.infer<typeof controlDefinitionSchema>;
export type PluginCategory = z.infer<typeof pluginCategorySchema>;
export type PluginEducation = z.infer<typeof pluginEducationSchema>;
export type PluginRegistryEntry = z.infer<typeof pluginRegistryEntrySchema>;
