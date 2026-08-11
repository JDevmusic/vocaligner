import { describe, expect, it } from "vitest";
import { generateVocalChain, VocalChainGenerationError } from "./generateVocalChain";
import { ModelResponseValidationError } from "./errors";
import type { GenerateStructuredInput, GenerateStructuredResult, ModelClient } from "./modelClient";

// A real ModelClient implementation is required to validate its own output against
// the schema it's given (see modelClient.ts: "callers do not re-validate"). This fake
// upholds that same contract -- it runs each scripted raw response through the real
// schema.safeParse(), so the min-length floors on reasoningModelOutputSchema /
// generationModelOutputSchema are exercised for real, not re-implemented as a
// separate fake constraint.
function createScriptedModelClient(responses: unknown[]): ModelClient {
  let call = 0;
  return {
    modelId: "test-model",
    async generateStructured<T>(input: GenerateStructuredInput<T>): Promise<GenerateStructuredResult<T>> {
      const raw = responses[call];
      call += 1;
      const parsed = input.schema.safeParse(raw);
      if (!parsed.success) {
        throw new ModelResponseValidationError(`Model output failed schema validation: ${parsed.error.message}`);
      }
      return { data: parsed.data, usage: { inputTokens: 0, outputTokens: 0 }, retryCount: 0 };
    },
  };
}

const VALID_RESEARCH = {
  genre: { primary: "Pop", secondary: ["Electropop"] },
  vocalCharacteristics: { register: "mixed", descriptors: ["clear"], deliveryStyle: "smooth" },
  dynamicProfile: { range: "moderate", consistency: "steady", notablePeaks: "chorus" },
  tonalBalance: { lowEnd: "warm", midrange: "present", highEnd: "airy", sibilance: "low" },
  spatialCharacter: { perceivedSpace: "intimate", width: "centered", depthTechniques: ["reverb"] },
  commonEffects: [{ effectType: "reverb", description: "subtle plate reverb" }],
  productionNotes: ["Clean modern pop vocal chain."],
};

const THIN_REASONING = { processingIntents: [] };
// Passes the wire schema's `.min(1)` (Anthropic's strict tool mode rejects any
// minItems other than 0 or 1 -- see reasoningStage.ts) but is still below the real
// MIN_PROCESSING_INTENTS quality floor enforced as an explicit check afterwards.
const TOO_FEW_REASONING = {
  processingIntents: [
    { category: "dynamics", observation: "Only one thing was noticed.", goal: "Address it.", priority: "primary" },
  ],
};
const VALID_REASONING = {
  processingIntents: [
    { category: "dynamics", observation: "Dynamics vary between phrases.", goal: "Even out level.", priority: "primary" },
    { category: "tonal-balance", observation: "Slight low-end buildup.", goal: "Clean up the low end.", priority: "primary" },
    { category: "space", observation: "Vocal sits dry.", goal: "Add subtle space.", priority: "supporting" },
  ],
};

const THIN_GENERATION = { plugins: [] };
const COMPRESSOR_PLUGIN = {
  pluginId: "logic-pro.compressor",
  addressesIntentIds: ["dynamics-1"],
  rationale: "Even out dynamic swings between phrases.",
  controls: [
    { parameter: "threshold", value: -18, unit: "dB", confidence: "high" },
    { parameter: "ratio", value: 3, unit: null, confidence: "medium" },
  ],
};
const DEESSER_PLUGIN = {
  pluginId: "logic-pro.de-esser-2",
  addressesIntentIds: ["clarity-1"],
  rationale: "Tame harsh sibilance.",
  controls: [{ parameter: "frequency", value: 6000, unit: "Hz", confidence: "medium" }],
};
const CHROMAVERB_PLUGIN = {
  pluginId: "logic-pro.chromaverb",
  addressesIntentIds: ["space-1"],
  rationale: "Add a subtle sense of space.",
  controls: [{ parameter: "wet", value: 20, unit: "%", confidence: "medium" }],
};
// Passes the wire schema's `.min(1)` but is still below the real MIN_PLUGINS quality
// floor (schema/chain.ts) enforced as an explicit check in generationStage.ts.
const TOO_FEW_GENERATION = { plugins: [COMPRESSOR_PLUGIN, DEESSER_PLUGIN] };
const VALID_GENERATION = { plugins: [COMPRESSOR_PLUGIN, DEESSER_PLUGIN, CHROMAVERB_PLUGIN] };
// Mixes a real plugin id with an unknown one so this still exercises domain-level
// rejection (validateAndRepairChain) rather than being intercepted earlier by the
// MIN_PLUGINS count check -- it has 3 plugins, same as VALID_GENERATION.
const UNKNOWN_PLUGIN_GENERATION = {
  plugins: [
    COMPRESSOR_PLUGIN,
    DEESSER_PLUGIN,
    {
      pluginId: "logic-pro.does-not-exist",
      addressesIntentIds: ["dynamics-1"],
      rationale: "This references a plugin the registry doesn't have.",
      controls: [],
    },
  ],
};

