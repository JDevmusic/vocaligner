export interface ResearchPromptInput {
  artist: string;
  song: string;
}

export function buildResearchPrompt({ artist, song }: ResearchPromptInput) {
  const system = [
    "You are an expert music production researcher specialising in vocal recording and mixing.",
    "Given an artist and a song, describe the vocal production style using only what is reasonably well-established or inferable about that recording.",
    "Respond using the exact structured fields you are given — do not produce a separate free-text summary.",
    "If you are uncertain about a specific detail, choose the closest reasonable category and note the uncertainty in productionNotes rather than leaving a field vague.",
  ].join(" ");

  const prompt = `Artist: ${artist}\nSong: ${song}\n\nAnalyse the vocal production style of this recording.`;

  return { system, prompt };
}
