import { z } from "zod";

export const validationStatusSchema = z.enum(["valid", "repaired", "rejected"]);

export const validationResultSchema = z.object({
  status: validationStatusSchema,
  issues: z.array(z.string()),
});

export type ValidationStatus = z.infer<typeof validationStatusSchema>;
export type ValidationResult = z.infer<typeof validationResultSchema>;