describe("generateVocalChain -- retry on under-delivering model responses", () => {
  it("succeeds normally when every stage returns a valid result on the first attempt", async () => {
    const client = createScriptedModelClient([VALID_RESEARCH, VALID_REASONING, VALID_GENERATION]);
    const result = await generateVocalChain(client, { artist: "Test Artist", song: "Test Song" });
    expect(result.reasoning.processingIntents).toHaveLength(3);
    expect(result.chain.plugins).toHaveLength(3);
    expect(result.validation.status).toBe("valid");
  });

  it("retries the reasoning stage once after a too-thin (empty) result, then succeeds", async () => {
    const client = createScriptedModelClient([VALID_RESEARCH, THIN_REASONING, VALID_REASONING, VALID_GENERATION]);
    const result = await generateVocalChain(client, { artist: "Test Artist", song: "Test Song" });
    expect(result.reasoning.processingIntents).toHaveLength(3);
  });

  it("retries the reasoning stage when it returns too few intents to satisfy MIN_PROCESSING_INTENTS (but enough to pass the wire schema's min(1)), then succeeds", async () => {
    const client = createScriptedModelClient([VALID_RESEARCH, TOO_FEW_REASONING, VALID_REASONING, VALID_GENERATION]);
    const result = await generateVocalChain(client, { artist: "Test Artist", song: "Test Song" });
    expect(result.reasoning.processingIntents).toHaveLength(3);
  });

  it("throws VocalChainGenerationError when the reasoning stage stays too-thin across every retry", async () => {
    const client = createScriptedModelClient([VALID_RESEARCH, THIN_REASONING, THIN_REASONING]);
    await expect(
      generateVocalChain(client, { artist: "Test Artist", song: "Test Song" })
    ).rejects.toBeInstanceOf(VocalChainGenerationError);
  });

  it("retries the generation stage once after a too-thin (zero-plugin) result, then succeeds", async () => {
    const client = createScriptedModelClient([VALID_RESEARCH, VALID_REASONING, THIN_GENERATION, VALID_GENERATION]);
    const result = await generateVocalChain(client, { artist: "Test Artist", song: "Test Song" });
    expect(result.chain.plugins).toHaveLength(3);
    expect(result.validation.status).toBe("valid");
  });

  it("retries the generation stage when it returns too few plugins to satisfy MIN_PLUGINS (but enough to pass the wire schema's min(1)), then succeeds", async () => {
    const client = createScriptedModelClient([VALID_RESEARCH, VALID_REASONING, TOO_FEW_GENERATION, VALID_GENERATION]);
    const result = await generateVocalChain(client, { artist: "Test Artist", song: "Test Song" });
    expect(result.chain.plugins).toHaveLength(3);
    expect(result.validation.status).toBe("valid");
  });

  it("throws VocalChainGenerationError when the generation stage stays too-thin across every retry", async () => {
    const client = createScriptedModelClient([VALID_RESEARCH, VALID_REASONING, THIN_GENERATION, THIN_GENERATION]);
    await expect(
      generateVocalChain(client, { artist: "Test Artist", song: "Test Song" })
    ).rejects.toBeInstanceOf(VocalChainGenerationError);
  });

  it("still retries on a domain-level rejection from validateAndRepairChain (unknown plugin id), unchanged from before this fix", async () => {
    const client = createScriptedModelClient([
      VALID_RESEARCH,
      VALID_REASONING,
      UNKNOWN_PLUGIN_GENERATION,
      VALID_GENERATION,
    ]);
    const result = await generateVocalChain(client, { artist: "Test Artist", song: "Test Song" });
    expect(result.chain.plugins).toHaveLength(3);
    expect(result.validation.status).toBe("valid");
  });

  it("throws VocalChainGenerationError with the domain-rejection issues when every generation attempt is rejected", async () => {
    const client = createScriptedModelClient([
      VALID_RESEARCH,
      VALID_REASONING,
      UNKNOWN_PLUGIN_GENERATION,
      UNKNOWN_PLUGIN_GENERATION,
    ]);
    // Issues accumulate across every failed attempt (not just the last one), so with two
    // identically-rejected attempts the message appears twice -- asserting via
    // arrayContaining rather than a fixed-length array keeps this test honest about that
    // without over-specifying the exact count.
    await expect(
      generateVocalChain(client, { artist: "Test Artist", song: "Test Song" })
    ).rejects.toMatchObject({
      issues: expect.arrayContaining([expect.stringContaining("logic-pro.does-not-exist")]),
    });
  });

  it("accumulates issues from every failed generation attempt, not just the last one", async () => {
    const client = createScriptedModelClient([
      VALID_RESEARCH,
      VALID_REASONING,
      THIN_GENERATION,
      UNKNOWN_PLUGIN_GENERATION,
    ]);
    await expect(
      generateVocalChain(client, { artist: "Test Artist", song: "Test Song" })
    ).rejects.toMatchObject({
      issues: expect.arrayContaining([
        expect.stringContaining("Model output failed schema validation"),
        expect.stringContaining("logic-pro.does-not-exist"),
      ]),
    });
  });

  it("throws VocalChainGenerationError with the MIN_PLUGINS issue when generation stays too-few across every retry", async () => {
    const client = createScriptedModelClient([VALID_RESEARCH, VALID_REASONING, TOO_FEW_GENERATION, TOO_FEW_GENERATION]);
    await expect(
      generateVocalChain(client, { artist: "Test Artist", song: "Test Song" })
    ).rejects.toMatchObject({
      issues: expect.arrayContaining([expect.stringContaining("at least 3 are required")]),
    });
  });

  it("accumulates issues from every failed reasoning attempt, not just the last one", async () => {
    const client = createScriptedModelClient([VALID_RESEARCH, THIN_REASONING, TOO_FEW_REASONING]);
    await expect(
      generateVocalChain(client, { artist: "Test Artist", song: "Test Song" })
    ).rejects.toMatchObject({
      issues: expect.arrayContaining([
        expect.stringContaining("Model output failed schema validation"),
        expect.stringContaining("at least 3 are required"),
      ]),
    });
  });
});
