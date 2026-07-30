import type { ControlValue } from "../schema/chain";
import type { PluginRegistryEntry } from "../registry/types";

export type ChannelEqBandKind = "highpass" | "lowshelf" | "bell" | "highshelf" | "lowpass";

interface ChannelEqBandDef {
  index: number;
  kind: ChannelEqBandKind;
  freqParam: string;
  gainParam?: string;
  qParam?: string;
  slopeParam?: string;
}

// Structural facts about Channel EQ's own architecture -- which of the 8
// band slots is which filter type -- not something a Generation ever
// chooses. Parameter names here must match web/lib/registry/logicPro.ts's
// Channel EQ entry.
export const CHANNEL_EQ_BAND_DEFS: ChannelEqBandDef[] = [
  { index: 1, kind: "highpass", freqParam: "band1Frequency", slopeParam: "band1Slope", qParam: "band1Q" },
  { index: 2, kind: "lowshelf", freqParam: "band2Frequency", gainParam: "band2Gain", qParam: "band2Q" },
  { index: 3, kind: "bell", freqParam: "band3Frequency", gainParam: "band3Gain", qParam: "band3Q" },
  { index: 4, kind: "bell", freqParam: "band4Frequency", gainParam: "band4Gain", qParam: "band4Q" },
  { index: 5, kind: "bell", freqParam: "band5Frequency", gainParam: "band5Gain", qParam: "band5Q" },
  { index: 6, kind: "bell", freqParam: "band6Frequency", gainParam: "band6Gain", qParam: "band6Q" },
  { index: 7, kind: "highshelf", freqParam: "band7Frequency", gainParam: "band7Gain", qParam: "band7Q" },
  { index: 8, kind: "lowpass", freqParam: "band8Frequency", slopeParam: "band8Slope", qParam: "band8Q" },
];

export interface ResolvedEqBand {
  index: number;
  kind: ChannelEqBandKind;
  enabled: boolean;
  freq: number;
  gainDb: number;
  q: number;
  slopeDbPerOct: number;
}

// A band is "enabled" (contributes to the curve at all) only if at least one
// of its parameters is present in the Generation's sparse controls[] array --
// never inferred from being at a default value. For whichever of an enabled
// band's other parameters wasn't set, fall back to the registry's own
// default (not zero) -- e.g. Band 1 with only its frequency touched still
// uses the registry's default 12 dB/Oct slope, matching
// docs/images/reference/ChannelEQ_example.png's real applied example.
export function resolveChannelEqBands(
  plugin: PluginRegistryEntry,
  values: ControlValue[]
): ResolvedEqBand[] {
  const resolveNumber = (param: string | undefined): number => {
    if (!param) return 0;
    const found = values.find((v) => v.parameter === param);
    if (found && typeof found.value === "number") return found.value;
    const definition = plugin.controls.find((c) => c.parameter === param);
    return typeof definition?.default === "number" ? definition.default : 0;
  };

  return CHANNEL_EQ_BAND_DEFS.map((def) => {
    const params = [def.freqParam, def.gainParam, def.qParam, def.slopeParam].filter(
      (param): param is string => Boolean(param)
    );
    const enabled = params.some((param) => values.some((v) => v.parameter === param));

    return {
      index: def.index,
      kind: def.kind,
      enabled,
      freq: resolveNumber(def.freqParam),
      gainDb: resolveNumber(def.gainParam),
      q: resolveNumber(def.qParam),
      slopeDbPerOct: resolveNumber(def.slopeParam),
    };
  });
}

const SAMPLE_RATE = 48000;

