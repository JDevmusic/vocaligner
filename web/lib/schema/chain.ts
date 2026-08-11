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

// The real "a genuine chain, not a token gesture" quality floor -- mirrors
// MIN_PROCESSING_INTENTS in schema/reasoning.ts exactly, including why it can't just be
// a stricter wire-facing `.min()`: Anthropic's strict tool mode caps `minItems` at 1
// (generationStage.ts's model-facing schema carries that `.min(1)` floor and enforces
// this real one as an explicit post-call check instead). Added 2026-08-11 after a live
// Anthropic generation returned a "valid" one-plugin (just Compressor) chain -- the
// Reasoning stage got this exact floor in Story 3.2, but Generation never did, so a
// too-thin generation result had nothing stopping it from being accepted as-is.
export const MIN_PLUGINS = 3;

export const chainSchema = z.object({
  daw: dawSchema,
  registryContext: z.object({
    tier: pluginTierSchema,
  }),
  // A zero-plugin chain satisfies this shape but is never a valid recommendation.
  // See generationStage.ts, whose model-facing schema carries the matching `.min(1)`
  // floor and enforces the real MIN_PLUGINS floor above as an explicit check instead --
  // this documents the same invariant on the public domain type.
  plugins: z.array(pluginInstanceSchema).min(1),
});

export type ControlValue = z.infer<typeof controlValueSchema>;
export type PluginInstance = z.infer<typeof pluginInstanceSchema>;
export type Chain = z.infer<typeof chainSchema>;
