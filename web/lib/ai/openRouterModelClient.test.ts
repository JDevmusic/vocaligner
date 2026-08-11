import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createOpenRouterModelClient } from "./openRouterModelClient";
import { ModelResponseValidationError, ModelTransportError } from "./errors";
import { z } from "zod";

const testSchema = z.object({ greeting: z.string() });

function jsonResponse(status: number, body: unknown, text = "") {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => text,
  } as Response;
}

function toolCallResponse(args: unknown) {
  return jsonResponse(200, {
    choices: [
      {
        message: {
          tool_calls: [{ function: { name: "structured_output", arguments: JSON.stringify(args) } }],
        },
      },
    ],
    usage: { prompt_tokens: 42, completion_tokens: 7 },
  });
}

function noToolCallResponse() {
  return jsonResponse(200, { choices: [{ message: { content: "no tool call here" } }] });
}

describe("createOpenRouterModelClient", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("parses a valid tool call response and reports usage with retryCount 0", async () => {
    vi.mocked(global.fetch).mockResolvedValue(toolCallResponse({ greeting: "hello" }));
    const client = createOpenRouterModelClient({ apiKey: "test-key", model: "deepseek/deepseek-v4-pro" });

    const result = await client.generateStructured({ schema: testSchema, system: "s", prompt: "p" });

    expect(result).toEqual({
      data: { greeting: "hello" },
      usage: { inputTokens: 42, outputTokens: 7 },
      retryCount: 0,
    });
    expect(client.modelId).toBe("deepseek/deepseek-v4-pro");
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [, requestInit] = vi.mocked(global.fetch).mock.calls[0];
    const body = JSON.parse(requestInit!.body as string);
    expect(body.tool_choice).toEqual({ type: "function", function: { name: "structured_output" } });
    expect(body.tools[0].function.strict).toBe(true);
  });

  it("throws ModelResponseValidationError when no tool call is present, without retrying", async () => {
    vi.mocked(global.fetch).mockResolvedValue(noToolCallResponse());
    const client = createOpenRouterModelClient({ apiKey: "test-key", model: "moonshotai/kimi-k3" });

    await expect(
      client.generateStructured({ schema: testSchema, system: "s", prompt: "p" })
    ).rejects.toBeInstanceOf(ModelResponseValidationError);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("throws ModelResponseValidationError when the tool call arguments fail schema validation, without retrying", async () => {
    vi.mocked(global.fetch).mockResolvedValue(toolCallResponse({ wrongField: 123 }));
    const client = createOpenRouterModelClient({ apiKey: "test-key", model: "minimax/minimax-m3" });

    await expect(
      client.generateStructured({ schema: testSchema, system: "s", prompt: "p" })
    ).rejects.toBeInstanceOf(ModelResponseValidationError);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("retries on a 429 and succeeds, reporting the retry count", async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce(jsonResponse(429, {}, "rate limited"))
      .mockResolvedValueOnce(toolCallResponse({ greeting: "hi" }));
    const client = createOpenRouterModelClient({
      apiKey: "test-key",
      model: "deepseek/deepseek-v4-pro",
      retryBaseDelayMs: 1,
    });

    const result = await client.generateStructured({ schema: testSchema, system: "s", prompt: "p" });

    expect(result.data).toEqual({ greeting: "hi" });
    expect(result.retryCount).toBe(1);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("retries on a network-level failure (TypeError) and succeeds", async () => {
    vi.mocked(global.fetch)
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(toolCallResponse({ greeting: "hi" }));
    const client = createOpenRouterModelClient({
      apiKey: "test-key",
      model: "deepseek/deepseek-v4-pro",
      retryBaseDelayMs: 1,
    });

    const result = await client.generateStructured({ schema: testSchema, system: "s", prompt: "p" });
    expect(result.data).toEqual({ greeting: "hi" });
    expect(result.retryCount).toBe(1);
  });

  it("throws ModelTransportError after exhausting retries on persistent 5xx failure", async () => {
    vi.mocked(global.fetch).mockResolvedValue(jsonResponse(503, {}, "server error"));
    const client = createOpenRouterModelClient({
      apiKey: "test-key",
      model: "deepseek/deepseek-v4-pro",
      maxRetries: 2,
      retryBaseDelayMs: 1,
    });

    await expect(
      client.generateStructured({ schema: testSchema, system: "s", prompt: "p" })
    ).rejects.toBeInstanceOf(ModelTransportError);
    expect(global.fetch).toHaveBeenCalledTimes(3); // initial attempt + 2 retries
  });

  it("does not retry a non-retryable 400 error", async () => {
    vi.mocked(global.fetch).mockResolvedValue(jsonResponse(400, {}, "bad request"));
    const client = createOpenRouterModelClient({
      apiKey: "test-key",
      model: "deepseek/deepseek-v4-pro",
      retryBaseDelayMs: 1,
    });

    await expect(
      client.generateStructured({ schema: testSchema, system: "s", prompt: "p" })
    ).rejects.toBeInstanceOf(ModelTransportError);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("throws a clear error when no API key is available", () => {
    const originalKey = process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_API_KEY;

    expect(() => createOpenRouterModelClient({ model: "deepseek/deepseek-v4-pro" })).toThrow(
      /OPENROUTER_API_KEY/
    );

    if (originalKey !== undefined) {
      process.env.OPENROUTER_API_KEY = originalKey;
    }
  });

  it("throws a clear error when no model id is provided", () => {
    expect(() => createOpenRouterModelClient({ apiKey: "test-key", model: "" })).toThrow(/model id/);
  });
});
