export const CHROMATIC = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// Full Root Note x Scale/Chord interval table, transcribed from Logic Pro's
// own Scale/Chord list (docs/plugin-references.md) -- not inferred per
// example. Drone and Single are confirmed against Apple's official
// documentation: https://support.apple.com/guide/logicpro/quantization-grid-lgcef2835611/mac
// -- Drone is root + a fifth, NOT root-only as originally guessed.
export const SCALE_INTERVALS: Record<string, number[]> = {
  "Chromatic Scale": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  "Major Scale": [0, 2, 4, 5, 7, 9, 11],
  "Major Pentatonic Scale": [0, 2, 4, 7, 9],
  "Minor Pentatonic Scale": [0, 3, 5, 7, 10],
  "Major + b7 Scale (Mixolydian)": [0, 2, 4, 5, 7, 9, 10],
  "Natural Minor Scale (Aeolian)": [0, 2, 3, 5, 7, 8, 10],
  "Harmonic Minor Scale": [0, 2, 3, 5, 7, 8, 11],
  "Melodic Minor Scale": [0, 2, 3, 5, 7, 9, 11],
  "Major Chord": [0, 4, 7],
  "6": [0, 4, 7, 9],
  "6/9": [0, 2, 4, 7, 9],
  "7": [0, 4, 7, 10],
  "7sus4": [0, 5, 7, 10],
  "7/b5": [0, 4, 6, 10],
  "7/b9": [0, 1, 4, 7, 10],
  "7/9": [0, 2, 4, 7, 10],
  "7/#9": [0, 3, 4, 7, 10],
  "7/#11": [0, 4, 6, 7, 10],
  "7/b13": [0, 4, 7, 8, 10],
  "7/13": [0, 4, 7, 9, 10],
  Maj7: [0, 4, 7, 11],
  "Maj7/9": [0, 2, 4, 7, 11],
  "Maj7/#11": [0, 4, 6, 7, 11],
  Add9: [0, 2, 4, 7],
  Min: [0, 3, 7],
  Min6: [0, 3, 7, 9],
  Min7: [0, 3, 7, 10],
  "Min7/b5": [0, 3, 6, 10],
  "Min7/9": [0, 2, 3, 7, 10],
  "Min7/11": [0, 3, 5, 7, 10],
  "Min/maj7": [0, 3, 7, 11],
  "Min/maj7/9": [0, 2, 3, 7, 11],
  "Min add9": [0, 2, 3, 7],
  Dim: [0, 3, 6],
  Dim7: [0, 3, 6, 9],
  Aug: [0, 4, 8],
  Aug7: [0, 4, 8, 10],
  "Aug j7": [0, 4, 8, 11],
  Sus2: [0, 2, 7],
  Sus4: [0, 5, 7],
  Drone: [0, 7],
  Single: [0],
};

// Looks up the scale/chord's offset pattern and transposes it onto the root
// note -- never hand-listed per example. Unrecognised root/scale values
// (e.g. Root Note "None", which real Logic uses to mean "no highlighting")
// resolve to an empty set rather than throwing, since a Generation's
// research always resolves a specific key in practice.
export function getScaleNotes(root: string, scale: string): Set<string> {
  const rootIndex = CHROMATIC.indexOf(root);
  const intervals = SCALE_INTERVALS[scale];
  if (rootIndex === -1 || !intervals) return new Set();
  return new Set(intervals.map((i) => CHROMATIC[(rootIndex + i) % 12]));
}
