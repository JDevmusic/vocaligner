// Thrown when a model's response can't be reconciled with the requested schema
// (missing tool call, or a tool call whose input fails validation). Not retried
// at the transport layer — an identical malformed request is a model behaviour
// issue, not a transient availability issue, so retry policy for it belongs to
// the orchestrator (per stage), not the client adapter.
export class ModelResponseValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ModelResponseValidationError";
  }
}

// Thrown when the model call could not complete after exhausting transport
// retries (network errors, timeouts, rate limits, server errors).
export class ModelTransportError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "ModelTransportError";
  }
}
