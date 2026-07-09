import { describe, expect, it } from "vitest";
import { pluginRegistry } from "../../registry/pluginRegistry";
import { createMockModelClient } from "../mockModelClient";
import type { StageObservation } from "../observability";
import { runGenerationStage } from "./generationStage";
import { runReasoningStage } from "./reasoningStage";
import { runResearchStage } from "./researchStage";

describe("stage-level observability wiring", () => {
  it("reports a duration and zero usage/retries for each stage via MockModelClient", async () => {
    const modelClient = createMockModelClient();
    const observations: StageObservation[] = [];
    const observe = (observation: StageObservation) => observations.push(observation);

    const research = await runResearchStage(
      modelClient,
      { artist: "Frank Ocean", song: "Thinkin Bout You" },
      observe
    );
    const reasoning = await runReasoningStage(
      modelClient,
      { artist: "Frank Ocean", song: "Thinkin Bout You", research },
      observe
    );
    await runGenerationStage(
      modelClient,
      {
        artist: "Frank Ocean",
        song: "Thinkin Bout You",
        processingIntents: reasoning.processingIntents,
        availablePlugins: pluginRegistry.getAvailable({ daw: "logic-pro", tier: "stock" }),
        context: { daw: "logic-pro", tier: "stock" },
      },
      observe
    );

    expect(observations).toHaveLength(3);
    for (const observation of observations) {
      expect(observation.durationMs).toBeGreaterThanOrEqual(0);
      expect(observation.usage).toEqual({ inputTokens: 0, outputTokens: 0 });
      expect(observation.retryCount).toBe(0);
    }
  });

  it("does not require an observe callback — stages work identically without one", async () => {
    const modelClient = createMockModelClient();
    const research = await runResearchStage(modelClient, { artist: "Adele", song: "Someone Like You" });
    expect(research.genre.primary).toBeDefined();
  });
});
