import { createAnthropicModelClient } from "./anthropicModelClient";
import { createFailoverModelClient } from "./failoverModelClient";
import { createMockModelClient } from "./mockModelClient";
import { createOpenRouterModelClient } from "./openRouterModelClient";
import type { ModelClient } from "./modelClient";

// Same model id comparisonModels.ts uses for Luna, kept in sync manually (no shared
// import -- that file is for the internal /compare tool's multi-model list, this is the
// single production choice, and coupling them would make one accidentally affect the other).
const PRODUCTION_MODEL = "openai/gpt-5.6-luna";

// The provider switch point (originally Story 3.1's mock/Anthropic switch; extended
// 2026-08-12 to prefer Luna via OpenRouter once real A/B testing found it cheaper,
// faster, and comparably accurate -- see pm-handoff-2026-08-11.md). `.trim()` guards
// against a whitespace-only value (e.g. a stray copy-paste artifact in .env.local) being
// treated as "configured."
//
// When both keys are configured, wraps them in a failover client (Luna primary, Anthropic
// fallback) so a live Luna failure -- an outage, an exhausted rate limit -- doesn't fail
// generation outright just because a working Anthropic key was sitting unused. This is
// separate from (and doesn't replace) the plain "which key exists" fallback below it: with
// only one key configured, that's still all there is to fall back to.
export function getModelClient(): ModelClient {
  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();

  if (openRouterKey && anthropicKey) {
    return createFailoverModelClient({
      primary: createOpenRouterModelClient({ model: PRODUCTION_MODEL }),
      fallback: createAnthropicModelClient(),
    });
  }
  if (openRouterKey) {
    return createOpenRouterModelClient({ model: PRODUCTION_MODEL });
  }
  if (anthropicKey) {
    return createAnthropicModelClient();
  }
  return createMockModelClient();
}
