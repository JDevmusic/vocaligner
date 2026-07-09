import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { ModelResponseValidationError, ModelTransportError } from "./errors";
import type { GenerateStructuredInput, GenerateStructuredResult, ModelClient } from "./modelClient";

const TOOL_NAME = "structured_output";
const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";
const DEFAULT_MAX_TOKENS = 4096;
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_RETRY_BASE_DELAY_MS = 500;

export interface AnthropicModelClientOptions {
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  timeoutMs?: number;
  maxRetries?: number;
  retryBaseDelayMs?: number;
  // Escape hatch for tests — inject a fake client instead of hitting the network.
  client?: Pick<Anthropic, "messages">;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof Anthropic.APIConnectionError) {
    return true;
  }
  if (error instanceof Anthropic.RateLimitError) {
    return true;
  }
  if (error instanceof Anthropic.InternalServerError) {
    return true;
  }
  return false;
}

function buildClient(options: AnthropicModelClientOptions): Pick<Anthropic, "messages"> {
  if (options.client) {
    return options.client;
  }

  const apiKey = options.apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is required to create an AnthropicModelClient. Set it in your environment or pass apiKey explicitly."
    );
  }

  return new Anthropic({
    apiKey,
    timeout: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    // We hand-roll retries ourselves (see below) so retryCount is observable —
    // the SDK's own retry loop is opaque and wouldn't let us report how many
    // attempts a request actually took.
    maxRetries: 0,
  });
}

async function callWithSchema<T>(
  client: Pick<Anthropic, "messages">,
  model: string,
  maxTokens: number,
  { schema, system, prompt }: GenerateStructuredInput<T>
): Promise<{ data: T; inputTokens: number; outputTokens: number }> {
  const inputSchema = z.toJSONSchema(schema) as Anthropic.Messages.Tool.InputSchema;

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: prompt }],
    tools: [
      {
        name: TOOL_NAME,
        description: "Return the structured result for this request.",
        input_schema: inputSchema,
      },
    ],
    tool_choice: { type: "tool", name: TOOL_NAME },
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.Messages.ToolUseBlock => block.type === "tool_use"
  );
  if (!toolUse) {
    throw new ModelResponseValidationError("Model response did not include a tool_use block.");
  }

  const parsed = schema.safeParse(toolUse.input);
  if (!parsed.success) {
    throw new ModelResponseValidationError(`Model output failed schema validation: ${parsed.error.message}`);
  }

  return {
    data: parsed.data,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

export function createAnthropicModelClient(options: AnthropicModelClientOptions = {}): ModelClient {
  const client = buildClient(options);
  const model = options.model ?? process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  const retryBaseDelayMs = options.retryBaseDelayMs ?? DEFAULT_RETRY_BASE_DELAY_MS;

  return {
    modelId: model,
    async generateStructured<T>(input: GenerateStructuredInput<T>): Promise<GenerateStructuredResult<T>> {
      let attempt = 0;

      for (;;) {
        try {
          const { data, inputTokens, outputTokens } = await callWithSchema(client, model, maxTokens, input);
          return {
            data,
            usage: { inputTokens, outputTokens },
            retryCount: attempt,
          };
        } catch (error) {
          if (error instanceof ModelResponseValidationError) {
            throw error;
          }
          if (!isRetryableError(error) || attempt >= maxRetries) {
            throw new ModelTransportError(
              `Anthropic request failed after ${attempt} retr${attempt === 1 ? "y" : "ies"}: ${
                error instanceof Error ? error.message : String(error)
              }`,
              error
            );
          }
          attempt += 1;
          await delay(retryBaseDelayMs * 2 ** (attempt - 1));
        }
      }
    },
  };
}
