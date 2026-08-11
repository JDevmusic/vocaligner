import { COMPARISON_MODELS } from "@/lib/ai/comparisonModels";
import { generateVocalChain } from "@/lib/ai/generateVocalChain";
import { vocalChainInputSchema } from "@/lib/schema/vocalChain";

// Internal comparison tool -- not part of the main product flow (no link from the
// landing page), used to evaluate model quality/cost side by side on the same real
// request. Deliberately widens Architecture AD-9 ("only app/api/generate/route.ts may
// import lib/ai/*") to also permit this route: it's a second server-side API route,
// not a page/client component, so the key-leakage/duplicated-logic risk AD-9 exists to
// prevent doesn't apply here -- see ARCHITECTURE-SPINE.md's AD-9 entry for the
// recorded widening.
export interface ComparisonResult {
  modelId: string;
  label: string;
  status: "ok" | "error";
  durationMs: number;
  usage?: { inputTokens: number; outputTokens: number };
  costUsd?: number;
  chainSummary?: {
    processingIntentCount: number;
    pluginCount: number;
    validationStatus: string;
  };
  response?: Awaited<ReturnType<typeof generateVocalChain>>;
  errorMessage?: string;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsedInput = vocalChainInputSchema.safeParse(body);
  if (!parsedInput.success) {
    return Response.json(
      { error: "Invalid input.", issues: parsedInput.error.issues },
      { status: 400 }
    );
  }

  // Optional `models` filter -- lets a caller run just a subset (e.g. two models to view
  // side by side) instead of paying for all COMPARISON_MODELS every time. Omitting it
  // preserves the original "run everything" behaviour the existing /compare page relies on.
  let modelsToRun = COMPARISON_MODELS;
  const requestedModels = (body as { models?: unknown })?.models;
  if (requestedModels !== undefined) {
    if (
      !Array.isArray(requestedModels) ||
      !requestedModels.every((id): id is string => typeof id === "string")
    ) {
      return Response.json({ error: "`models` must be an array of model id strings." }, { status: 400 });
    }
    const unknownIds = requestedModels.filter((id) => !COMPARISON_MODELS.some((m) => m.id === id));
    if (unknownIds.length > 0) {
      return Response.json({ error: `Unknown model id(s): ${unknownIds.join(", ")}` }, { status: 400 });
    }
    modelsToRun = COMPARISON_MODELS.filter((config) => requestedModels.includes(config.id));
  }

  const results = await Promise.all(
    modelsToRun.map(async (config): Promise<ComparisonResult> => {
      const start = performance.now();
      let inputTokens = 0;
      let outputTokens = 0;

      try {
        const client = config.createClient();
        const response = await generateVocalChain(client, parsedInput.data, (observation) => {
          inputTokens += observation.usage.inputTokens;
          outputTokens += observation.usage.outputTokens;
        });
        const costUsd = inputTokens * config.inputPricePerToken + outputTokens * config.outputPricePerToken;

        return {
          modelId: config.id,
          label: config.label,
          status: "ok",
          durationMs: performance.now() - start,
          usage: { inputTokens, outputTokens },
          costUsd,
          chainSummary: {
            processingIntentCount: response.reasoning.processingIntents.length,
            pluginCount: response.chain.plugins.length,
            validationStatus: response.validation.status,
          },
          response,
        };
      } catch (error) {
        return {
          modelId: config.id,
          label: config.label,
          status: "error",
          durationMs: performance.now() - start,
          errorMessage: error instanceof Error ? error.message : String(error),
        };
      }
    })
  );

  return Response.json({ input: parsedInput.data, results }, { status: 200 });
}
