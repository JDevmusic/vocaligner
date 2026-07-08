import { z } from "zod";
import { researchSchema } from "./research";
import { reasoningSchema } from "./reasoning";
import { chainSchema } from "./chain";
import { validationResultSchema } from "./validationResult";

export const CURRENT_SCHEMA_VERSION = "1";

export const vocalChainInputSchema = z.object({
  artist: z.string().min(1),
  song: z.string().min(1),
});

export const vocalChainMetaSchema = z.object({
  generatedAt: z.string(),
  model: z.string(),
  promptVersion: z.string(),
  schemaVersion: z.string(),
  cacheHit: z.boolean(),
});

export const vocalChainResponseSchema = z.object({
  id: z.string(),
  input: vocalChainInputSchema,
  meta: vocalChainMetaSchema,
  research: researchSchema,
  reasoning: reasoningSchema,
  chain: chainSchema,
  validation: validationResultSchema,
});

export type VocalChainInput = z.infer<typeof vocalChainInputSchema>;
export type VocalChainMeta = z.infer<typeof vocalChainMetaSchema>;
export type VocalChainResponse = z.infer<typeof vocalChainResponseSchema>;
