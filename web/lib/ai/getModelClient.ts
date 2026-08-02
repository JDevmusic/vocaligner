import { createAnthropicModelClient } from "./anthropicModelClient";
import { createMockModelClient } from "./mockModelClient";
import type { ModelClient } from "./modelClient";

// The mock/live switch point (Story 3.1). No options are passed to
// createAnthropicModelClient() -- it already reads ANTHROPIC_API_KEY/
// ANTHROPIC_MODEL from process.env itself as documented defaults.
// `.trim()` guards against a whitespace-only value (e.g. a stray copy-paste
// artifact in .env.local) being treated as "configured" -- that should fall
// back to mock, same as an unset key, not attempt a doomed live request.
export function getModelClient(): ModelClient {
  if (process.env.ANTHROPIC_API_KEY?.trim()) {
    return createAnthropicModelClient();
  }
  return createMockModelClient();
}
