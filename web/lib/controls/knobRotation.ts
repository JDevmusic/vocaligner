const KNOB_MIN_DEG = -135;
const KNOB_MAX_DEG = 135;

// Standard knob sweep: -135deg (fully counter-clockwise, min) through 0deg
// (straight up, center) to +135deg (fully clockwise, max). Values outside
// [min, max] clamp rather than extrapolate past the physical sweep.
export function getKnobRotationDeg(value: number, min: number, max: number): number {
  if (max <= min) return KNOB_MIN_DEG;
  const clamped = Math.min(max, Math.max(min, value));
  const t = (clamped - min) / (max - min);
  return KNOB_MIN_DEG + t * (KNOB_MAX_DEG - KNOB_MIN_DEG);
}

// Some real dials run high-to-low left-to-right instead of the usual
// min-left/max-right sweep -- DeEsser 2's Max Reduction is the confirmed
// case (25 printed on the left, 0 on the right), caught by checking the
// reference screenshot's own printed labels rather than assuming standard
// direction. Same fraction-of-range math as getKnobRotationDeg, just
// mapped onto the angle range backwards.
export function invertedKnobRotationDeg(value: number, min: number, max: number): number {
  if (max <= min) return KNOB_MAX_DEG;
  const clamped = Math.min(max, Math.max(min, value));
  const t = (clamped - min) / (max - min);
  return KNOB_MAX_DEG - t * (KNOB_MAX_DEG - KNOB_MIN_DEG);
}

// Some real dials sweep a frequency range, which reads log-scaled rather
// than linear -- Overdrive's Tone (20Hz-20kHz) is the confirmed case: at
// 980Hz, a linear fraction-of-range puts the needle at ~5% (near the
// minimum stop), but the reference screenshot shows it past the halfway
// point (~56%, roughly 1 o'clock). Same log10 convention Channel EQ's own
// frequency axis uses (freqToX in channelEqCurve.ts), just applied to the
// knob's angle instead of a graph's x-position.
export function logKnobRotationDeg(value: number, min: number, max: number): number {
  if (max <= min || min <= 0) return KNOB_MIN_DEG;
  const clamped = Math.min(max, Math.max(min, value));
  const t = (Math.log10(clamped) - Math.log10(min)) / (Math.log10(max) - Math.log10(min));
  return KNOB_MIN_DEG + t * (KNOB_MAX_DEG - KNOB_MIN_DEG);
}
