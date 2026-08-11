import type { ZodType } from "zod";
import type { TokenUsage } from "./observability";

export interface GenerateStructuredInput<T> {
  schema: ZodType<T>;
  system: string;
  prompt: string;
  // Omitted (provider default, typically ~1.0) unless a stage explicitly needs tighter
  // run-to-run consistency -- see RESEARCH_REASONING_TEMPERATURE below.
  temperature?: number;
}

// Research and Reasoning are answering analytical/factual questions (what key is this
// song in, what does this vocal actually need) rather than writing creative prose --
// left at the provider default, the same song can come back with a materially different
// answer (e.g. a different root note/scale) from one run to the next. A low, non-zero
// temperature favours the model's most-likely answer consistently without making output
// fully deterministic. Generation is deliberately left unset: plugin/parameter choices
// have more legitimate room for varied-but-valid judgement calls.
export const RESEARCH_REASONING_TEMPERATURE = 0.2;

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
