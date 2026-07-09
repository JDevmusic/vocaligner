import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { describe, expect, it, vi } from "vitest";
import { createAnthropicModelClient } from "./anthropicModelClient";
import { ModelResponseValidationError, ModelTransportError } from "./errors";

const testSchema = z.object({ greeting: z.string() });

function toolUseResponse(input: unknown) {
  return {
    content: [{ type: "tool_use", id: "call_1", name: "structured_output", input }],
    usage: { input_tokens: 42, output_tokens: 7 },
  };
}

function textOnlyResponse() {
  return {
    content: [{ type: "text", text: "no tool call here" }],
    usage: { input_tokens: 10, output_tokens: 5 },
  };
}

describe("createAnthropicModelClient", () => {
  it("parses a valid tool_use response and reports usage with retryCount 0", async () => {
    const create = vi.fn().mockResolvedValue(toolUseResponse({ greeting: "hello" }));
    const client = createAnthropicModelClient({
      client: { messages: { create } } as unknown as Anthropic,
      model: "test-model",
    });

    const result = await client.generateStructured({
      schema: testSchema,
      system: "system prompt",
      prompt: "user prompt",
    });

    expect(result).toEqual({
      data: { greeting: "hello" },
      usage: { inputTokens: 42, outputTokens: 7 },
      retryCount: 0,
    });
    expect(create).toHaveBeenCalledTimes(1);
    const callArgs = create.mock.calls[0][0];
    expect(callArgs.tool_choice).toEqual({ type: "tool", name: "structured_output" });
    expect(callArgs.tools[0].input_schema.type).toBe("object");
  });

  it("throws ModelResponseValidationError when no tool_use block is present, without retrying", async () => {
    const create = vi.fn().mockResolvedValue(textOnlyResponse());
    const client = createAnthropicModelClient({
      client: { messages: { create } } as unknown as Anthropic,
    });

    await expect(
      client.generateStructured({ schema: testSchema, system: "s", prompt: "p" })
    ).rejects.toBeInstanceOf(ModelResponseValidationError);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("throws ModelResponseValidationError when the tool_use input fails schema validation, without retrying", async () => {
    const create = vi.fn().mockResolvedValue(toolUseResponse({ wrongField: 123 }));
    const client = createAnthropicModelClient({
      client: { messages: { create } } as unknown as Anthropic,
    });

    await expect(
      client.generateStructured({ schema: testSchema, system: "s", prompt: "p" })
    ).rejects.toBeInstanceOf(ModelResponseValidationError);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("retries on a retryable transport error and succeeds, reporting the retry count", async () => {
    const create = vi
      .fn()
      .mockRejectedValueOnce(
        new Anthropic.APIConnectionError({ message: "connection reset" })
      )
      .mockResolvedValueOnce(toolUseResponse({ greeting: "hi" }));

    const client = createAnthropicModelClient({
      client: { messages: { create } } as unknown as Anthropic,
      retryBaseDelayMs: 1,
    });

    const result = await client.generateStructured({ schema: testSchema, system: "s", prompt: "p" });

    expect(result.data).toEqual({ greeting: "hi" });
    expect(result.retryCount).toBe(1);
    expect(create).toHaveBeenCalledTimes(2);
  });

  it("throws ModelTransportError after exhausting retries on persistent transport failure", async () => {
    const create = vi
      .fn()
      .mockRejectedValue(new Anthropic.APIConnectionError({ message: "connection reset" }));

    const client = createAnthropicModelClient({
      client: { messages: { create } } as unknown as Anthropic,
      maxRetries: 2,
      retryBaseDelayMs: 1,
    });

    await expect(
      client.generateStructured({ schema: testSchema, system: "s", prompt: "p" })
    ).rejects.toBeInstanceOf(ModelTransportError);
    expect(create).toHaveBeenCalledTimes(3); // initial attempt + 2 retries
  });

  it("does not retry non-retryable API errors", async () => {
    const create = vi
      .fn()
      .mockRejectedValue(
        new Anthropic.BadRequestError(400, { type: "error", error: { type: "invalid_request_error", message: "bad" } }, "bad", new Headers())
      );

    const client = createAnthropicModelClient({
      client: { messages: { create } } as unknown as Anthropic,
      retryBaseDelayMs: 1,
    });

    await expect(
      client.generateStructured({ schema: testSchema, system: "s", prompt: "p" })
    ).rejects.toBeInstanceOf(ModelTransportError);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("throws a clear error when no API key is available and no client is injected", () => {
    const originalKey = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    expect(() => createAnthropicModelClient()).toThrow(/ANTHROPIC_API_KEY/);

    if (originalKey !== undefined) {
      process.env.ANTHROPIC_API_KEY = originalKey;
    }
  });
});
