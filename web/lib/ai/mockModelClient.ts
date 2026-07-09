import type { ZodType } from "zod";
import type { GenerateStructuredInput, GenerateStructuredResult, ModelClient } from "./modelClient";

// The three stage schemas have distinctive top-level keys, so dispatching on shape
// (rather than call order) keeps the mock correct even if stages are called out of sequence.
function hasKey(schema: ZodType<unknown>, key: string): boolean {
  const shape = (schema as unknown as { shape?: Record<string, unknown> }).shape;
  return Boolean(shape && key in shape);
}

function extractArtistSong(prompt: string): { artist: string; song: string } {
  const artistMatch = prompt.match(/Artist:\s*(.+)/);
  const songMatch = prompt.match(/Song:\s*(.+)/);
  return {
    artist: artistMatch?.[1]?.trim() ?? "Unknown Artist",
    song: songMatch?.[1]?.trim() ?? "Unknown Song",
  };
}

function buildMockResearch(prompt: string) {
  const { artist, song } = extractArtistSong(prompt);
  return {
    genre: { primary: "Pop", secondary: ["contemporary"] },
    vocalCharacteristics: {
      register: "mid",
      descriptors: ["clear", "controlled"],
      deliveryStyle: "Melodic phrasing with consistent breath control.",
    },
    dynamicProfile: {
      range: "moderate",
      consistency: "Dynamics stay fairly even between verse and chorus.",
      notablePeaks: "Chorus sits slightly louder than the verses.",
    },
    tonalBalance: {
      lowEnd: "Light, with minimal low-frequency content.",
      midrange: "Present and forward in the mix.",
      highEnd: "Bright without excessive harshness.",
      sibilance: "moderate",
    },
    spatialCharacter: {
      perceivedSpace: "intimate",
      width: "centered",
      depthTechniques: ["short reverb tail"],
    },
    commonEffects: [{ effectType: "reverb", description: "Subtle short reverb for depth." }],
    productionNotes: [`Mock research generated for "${song}" by ${artist} — no live AI call was made.`],
  };
}

function buildMockReasoning() {
  return {
    processingIntents: [
      {
        category: "dynamics",
        observation: "Vocal dynamics are moderate but benefit from tighter control.",
        goal: "Even out level between phrases without removing natural expression.",
        priority: "primary",
      },
      {
        category: "tonal-balance",
        observation: "Some low-frequency buildup and moderate sibilance.",
        goal: "Clean up the low end and control harsh 's' sounds.",
        priority: "primary",
      },
      {
        category: "space",
        observation: "Vocal currently sits very dry.",
        goal: "Add a subtle sense of space without pushing the vocal back in the mix.",
        priority: "supporting",
      },
    ],
  };
}

function buildMockGeneration() {
  return {
    plugins: [
      {
        pluginId: "logic-pro.channel-eq",
        addressesIntentIds: ["tonal-balance-2"],
        rationale: "Remove low-end buildup and add clarity in the presence range.",
        controls: [
          { parameter: "highPassFrequency", value: 90, unit: "Hz", confidence: "high" },
          { parameter: "presenceFrequency", value: 3200, unit: "Hz", confidence: "medium" },
          { parameter: "presenceGain", value: 2, unit: "dB", confidence: "medium" },
        ],
      },
      {
        pluginId: "logic-pro.compressor",
        addressesIntentIds: ["dynamics-1"],
        rationale: "Even out dynamic swings between phrases.",
        controls: [
          { parameter: "threshold", value: -18, unit: "dB", confidence: "high" },
          { parameter: "ratio", value: 3, confidence: "medium" },
          { parameter: "attack", value: 12, unit: "ms", confidence: "medium" },
          { parameter: "release", value: 140, unit: "ms", confidence: "low" },
        ],
      },
      {
        pluginId: "logic-pro.de-esser-2",
        addressesIntentIds: ["tonal-balance-2"],
        rationale: "Control moderate sibilance introduced by the presence boost.",
        controls: [
          { parameter: "frequency", value: 6200, unit: "Hz", confidence: "medium" },
          { parameter: "reduction", value: 5, unit: "dB", confidence: "medium" },
        ],
      },
      {
        pluginId: "logic-pro.chromaverb",
        addressesIntentIds: ["space-3"],
        rationale: "Add a short, subtle sense of space.",
        controls: [
          { parameter: "mix", value: 12, unit: "%", confidence: "medium" },
          { parameter: "decay", value: 1.2, unit: "s", confidence: "low" },
        ],
      },
    ],
  };
}

// Mock calls report zero token usage rather than a fabricated estimate — they
// genuinely cost nothing, and any usage aggregation should group by modelId so
// these zeros don't dilute real Anthropic cost figures once both exist side by side.
const ZERO_USAGE = { inputTokens: 0, outputTokens: 0 };

export function createMockModelClient(): ModelClient {
  return {
    modelId: "mock",
    async generateStructured<T>({
      schema,
      prompt,
    }: GenerateStructuredInput<T>): Promise<GenerateStructuredResult<T>> {
      let data: T;
      if (hasKey(schema, "genre")) {
        data = schema.parse(buildMockResearch(prompt));
      } else if (hasKey(schema, "processingIntents")) {
        data = schema.parse(buildMockReasoning());
      } else if (hasKey(schema, "plugins")) {
        data = schema.parse(buildMockGeneration());
      } else {
        throw new Error("MockModelClient received an unrecognised schema shape.");
      }

      return { data, usage: ZERO_USAGE, retryCount: 0 };
    },
  };
}
