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
    "Also write a headline for each: a short, punchy phrase (roughly 6-10 words, one sentence fragment, no period) that captures the essence of that observation and treatment together, for display directly to the artist -- specific and confident, not a generic engineering summary. For example, for a vocal with warm low-mid body and a controlled top end, prefer something like 'Warm low-mid body, kept open without harshness' over a flat restatement like 'Preserve tonal balance in the low and high frequencies.'",
    "Only raise a pitch goal when the research indicates the vocal has an audibly obvious pitch-correction or vocoder-style aesthetic (for example, a Travis Scott vocal on 'Highest in the Room') — being able to identify the song's key or scale is not, on its own, sufficient justification for a pitch goal.",
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
