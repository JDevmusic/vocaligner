import type { ZodType } from "zod";

export interface GenerateStructuredInput<T> {
  schema: ZodType<T>;
  system: string;
  prompt: string;
}

// Implementations must guarantee the resolved value already satisfies `schema` — callers do not re-validate.
export interface ModelClient {
  readonly modelId: string;
  generateStructured<T>(input: GenerateStructuredInput<T>): Promise<T>;
}
