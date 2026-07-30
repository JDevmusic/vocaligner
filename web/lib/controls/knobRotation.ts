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
