import { z } from "zod";
import { ModelResponseValidationError, ModelTransportError } from "./errors";
import type { GenerateStructuredInput, GenerateStructuredResult, ModelClient } from "./modelClient";

const TOOL_NAME = "structured_output";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MAX_TOKENS = 4096;
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_RETRY_BASE_DELAY_MS = 500;

export interface OpenRouterModelClientOptions {
  apiKey?: string;
  // Required, not defaulted -- unlike the Anthropic adapter, OpenRouter routes to many
  // different backing models (e.g. "deepseek/deepseek-v4-pro", "moonshotai/kimi-k3",
  // "minimax/minimax-m3"), so there's no single sensible default for a client whose whole
  // purpose is comparing across them.
  model: string;
  maxTokens?: number;
  timeoutMs?: number;
  maxRetries?: number;
  retryBaseDelayMs?: number;
}

// Thrown for any non-2xx HTTP response so retry logic can inspect the status code --
// OpenRouter (a REST API, no official SDK) has no typed exception hierarchy to lean on
// the way @anthropic-ai/sdk gives anthropicModelClient.ts.
class OpenRouterHttpError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "OpenRouterHttpError";
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof OpenRouterHttpError) {
    return error.status === 429 || error.status >= 500;
  }
  // Network-level failures: fetch's own connection errors (TypeError) and our own
  // AbortController timeout (DOMException named "AbortError").
  if (error instanceof Error) {
    return error.name === "AbortError" || error instanceof TypeError;
  }
  return false;
}

async function callWithSchema<T>(
  apiKey: string,
  model: string,
  maxTokens: number,
  timeoutMs: number,
  { schema, system, prompt, temperature }: GenerateStructuredInput<T>
): Promise<{ data: T; inputTokens: number; outputTokens: number }> {
  const inputSchema = z.toJSONSchema(schema);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: globalThis.Response;
  try {
    response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // Optional attribution headers OpenRouter documents; harmless to omit but nice
        // to include so usage shows up clearly attributed in the dashboard.
        "HTTP-Referer": "https://vocaligner.app",
        "X-Title": "VocAligner",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        ...(temperature !== undefined ? { temperature } : {}),
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: TOOL_NAME,
              description: "Return the structured result for this request.",
              parameters: inputSchema,
              strict: true,
            },
          },
        ],
        tool_choice: { type: "function", function: { name: TOOL_NAME } },
      }),
      signal: controller.signal,
    });
  } catch (error) {
    // Network failure or our own timeout abort -- re-throw as-is so isRetryableError
    // can recognize it (TypeError / AbortError) rather than wrapping it here.
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new OpenRouterHttpError(`OpenRouter request failed (${response.status}): ${body}`, response.status);
  }

  const json = await response.json();
  const toolCall = json?.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) {
    throw new ModelResponseValidationError("Model response did not include a tool call.");
  }

  let rawArgs: unknown;
  try {
    rawArgs = JSON.parse(toolCall.function.arguments);
  } catch {
    throw new ModelResponseValidationError("Model tool call arguments were not valid JSON.");
  }

  const parsed = schema.safeParse(rawArgs);
  if (!parsed.success) {
    throw new ModelResponseValidationError(`Model output failed schema validation: ${parsed.error.message}`);
  }

  return {
    data: parsed.data,
    inputTokens: json?.usage?.prompt_tokens ?? 0,
    outputTokens: json?.usage?.completion_tokens ?? 0,
  };
}

export function createOpenRouterModelClient(options: OpenRouterModelClientOptions): ModelClient {
  const apiKey = options.apiKey ?? process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is required to create an OpenRouterModelClient. Set it in your environment or pass apiKey explicitly."
    );
  }
  if (!options.model) {
    throw new Error(
      'A model id is required to create an OpenRouterModelClient (e.g. "deepseek/deepseek-v4-pro").'
    );
  }

  const model = options.model;
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  const retryBaseDelayMs = options.retryBaseDelayMs ?? DEFAULT_RETRY_BASE_DELAY_MS;

  return {
    modelId: model,
    async generateStructured<T>(input: GenerateStructuredInput<T>): Promise<GenerateStructuredResult<T>> {
      let attempt = 0;

      for (;;) {
        try {
          const { data, inputTokens, outputTokens } = await callWithSchema(
            apiKey,
            model,
            maxTokens,
            timeoutMs,
            input
          );
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
              `OpenRouter request failed after ${attempt} retr${attempt === 1 ? "y" : "ies"}: ${
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
