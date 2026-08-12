import { CHROMATIC } from "../pitch/scaleIntervals";

export interface SongKeyLookup {
  rootNote: string;
  scale: string;
}

// GetSongBPM only distinguishes major/minor, not which of Logic's several real minor
// variants (Natural/Harmonic/Melodic/Pentatonic) a song actually uses -- Natural Minor
// is the standard, correct default reading of a bare minor key label. These two strings
// must match SCALE_INTERVALS' keys in ../pitch/scaleIntervals.ts exactly, since that's
// what Pitch Correction's registry `options` constraint (logicPro.ts) accepts.
const MAJOR_SCALE = "Major Scale";
const NATURAL_MINOR_SCALE = "Natural Minor Scale (Aeolian)";

const FLAT_TO_SHARP: Record<string, string> = {
  Db: "C#",
  Eb: "D#",
  Gb: "F#",
  Ab: "G#",
  Bb: "A#",
};

// GetSongBPM's `key_of` field is a short label like "Em", "C#", or "Bb" -- not one of
// this project's own real Root Note/Scale option strings. Parses it into those exact
// strings, or null if it doesn't look like a real key (defensive: this is third-party
// data, never trusted blindly).
export function parseKeyOf(keyOf: string): SongKeyLookup | null {
  const match = /^([A-Ga-g])([#b]?)(m?)$/.exec(keyOf.trim());
  if (!match) return null;

  const [, letter, accidental, minor] = match;
  const upperLetter = letter.toUpperCase();
  const note = accidental === "b" ? (FLAT_TO_SHARP[`${upperLetter}b`] ?? null) : `${upperLetter}${accidental}`;
  if (!note || !CHROMATIC.includes(note)) return null;

  return { rootNote: note, scale: minor ? NATURAL_MINOR_SCALE : MAJOR_SCALE };
}

// NOT api.getsongbpm.com -- that's the pre-2024.09 host. GetSongBPM's own docs (Changelog
// 1.2) say it "automatically redirects" here, but in practice it now sits behind a
// Cloudflare bot-challenge that no server-side request can pass, silently breaking every
// lookup (confirmed live: real requests to the old host never even reached GetSongBPM's
// own code, let alone returned real data).
const API_BASE = "https://api.getsong.co";
const TIMEOUT_MS = 5000;

interface GetSongBpmSearchResponse {
  search?: Array<{ key_of?: unknown }>;
}

export interface LookupSongKeyOptions {
  apiKey?: string;
}

// Best-effort only, by design: this augments Pitch Correction's rootNote/scale with a
// real looked-up value when it can, but a Generation must never depend on it. Every
// failure mode -- no key configured, song not found, network error, a response that
// doesn't parse -- returns null, leaving the model's own guess untouched. Same
// "never force a wrong answer" philosophy as DeEsser 2's always-faded controls
// elsewhere in this registry.
export async function lookupSongKey(
  artist: string,
  song: string,
  options: LookupSongKeyOptions = {}
): Promise<SongKeyLookup | null> {
  const apiKey = options.apiKey ?? process.env.GETSONGBPM_API_KEY;
  if (!apiKey?.trim()) return null;

  try {
    const lookup = `song:${song} artist:${artist}`;
    const url = `${API_BASE}/search/?api_key=${encodeURIComponent(apiKey)}&type=both&lookup=${encodeURIComponent(lookup)}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!response.ok) return null;

    const data = (await response.json()) as GetSongBpmSearchResponse;
    const keyOf = data.search?.[0]?.key_of;
    if (typeof keyOf !== "string") return null;

    return parseKeyOf(keyOf);
  } catch {
    return null;
  }
}