function biquadCoeffs(kind: ChannelEqBandKind, freq: number, gainDb: number, q: number) {
  const w0 = (2 * Math.PI * freq) / SAMPLE_RATE;
  const cosw0 = Math.cos(w0);
  const sinw0 = Math.sin(w0);
  const alpha = sinw0 / (2 * q);
  const A = Math.pow(10, gainDb / 40);
  const sqrtA = Math.sqrt(A);

  let b0 = 1,
    b1 = 0,
    b2 = 0,
    a0 = 1,
    a1 = 0,
    a2 = 0;

  if (kind === "highpass") {
    b0 = (1 + cosw0) / 2;
    b1 = -(1 + cosw0);
    b2 = (1 + cosw0) / 2;
    a0 = 1 + alpha;
    a1 = -2 * cosw0;
    a2 = 1 - alpha;
  } else if (kind === "lowpass") {
    b0 = (1 - cosw0) / 2;
    b1 = 1 - cosw0;
    b2 = (1 - cosw0) / 2;
    a0 = 1 + alpha;
    a1 = -2 * cosw0;
    a2 = 1 - alpha;
  } else if (kind === "bell") {
    b0 = 1 + alpha * A;
    b1 = -2 * cosw0;
    b2 = 1 - alpha * A;
    a0 = 1 + alpha / A;
    a1 = -2 * cosw0;
    a2 = 1 - alpha / A;
  } else if (kind === "lowshelf") {
    b0 = A * (A + 1 - (A - 1) * cosw0 + 2 * sqrtA * alpha);
    b1 = 2 * A * (A - 1 - (A + 1) * cosw0);
    b2 = A * (A + 1 - (A - 1) * cosw0 - 2 * sqrtA * alpha);
    a0 = A + 1 + (A - 1) * cosw0 + 2 * sqrtA * alpha;
    a1 = -2 * (A - 1 + (A + 1) * cosw0);
    a2 = A + 1 + (A - 1) * cosw0 - 2 * sqrtA * alpha;
  } else if (kind === "highshelf") {
    b0 = A * (A + 1 + (A - 1) * cosw0 + 2 * sqrtA * alpha);
    b1 = -2 * A * (A - 1 + (A + 1) * cosw0);
    b2 = A * (A + 1 + (A - 1) * cosw0 - 2 * sqrtA * alpha);
    a0 = A + 1 - (A - 1) * cosw0 + 2 * sqrtA * alpha;
    a1 = 2 * (A - 1 - (A + 1) * cosw0);
    a2 = A + 1 - (A - 1) * cosw0 - 2 * sqrtA * alpha;
  }

  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0 };
}

function biquadResponseDb(kind: ChannelEqBandKind, freq: number, gainDb: number, q: number, evalFreq: number): number {
  const { b0, b1, b2, a1, a2 } = biquadCoeffs(kind, freq, gainDb, q);
  const w = (2 * Math.PI * evalFreq) / SAMPLE_RATE;
  const cos1 = Math.cos(w),
    sin1 = Math.sin(w);
  const cos2 = Math.cos(2 * w),
    sin2 = Math.sin(2 * w);

  const numReal = b0 + b1 * cos1 + b2 * cos2;
  const numImag = -(b1 * sin1 + b2 * sin2);
  const denReal = 1 + a1 * cos1 + a2 * cos2;
  const denImag = -(a1 * sin1 + a2 * sin2);

  const numMag = Math.sqrt(numReal * numReal + numImag * numImag);
  const denMag = Math.sqrt(denReal * denReal + denImag * denImag);
  return 20 * Math.log10(numMag / denMag);
}

// A single RBJ biquad section rolls off at 12dB/octave. Logic's "24 dB/Oct"
// slope option is modeled as two cascaded 12dB/Oct sections at the band's
// own (resolved) Q -- cascaded magnitude responses sum in the dB domain, so
// this doubles the attenuation at every frequency relative to one stage.
function cutBandResponseDb(kind: "highpass" | "lowpass", freq: number, q: number, slopeDbPerOct: number, evalFreq: number): number {
  const stages = Math.max(1, Math.round(slopeDbPerOct / 12));
  const perStageDb = biquadResponseDb(kind, freq, 0, q, evalFreq);
  return perStageDb * stages;
}

export function bandResponseDb(band: ResolvedEqBand, evalFreq: number): number {
  if (band.kind === "highpass" || band.kind === "lowpass") {
    return cutBandResponseDb(band.kind, band.freq, band.q, band.slopeDbPerOct, evalFreq);
  }
  return biquadResponseDb(band.kind, band.freq, band.gainDb, band.q, evalFreq);
}

// Disabled bands contribute nothing -- not their response at wherever their
// resolved frequency happens to sit. This is the fix for the bug found while
// validating this component's design: computing a "disabled" band's filter
// response at its default (often extreme) frequency produces a curve that
// isn't flat even at rest.
export function totalResponseDb(bands: ResolvedEqBand[], evalFreq: number, masterGainDb = 0): number {
  return bands.reduce((sum, band) => (band.enabled ? sum + bandResponseDb(band, evalFreq) : sum), masterGainDb);
}

