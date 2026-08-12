import { afterEach, describe, expect, it } from "vitest";
import { getModelClient } from "./getModelClient";

describe("getModelClient", () => {
  const originalAnthropicKey = process.env.ANTHROPIC_API_KEY;
  const originalOpenRouterKey = process.env.OPENROUTER_API_KEY;

  afterEach(() => {
    if (originalAnthropicKey === undefined) {
      delete process.env.ANTHROPIC_API_KEY;
    } else {
      process.env.ANTHROPIC_API_KEY = originalAnthropicKey;
    }
    if (originalOpenRouterKey === undefined) {
      delete process.env.OPENROUTER_API_KEY;
    } else {
      process.env.OPENROUTER_API_KEY = originalOpenRouterKey;
    }
  });

  it("returns the mock client when neither key is set", () => {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENROUTER_API_KEY;

    expect(getModelClient().modelId).toBe("mock");
  });

  it("returns the real Anthropic client when only ANTHROPIC_API_KEY is set", () => {
    // Constructing a client is free and offline -- only an actual generateStructured()
    // call would attempt a real network request, which this test never does.
    process.env.ANTHROPIC_API_KEY = "test-key-not-a-real-secret";
    delete process.env.OPENROUTER_API_KEY;

    expect(getModelClient().modelId).not.toBe("mock");
  });

  it("prefers the OpenRouter/Luna client over Anthropic when both keys are set", () => {
    process.env.ANTHROPIC_API_KEY = "test-key-not-a-real-secret";
    process.env.OPENROUTER_API_KEY = "test-key-not-a-real-secret";

    expect(getModelClient().modelId).toBe("openai/gpt-5.6-luna");
  });

  it("returns the OpenRouter/Luna client when only OPENROUTER_API_KEY is set", () => {
    delete process.env.ANTHROPIC_API_KEY;
    process.env.OPENROUTER_API_KEY = "test-key-not-a-real-secret";

    expect(getModelClient().modelId).toBe("openai/gpt-5.6-luna");
  });

  it("falls back to Anthropic when OPENROUTER_API_KEY is an empty/whitespace string", () => {
    process.env.ANTHROPIC_API_KEY = "test-key-not-a-real-secret";
    process.env.OPENROUTER_API_KEY = "   ";

    // Asserts the actual Anthropic default model id, not just "isn't mock and isn't
    // Luna" -- that weaker pair of negatives would still pass if this ever regressed
    // to return some other, wrong client.
    expect(getModelClient().modelId).toBe("claude-sonnet-5");
  });

  it("returns the mock client when ANTHROPIC_API_KEY is an empty string and OPENROUTER_API_KEY is unset", () => {
    process.env.ANTHROPIC_API_KEY = "";
    delete process.env.OPENROUTER_API_KEY;

    expect(getModelClient().modelId).toBe("mock");
  });

  it("returns the mock client when ANTHROPIC_API_KEY is whitespace-only and OPENROUTER_API_KEY is unset", () => {
    // Guards against a copy-paste artifact in .env.local (e.g. a stray space)
    // being treated as "configured" and attempting a doomed live request.
    process.env.ANTHROPIC_API_KEY = "   ";
    delete process.env.OPENROUTER_API_KEY;

    expect(getModelClient().modelId).toBe("mock");
  });
});
