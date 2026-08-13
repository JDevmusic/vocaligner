import { describe, expect, it } from "vitest";
import { buildResearchSummary } from "./researchSummary";
import type { VocalChainResponse } from "../schema/vocalChain";

function fixture(overrides: Partial<VocalChainResponse> = {}): VocalChainResponse {
  return {
    id: "fake-id",
    input: { artist: "Adele", song: "Rolling in the Deep" },
    meta: {
      generatedAt: "2026-01-01T00:00:00.000Z",
      model: "fake",
      pipelineVersion: "0",
      promptVersion: "0",
      schemaVersion: "0",
      cacheHit: false,
    },
    research: {
      genre: { primary: "Soul-pop", secondary: ["Blues-inflected pop"] },
      vocalCharacteristics: {
        register: "mixed",
        descriptors: ["powerful", "full-bodied", "raspy at peaks", "emotionally forceful"],
        deliveryStyle: "Front-and-center lead vocal with intimate verses that build into belts.",
      },
      dynamicProfile: { range: "wide", consistency: "Highly dynamic.", notablePeaks: "Strong belted choruses." },
      tonalBalance: {
        lowEnd: "Warm chest resonance.",
        midrange: "Prominent and forward.",
        highEnd: "Open and present.",
        sibilance: "moderate",
      },
      spatialCharacter: { perceivedSpace: "roomy", width: "centered", depthTechniques: ["Short ambience"] },
      commonEffects: [{ effectType: "reverb", description: "Moderate ambience." }],
      productionNotes: ["Live-sounding performance."],
    },
    reasoning: {
      processingIntents: [
        {
          id: "dynamics-1",
          category: "dynamics",
          observation: "The vocal moves from restrained verses to forceful choruses.",
          goal: "Control the wide level range with transparent dynamics.",
          headline: "Wide dynamic range, kept transparent through choruses",
          priority: "primary",
        },
        {
          id: "tonal-balance-2",
          category: "tonal-balance",
          observation: "Warm chest resonance and a prominent forward midrange.",
          goal: "Preserve low-mid body and forward presence.",
          headline: "Warm chest tone, kept forward and present",
          priority: "primary",
        },
        {
          id: "clarity-3",
          category: "clarity",
          observation: "Clear diction with moderate sibilance.",
          goal: "Maintain intelligible consonants while controlling sibilance.",
          headline: "Clear diction, sibilance kept in check",
          priority: "primary",
        },
        {
          id: "space-4",
          category: "space",
          observation: "The lead is direct and centered with short ambience.",
          goal: "Add restrained depth while keeping the lead anchored.",
          headline: "Restrained depth, lead stays anchored",
          priority: "supporting",
        },
      ],
    },
    chain: { daw: "logic-pro", registryContext: { tier: "stock" }, plugins: [] },
    validation: { status: "valid", issues: [] },
    ...overrides,
  };
}

describe("buildResearchSummary", () => {
  it("names the artist and song directly in the lead paragraph, not a generic 'the vocals'", () => {
    const { leadParagraph } = buildResearchSummary(fixture());
    expect(leadParagraph).toContain("Adele");
    expect(leadParagraph).toContain("Rolling in the Deep");
  });

  it("includes the genre and up to 3 descriptors in the lead paragraph", () => {
    const { leadParagraph } = buildResearchSummary(fixture());
    expect(leadParagraph).toContain("Soul-pop");
    expect(leadParagraph).toContain("powerful");
    expect(leadParagraph).toContain("full-bodied");
    expect(leadParagraph).toContain("raspy at peaks");
    // 4th descriptor ("emotionally forceful") deliberately excluded -- capped at 3.
    expect(leadParagraph).not.toContain("emotionally forceful");
  });

  it("includes the full deliveryStyle sentence", () => {
    const { leadParagraph } = buildResearchSummary(fixture());
    expect(leadParagraph).toContain("Front-and-center lead vocal with intimate verses that build into belts.");
  });

  it("omits the descriptor clause gracefully when there are no descriptors", () => {
    const response = fixture();
    response.research.vocalCharacteristics.descriptors = [];
    const { leadParagraph } = buildResearchSummary(response);
    expect(leadParagraph).toBe(
      "Adele’s vocal on “Rolling in the Deep” is Soul-pop. Front-and-center lead vocal with intimate verses that build into belts."
    );
  });

  it("caps bullets at 3 even when more primary intents exist", () => {
    const response = fixture();
    response.reasoning.processingIntents = [
      ...response.reasoning.processingIntents,
      {
        id: "character-5",
        category: "character",
        observation: "Fifth.",
        goal: "Fifth goal.",
        headline: "Fifth headline",
        priority: "primary",
      },
    ];
    const { bullets } = buildResearchSummary(response);
    expect(bullets).toHaveLength(3);
  });

  it("prefers primary-priority intents over supporting ones", () => {
    const { bullets } = buildResearchSummary(fixture());
    // The fixture's 4th intent (priority: supporting) should not appear -- only the first
    // 3 (all primary) do.
    expect(bullets).not.toContain("Restrained depth, lead stays anchored");
  });

  it("each bullet is that intent's short headline, not the fuller observation/goal text", () => {
    const { bullets } = buildResearchSummary(fixture());
    expect(bullets).toEqual([
      "Wide dynamic range, kept transparent through choruses",
      "Warm chest tone, kept forward and present",
      "Clear diction, sibilance kept in check",
    ]);
  });

  it("falls back to whatever intents exist when none are marked primary, rather than returning an empty list", () => {
    const response = fixture();
    for (const intent of response.reasoning.processingIntents) {
      intent.priority = "supporting";
    }
    const { bullets } = buildResearchSummary(response);
    // Exact content, not just count -- a broken fallback that pulled from the wrong
    // source (or the wrong slice) could still satisfy a bare length check.
    expect(bullets).toEqual([
      "Wide dynamic range, kept transparent through choruses",
      "Warm chest tone, kept forward and present",
      "Clear diction, sibilance kept in check",
    ]);
  });

  it("omits an intent from the bullet list when it has no headline, rather than rendering a blank bullet", () => {
    // Simulates a generation stored before the `headline` field existed -- optional on the
    // schema for exactly this backward-compat reason (see reasoning.ts). buildResearchSummary
    // must degrade gracefully rather than rendering an empty/undefined bullet.
    const response = fixture();
    response.reasoning.processingIntents = response.reasoning.processingIntents.map((intent) => ({
      ...intent,
      headline: undefined,
    }));
    const { leadParagraph, bullets } = buildResearchSummary(response);
    expect(bullets).toEqual([]);
    // The lead paragraph never depended on headline -- an old record should still render it.
    expect(leadParagraph).toContain("Adele");
  });

  it("omits an intent from the bullet list when its headline is blank/whitespace-only", () => {
    const response = fixture();
    response.reasoning.processingIntents[0].headline = "   ";
    const { bullets } = buildResearchSummary(response);
    expect(bullets).toEqual([
      "Warm chest tone, kept forward and present",
      "Clear diction, sibilance kept in check",
    ]);
  });
});
