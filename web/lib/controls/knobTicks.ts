// Generic "nice round number" tick step, the same idea as a chart axis --
// computed from any control's own min/max, not hand-picked per knob, so the
// same radial tick-mark knob treatment works across every knob-based plugin.
// Always includes the true min/max as ticks (even if not "nice"), since real
// knobs label their absolute endpoints.
export function niceTickValues(min: number, max: number, targetCount = 6): number[] {
  if (max <= min) return [min];
  const range = max - min;
  const rawStep = range / (targetCount - 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / magnitude;
  let step: number;
  if (residual > 5) step = 10 * magnitude;
  else if (residual > 2) step = 5 * magnitude;
  else if (residual > 1) step = 2 * magnitude;
  else step = magnitude;

  const ticks: number[] = [];
  const start = Math.ceil(min / step) * step;
  for (let v = start; v <= max + 1e-9; v += step) ticks.push(Math.round(v * 1000) / 1000);
  if (ticks.length === 0 || ticks[0] !== min) ticks.unshift(Math.round(min * 1000) / 1000);
  if (ticks[ticks.length - 1] !== max) ticks.push(Math.round(max * 1000) / 1000);
  return ticks;
}
