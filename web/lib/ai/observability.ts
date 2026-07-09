export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface StageObservation {
  durationMs: number;
  usage: TokenUsage;
  retryCount: number;
}

// Stage functions report through this instead of returning an observability
// wrapper, so their public return type stays the clean domain type (Research,
// Reasoning, Chain) and callers who don't care about observability pay nothing.
export type ObserveStage = (observation: StageObservation) => void;
