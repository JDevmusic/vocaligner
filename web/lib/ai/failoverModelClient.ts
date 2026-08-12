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
// `active` is unsynchronized mutable state, so this is only correct if generateStructured is
// called sequentially on a given instance -- which is what happens today: generateVocalChain.ts
// awaits each stage (research, then reasoning, then generation) in turn on one client per HTTP
// request, so two calls are never in flight at once here. If a future caller ever parallelizes
// stage calls on the same client, this stops being safe (concurrent calls could all hit the
// down primary before any of them observes the switch) -- deliberately not guarded against
// today, since the guard would be dead code against the only caller that exists.
//
// modelId (and therefore meta.model in generateVocalChain.ts, read once at the very end) always
// reports whichever provider is `active` right now. Because failover is sticky/monotonic --
// once flipped to fallback it never flips back -- this is guaranteed accurate for whichever
// provider produced the actual returned chain (the generation stage runs last, so by the time
// meta.model is read, `active` reflects that stage's provider). It can undercount which
// provider was involved overall: if failover happens mid-generation, earlier stages (research,
// maybe reasoning) may have run on the primary before the switch, and meta.model won't reflect
// that mixed history -- a known simplification, not tracked per-stage anywhere today.
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
        // Visible signal that this generation degraded to the fallback provider -- without
        // this, a sustained primary outage would silently serve every request off the fallback
        // indefinitely with nothing surfacing that fact to whoever operates the service. Logs
        // only the error's own message, which (see anthropicModelClient.ts/openRouterModelClient.ts)
        // never includes the API key -- just an HTTP status/reason or SDK-level description.
        console.warn(
          `Model provider failover: primary "${primary.modelId}" failed (${error.message}) -- switching to fallback "${fallback.modelId}" for the remainder of this generation.`
        );
        try {
          return await fallback.generateStructured(input);
        } catch (fallbackError) {
          // Both providers down: fold the primary's original failure into the thrown error so
          // it's clear this is a double failure, not just "the fallback failed" with no trace
          // that it was the second one. Only wrap when the fallback also fails at the transport
          // level -- a ModelResponseValidationError from the fallback is a different kind of
          // failure (bad response, not down) and should propagate as-is so generateVocalChain.ts's
          // per-stage retry (which re-calls this same, now-fallback-only, client) still handles it.
          if (fallbackError instanceof ModelTransportError) {
            throw new ModelTransportError(
              `Primary and fallback both failed. Primary: ${error.message} Fallback: ${fallbackError.message}`,
              { primaryError: error, fallbackError }
            );
          }
          throw fallbackError;
        }
      }
    },
  };
}
