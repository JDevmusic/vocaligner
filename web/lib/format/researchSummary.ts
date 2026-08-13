import type { VocalChainResponse } from "../schema/vocalChain";

// Brief was explicit (founder feedback, 2026-08-13) -- caps bullets regardless of how many
// primary-priority processing intents a generation returns.
const MAX_BULLETS = 3;

export interface ResearchSummary {
  leadParagraph: string;
  bullets: string[];
}

// The lead paragraph is purely templated, no new AI call: research already carries rich,
// song-specific prose (verified against a real generation, not assumed) -- naming the
// artist/song directly and leaning on that existing free-text data (descriptors,
// deliveryStyle) is what makes it read as specific to the actual song rather than generic.
// The bullets use each primary intent's `headline` field -- itself AI-written (same
// Reasoning call, no extra round-trip), added specifically for this brief, display-friendly
// purpose after mechanically truncating the fuller observation/goal text proved unreliable
// (real examples cut off mid-thought). Either way, how specific this reads is bounded by
// what that generation's own research/reasoning actually found -- this can't manufacture
// detail the underlying data doesn't have.
export function buildResearchSummary(response: VocalChainResponse): ResearchSummary {
  const { input, research, reasoning } = response;
  const { genre, vocalCharacteristics } = research;

  const descriptors = vocalCharacteristics.descriptors.slice(0, 3).join(", ");
  const leadParagraph = `${input.artist}’s vocal on “${input.song}” is ${genre.primary}${
    descriptors ? ` — ${descriptors}` : ""
  }. ${vocalCharacteristics.deliveryStyle}`;

  // Prefers primary-priority intents (the ones that actually drove a plugin decision), but
  // falls back to whatever exists if a generation happens to have none marked primary --
  // reasoning.processingIntents is guaranteed non-empty (MIN_PROCESSING_INTENTS), so bullets
  // is never empty as long as a response exists at all.
  const primaryIntents = reasoning.processingIntents.filter((intent) => intent.priority === "primary");
  const bulletIntents = (primaryIntents.length > 0 ? primaryIntents : reasoning.processingIntents).slice(
    0,
    MAX_BULLETS
  );
  const bullets = bulletIntents.map((intent) => intent.headline);

  return { leadParagraph, bullets };
}
