import type { ZodType } from "zod";
import type { TokenUsage } from "./observability";

export interface GenerateStructuredInput<T> {
  schema: ZodType<T>;
  system: string;
  prompt: string;
}

export interface GenerateStructuredResult<T> {
  data: T;
  usage: TokenUsage;
  retryCount: number;
}

// Implementations must guarantee `data` already satisfies `schema` — callers do not re-validate.
export interface ModelClient {
  readonly modelId: string;
  generateStructured<T>(input: GenerateStructuredInput<T>): Promise<GenerateStructuredResult<T>>;
}
