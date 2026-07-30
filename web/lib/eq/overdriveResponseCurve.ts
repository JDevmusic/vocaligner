import { bandResponseDb } from "./channelEqCurve";

// Drive -- soft-clip waveshaper, textbook tanh saturation. Steepness scales
// exponentially with the drive amount, calibrated against a second
// reference example (Overdrive2.png, 13.75dB) during the design spike: that
// value already reads as a near-step transition from flat to fully
// saturated, not a wide gentle S -- a linear per-dB steepness mapping can't
// reach that steepness at a realistic mid-range value without also making
// low drive values too sharp.
const DRIVE_K_MIN = 0.15;
const DRIVE_K_MAX = 180;
const DRIVE_MAX_DB = 24;

export function driveCurveY(driveDb: number, xSigned: number): number {
  const t = Math.min(1, Math.max(0, driveDb / DRIVE_MAX_DB));
  const k = DRIVE_K_MIN * Math.pow(DRIVE_K_MAX / DRIVE_K_MIN, t);
  return Math.tanh(k * xSigned) / Math.tanh(k);
}

// Tone -- literally Channel EQ's own lowpass biquad (bandResponseDb),
// evaluated at the real tone frequency. Two earlier attempts (a hand-rolled
// symmetric sigmoid, then a highshelf biquad) both flatten at both ends by
// construction -- a structural property of any shelf-shaped response that
// no amount of retuning fixes. A lowpass has no target gain to level out
// at, so it keeps rolling off at a constant dB/octave past cutoff instead
// -- confirmed against the reference, whose Tone curve is still visibly
// sloping downward at the graph's right edge, not flat.
const TONE_LOWPASS_Q = 0.707;
const TONE_SLOPE_DB_PER_OCT = 12;
// Clamp span for the normalized [-1, 1] plot range -- chosen high enough
// that a realistic 20Hz-20kHz sweep never actually reaches the clamp, so it
// only guards against an extreme tone/frequency combination overshooting
// the plot.
const TONE_DB_SPAN = 55;

export function toneCurveDb(toneHz: number, evalFreq: number): number {
  return bandResponseDb(
    { index: 0, kind: "lowpass", enabled: true, freq: toneHz, gainDb: 0, q: TONE_LOWPASS_Q, slopeDbPerOct: TONE_SLOPE_DB_PER_OCT },
    evalFreq
  );
}

export function toneCurveY(toneHz: number, evalFreq: number): number {
  const db = toneCurveDb(toneHz, evalFreq);
  return Math.max(-1, db / TONE_DB_SPAN);
}
