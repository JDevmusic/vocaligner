import { createAnthropicModelClient } from "./anthropicModelClient";
import { createMockModelClient } from "./mockModelClient";
import type { ModelClient } from "./modelClient";

// The mock/live switch point (Story 3.1). No options are passed to
// createAnthropicModelClient() -- it already reads ANTHROPIC_API_KEY/
// ANTHROPIC_MODEL from process.env itself as documented defaults.
export function getModelClient(): ModelClient {
  if (process.env.ANTHROPIC_API_KEY) {
    return createAnthropicModelClient();
  }
  return createMockModelClient();
}
