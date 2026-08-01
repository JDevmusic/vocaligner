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
//
// `floor` is the log scale's effective minimum for the angle fraction,
// separate from `min` (which still clamps the incoming value and is what
// the dial prints as its minimum label). Defaults to `min`, so every
// existing caller (Overdrive's Tone) is unaffected. ChromaVerb's Decay
// (0.3-100s) needs them to differ: a plain log10 over the literal printed
// range (floor=min=0.3) puts 1.1s at ~22% of the sweep, but pixel-measuring
// the reference's own needle puts it at ~39%. The real dial's effective
// log floor is well below its printed "0.3" minimum -- fit here to
// floor=0.06 (solved backward from that one measured point: the only
// value this project has a real reference screenshot for). If a second
// real Decay reference value ever turns up, refit both this floor and
// double-check `max` the same two-point way Phaser's Rate 1/2 epsilon was
// (`web/app/components/PhaserVisual.tsx`) rather than trusting a
// single-point solve indefinitely.
export function logKnobRotationDeg(value: number, min: number, max: number, floor: number = min): number {
  if (max <= min || floor <= 0) return KNOB_MIN_DEG;
  const clamped = Math.min(max, Math.max(min, value));
  const t = (Math.log10(clamped) - Math.log10(floor)) / (Math.log10(max) - Math.log10(floor));
  return KNOB_MIN_DEG + t * (KNOB_MAX_DEG - KNOB_MIN_DEG);
}
