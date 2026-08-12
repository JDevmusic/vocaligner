import { ModelTransportError } from "./errors";
import type { GenerateStructuredInput, GenerateStructuredResult, ModelClient } from "./modelClient";

export interface CreateFailoverModelClientOptions {
  primary: ModelClient;
  fallback: ModelClient;
}

// Wraps two ModelClients so a genuine transport-level failure on the primary (an outage,
// an exhausted rate limit, a persistent server error) retries against the fallback instead
// of failing the whole generation outright. Both provider clients already retry internally
// with backoff before ever throwing ModelTransportError, so this only fires once a provider
// is genuinely down, not on a single transient blip.
//
// Sticky within one generation: once the primary has failed, every later call goes straight
// to the fallback rather than re-trying (and re-exhausting) the primary again -- a full
// generation makes several sequential calls, and re-hitting a genuinely-down provider's own
// retry/backoff on each one would needlessly multiply latency. A fresh client is constructed
// per request (getModelClient.ts), so this never leaks "primary is down" across requests.
//
// Deliberately does NOT retry a ModelResponseValidationError -- that's the model producing a
// malformed/too-thin response, which generateVocalChain.ts's own per-stage retry logic
// already handles by re-calling the SAME client. Failing over to a different provider for
// that would conflate "this provider is down" with "this one response was bad."
export function createFailoverModelClient(options: CreateFailoverModelClientOptions): ModelClient {
  const { primary, fallback } = options;
  let active: ModelClient = primary;

  return {
    get modelId() {
      return active.modelId;
    },
    async generateStructured<T>(input: GenerateStructuredInput<T>): Promise<GenerateStructuredResult<T>> {
      if (active === fallback) {
        return fallback.generateStructured(input);
      }
      try {
        return await primary.generateStructured(input);
      } catch (error) {
        if (!(error instanceof ModelTransportError)) throw error;
        active = fallback;
        return fallback.generateStructured(input);
      }
    },
  };
}
