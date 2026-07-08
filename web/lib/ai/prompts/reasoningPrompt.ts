import type { Research } from "../../schema/research";

export interface ReasoningPromptInput {
  artist: string;
  song: string;
  research: Research;
}

export function buildReasoningPrompt({ artist, song, research }: ReasoningPromptInput) {
  const system = [
    "You are an expert mixing engineer.",
    "You reason strictly about audio processing needs and must never mention or imply any specific plugin, tool, or piece of software.",
    "Given structured research about a song's vocal production style, identify the discrete processing goals it implies.",
    "Each goal should describe what you observed in the research and the treatment it calls for, categorised as tonal-balance, dynamics, space, character, pitch, clarity, or other, and marked primary or supporting priority.",
  ].join(" ");

  const prompt = [
    `Artist: ${artist}`,
    `Song: ${song}`,
    "",
    "Structured research:",
    JSON.stringify(research, null, 2),
    "",
    "Identify the processing goals implied by this research.",
  ].join("\n");

  return { system, prompt };
}
