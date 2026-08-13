import { describe, expect, it } from "vitest";
import { processingIntentSchema } from "./reasoning";

// Regression coverage for a real bug found in code review: `headline` was added as a
// *required* field, which made `vocalChainResponseSchema.safeParse()` reject every
// generation stored before the field existed the moment a user revisited its permanent
// /results?id= link (GET /api/generate/[id] never re-checks PIPELINE_VERSION/PROMPT_VERSION
// by design -- AD-10 -- so those old, headline-less records are still served as-is for the
// rest of their 30-day retention window). Kept optional here on purpose; see reasoning.ts's
// comment on the field itself for the full rationale.
describe("processingIntentSchema", () => {
  it("accepts a processing intent with no headline, for backward compatibility with cached generations from before the field existed", () => {
    const legacyIntent = {
      id: "dynamics-1",
      category: "dynamics",
      observation: "Dynamics vary between phrases.",
      goal: "Even out level.",
      priority: "primary",
    };
    const result = processingIntentSchema.safeParse(legacyIntent);
    expect(result.success).toBe(true);
  });

  it("still accepts a processing intent with a headline, unchanged from before", () => {
    const freshIntent = {
      id: "dynamics-1",
      category: "dynamics",
      observation: "Dynamics vary between phrases.",
      goal: "Even out level.",
      headline: "Uneven dynamics, evened out",
      priority: "primary",
    };
    const result = processingIntentSchema.safeParse(freshIntent);
    expect(result.success).toBe(true);
  });
});
