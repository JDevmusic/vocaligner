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
