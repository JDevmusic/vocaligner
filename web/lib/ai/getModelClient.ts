import { createAnthropicModelClient } from "./anthropicModelClient";
import { createMockModelClient } from "./mockModelClient";
import { createOpenRouterModelClient } from "./openRouterModelClient";
import type { ModelClient } from "./modelClient";

// Same model id comparisonModels.ts uses for Luna, kept in sync manually (no shared
// import -- that file is for the internal /compare tool's multi-model list, this is the
// single production choice, and coupling them would make one accidentally affect the other).
const PRODUCTION_MODEL = "openai/gpt-5.6-luna";

// The provider switch point (originally Story 3.1's mock/Anthropic switch; extended
// 2026-08-12 to prefer Luna via OpenRouter once real A/B testing found it cheaper,
// faster, and comparably accurate -- see pm-handoff-2026-08-11.md). Falls through
// OpenRouter -> Anthropic -> mock, so removing a key reverts to the next option instead
// of breaking generation outright. `.trim()` guards against a whitespace-only value (e.g.
// a stray copy-paste artifact in .env.local) being treated as "configured."
export function getModelClient(): ModelClient {
  if (process.env.OPENROUTER_API_KEY?.trim()) {
    return createOpenRouterModelClient({ model: PRODUCTION_MODEL });
  }
  if (process.env.ANTHROPIC_API_KEY?.trim()) {
    return createAnthropicModelClient();
  }
  return createMockModelClient();
}
