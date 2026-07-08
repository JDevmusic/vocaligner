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

export const reasoningSchema = z.object({
  processingIntents: z.array(processingIntentSchema),
});

export type ProcessingIntent = z.infer<typeof processingIntentSchema>;
export type Reasoning = z.infer<typeof reasoningSchema>;
