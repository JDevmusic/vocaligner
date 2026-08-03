import { z } from "zod";

export const processingCategorySchema = z.enum([
  "tonal-balance",
  "dynamics",
  "space",
  "character",
  "pitch",
  "clarity",
  "other",
]);

export const processingPrioritySchema = z.enum(["primary", "supporting"]);

export const processingIntentSchema = z.object({
  id: z.string(),
  category: processingCategorySchema,
  observation: z.string(),
  goal: z.string(),
  priority: processingPrioritySchema,
});

// The real "at least a few distinct goals" quality floor. Shared between this domain
// schema and reasoningStage.ts's manual post-call check so the two numbers can't drift
// out of sync -- see reasoningStage.ts for why that check can't simply live here as a
// wire-facing `.min()` instead (Anthropic's strict tool mode caps `minItems` at 1).
export const MIN_PROCESSING_INTENTS = 3;

export const reasoningSchema = z.object({
  // A too-thin (or empty) result satisfies this shape but represents a real
  // model under-delivery, not a real analysis. See reasoningStage.ts, whose
  // model-facing schema carries a `.min(1)` floor (the max strict mode allows) and
  // enforces this real floor as an explicit check after the call instead.
  processingIntents: z.array(processingIntentSchema).min(MIN_PROCESSING_INTENTS),
});

export type ProcessingIntent = z.infer<typeof processingIntentSchema>;
export type Reasoning = z.infer<typeof reasoningSchema>;