export function freqToX(hz: number): number {
  const minLog = Math.log10(20);
  const maxLog = Math.log10(20000);
  const t = (Math.log10(hz) - minLog) / (maxLog - minLog);
  return 40 + t * 860;
}

// Validated against the real reference (ChannelEQ_example.png): the plot's
// left (0-60) and right (+15/-15) axes don't share a zero point -- the real
// plugin gives the region beyond +-15dB far more dramatic visual weight than
// a linear continuation of the inner scale would. Generous scale inside
// +-15dB, steepened scale beyond.
export const BASELINE_Y = 150;
const INNER_DB = 15;
const INNER_PX_PER_DB = 7.5;
const OUTER_PX_PER_DB = 6.5;

export function dbToY(db: number): number {
  if (db >= -INNER_DB) return BASELINE_Y - db * INNER_PX_PER_DB;
  const innerEdgeY = BASELINE_Y + INNER_DB * INNER_PX_PER_DB;
  return innerEdgeY + (-INNER_DB - db) * OUTER_PX_PER_DB;
}

export function computeCurvePoints(bands: ResolvedEqBand[], masterGainDb = 0): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const steps = 240;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const freq = 20 * Math.pow(1000, t);
    const db = totalResponseDb(bands, freq, masterGainDb);
    points.push({ x: freqToX(freq), y: Math.min(330, dbToY(db)) });
  }
  return points;
}

export function strokePath(points: { x: number; y: number }[]): string {
  return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
}

// Fills relative to the 0dB line, not the bottom of the chart: boosts fill
// down to 0, cuts fill up to 0.
export function fillPath(points: { x: number; y: number }[]): string {
  const first = points[0];
  const last = points[points.length - 1];
  const trace = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  return `${trace} L ${last.x.toFixed(1)} ${BASELINE_Y} L ${first.x.toFixed(1)} ${BASELINE_Y} Z`;
}

// Full per-decade multiple set (2-9x each power of ten), matching the real
// reference's density -- thinned for display via selectVisibleFreqTicks.
export const FREQ_TICKS = [
  20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 2000, 3000, 4000, 5000, 6000,
  7000, 8000, 9000, 10000, 20000,
];
export const FREQ_MAJOR = new Set([20, 100, 1000, 10000, 20000]);
export const GAIN_TICKS = [15, 10, 5, 0, -5, -10, -15, -20, -25, -30, -35, -40, -45, -50, -55, -60];
export const GAIN_LABELED = new Set([15, 10, 5, 0, -5, -10, -15, -30, -45, -60]);

export function freqLabelText(hz: number): string {
  return hz >= 1000 ? `${hz / 1000}k` : `${hz}`;
}

function estimateLabelWidth(hz: number, isMajor: boolean): number {
  return freqLabelText(hz).length * (isMajor ? 5.6 : 4.2);
}

// The real reference doesn't render every tick's label -- near each decade's
// top end the log scale compresses hard enough that adjacent labels (e.g.
// 800/900/1k) would collide, so it thins them out. Majors always show;
// minors are kept left-to-right only if they clear both the previously-kept
// label AND the next major, so a minor never crowds the major that follows.
export function selectVisibleFreqTicks(ticks: number[]): Set<number> {
  const PAD = 8;
  const items = ticks.map((hz) => {
    const isMajor = FREQ_MAJOR.has(hz);
    return { hz, x: freqToX(hz), isMajor, width: estimateLabelWidth(hz, isMajor) };
  });

  const visible = new Set<number>();
  let lastX = -Infinity;
  let lastHalfWidth = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.isMajor) {
      visible.add(item.hz);
      lastX = item.x;
      lastHalfWidth = item.width / 2;
      continue;
    }
    const nextMajor = items.slice(i + 1).find((c) => c.isMajor);
    const fitsPrev = item.x - lastX >= lastHalfWidth + item.width / 2 + PAD;
    const fitsNextMajor = !nextMajor || nextMajor.x - item.x >= item.width / 2 + nextMajor.width / 2 + PAD;
    if (fitsPrev && fitsNextMajor) {
      visible.add(item.hz);
      lastX = item.x;
      lastHalfWidth = item.width / 2;
    }
  }

  return visible;
}
