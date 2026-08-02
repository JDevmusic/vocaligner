import { afterEach, describe, expect, it } from "vitest";
import { getModelClient } from "./getModelClient";

describe("getModelClient", () => {
  const originalKey = process.env.ANTHROPIC_API_KEY;

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.ANTHROPIC_API_KEY;
    } else {
      process.env.ANTHROPIC_API_KEY = originalKey;
    }
  });

  it("returns the mock client when ANTHROPIC_API_KEY is unset", () => {
    delete process.env.ANTHROPIC_API_KEY;

    expect(getModelClient().modelId).toBe("mock");
  });

  it("returns the real Anthropic client when ANTHROPIC_API_KEY is set", () => {
    // Constructing an Anthropic client is free and offline -- only an actual
    // generateStructured() call would attempt a real network request, which
    // this test never does.
    process.env.ANTHROPIC_API_KEY = "test-key-not-a-real-secret";

    expect(getModelClient().modelId).not.toBe("mock");
  });

  it("returns the mock client when ANTHROPIC_API_KEY is an empty string", () => {
    process.env.ANTHROPIC_API_KEY = "";

    expect(getModelClient().modelId).toBe("mock");
  });

  it("returns the mock client when ANTHROPIC_API_KEY is whitespace-only", () => {
    // Guards against a copy-paste artifact in .env.local (e.g. a stray space)
    // being treated as "configured" and attempting a doomed live request.
    process.env.ANTHROPIC_API_KEY = "   ";

    expect(getModelClient().modelId).toBe("mock");
  });
});
