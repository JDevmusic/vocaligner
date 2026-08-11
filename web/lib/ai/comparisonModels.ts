import { createAnthropicModelClient } from "./anthropicModelClient";
import { createOpenRouterModelClient } from "./openRouterModelClient";
import type { ModelClient } from "./modelClient";

export interface ComparisonModelConfig {
  id: string;
  label: string;
  createClient: () => ModelClient;
  // USD per token (not per million) -- kept at the same granularity OpenRouter's own
  // /api/v1/models pricing fields use, so a value can be copied straight from there
  // without a conversion step. Sourced live from OpenRouter's pricing endpoint /
  // Anthropic's published pricing at the time this was written; real prices can change,
  // so treat costUsd as an estimate at time-of-comparison, not a permanent guarantee.
  inputPricePerToken: number;
  outputPricePerToken: number;
}

// A fixed, hand-picked list rather than an arbitrary client-supplied model string --
// this is an internal comparison tool, not a general-purpose model picker, so every
// option here is one we've deliberately chosen to evaluate.
export const COMPARISON_MODELS: ComparisonModelConfig[] = [
  {
    id: "anthropic-sonnet-5",
    label: "Claude Sonnet 5 (Anthropic)",
    createClient: () => createAnthropicModelClient(),
    inputPricePerToken: 2.0 / 1_000_000,
    outputPricePerToken: 10.0 / 1_000_000,
  },
  {
    id: "deepseek-v4-pro",
    label: "DeepSeek V4 Pro (via OpenRouter)",
    createClient: () => createOpenRouterModelClient({ model: "deepseek/deepseek-v4-pro" }),
    inputPricePerToken: 0.435 / 1_000_000,
    outputPricePerToken: 0.87 / 1_000_000,
  },
  {
    id: "kimi-k3",
    label: "Kimi K3 (Moonshot AI, via OpenRouter)",
    createClient: () => createOpenRouterModelClient({ model: "moonshotai/kimi-k3" }),
    inputPricePerToken: 3.0 / 1_000_000,
    outputPricePerToken: 15.0 / 1_000_000,
  },
  {
    id: "minimax-m3",
    label: "MiniMax M3 (via OpenRouter)",
    createClient: () => createOpenRouterModelClient({ model: "minimax/minimax-m3" }),
    inputPricePerToken: 0.3 / 1_000_000,
    outputPricePerToken: 1.2 / 1_000_000,
  },
  {
    id: "gpt-5.6-luna",
    label: "GPT-5.6 Luna (OpenAI, via OpenRouter)",
    createClient: () => createOpenRouterModelClient({ model: "openai/gpt-5.6-luna" }),
    inputPricePerToken: 0.1 / 1_000_000,
    outputPricePerToken: 0.6 / 1_000_000,
  },
  {
    id: "gpt-5.6-terra",
    label: "GPT-5.6 Terra (OpenAI, via OpenRouter)",
    createClient: () => createOpenRouterModelClient({ model: "openai/gpt-5.6-terra" }),
    inputPricePerToken: 1.0 / 1_000_000,
    outputPricePerToken: 6.0 / 1_000_000,
  },
];
