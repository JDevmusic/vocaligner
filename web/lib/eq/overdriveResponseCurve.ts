import { bandResponseDb } from "./channelEqCurve";

// Drive -- soft-clip waveshaper, textbook tanh saturation. Steepness scales
// with the drive amount as a power of the drive fraction (k = DRIVE_K_SCALE
// * t^DRIVE_K_EXPONENT, t = driveDb/24), calibrated by directly pixel-
// measuring the curve's own shape in both reference screenshots (tracing
// the green plotted line, fitting tanh(k*x)/tanh(k) to it by least squares)
// rather than eyeballing or anchoring off a single point:
// Overdrive_plugin.png (Drive=6dB, the value this component actually
// verifies against) measures k=3.51; Overdrive2.png (Drive=13.75dB, the
// design spike's original near-step-transition anchor) measures k=8.61,
// confirming that anchor was already accurate. DRIVE_K_SCALE/DRIVE_K_EXPONENT
// are the two constants that make the power curve pass through both
// measured points exactly. A power curve was chosen over the prior
// exponential-in-t formula (DRIVE_K_MIN=0.15, DRIVE_K_MAX=180) because an
// exponential can't pass through both measured points AND stay near-linear
// at very low drive (it forces a non-zero steepness floor at driveDb=0);
// a power curve naturally reaches k=0 -- true zero saturation -- at
// driveDb=0, while still fitting both measurements almost exactly.
const DRIVE_K_SCALE = 15.73;
const DRIVE_K_EXPONENT = 1.082;
const DRIVE_MAX_DB = 24;

export function driveCurveY(driveDb: number, xSigned: number): number {
  const t = Math.min(1, Math.max(0, driveDb / DRIVE_MAX_DB));
  const k = DRIVE_K_SCALE * Math.pow(t, DRIVE_K_EXPONENT);
  // At driveDb=0 (t=0), k is exactly 0 -- tanh(k*x)/tanh(k) is 0/0 (NaN),
  // but the mathematical limit as k->0 is x itself (zero drive means zero
  // saturation, a straight diagonal), so that's returned directly.
  if (k === 0) return xSigned;
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
