import { describe, expect, it } from "vitest";
import type { ControlValue } from "../schema/chain";
import { logicProStockPlugins } from "../registry/logicPro";
import {
  FREQ_MAJOR,
  FREQ_TICKS,
  bandResponseDb,
  dbToY,
  freqToX,
  resolveChannelEqBands,
  selectVisibleFreqTicks,
  totalResponseDb,
} from "./channelEqCurve";

const channelEq = logicProStockPlugins.find((p) => p.id === "logic-pro.channel-eq")!;

function value(parameter: string, num: number): ControlValue {
  return { parameter, value: num, confidence: "high", wasRepaired: false };
}

// The real applied example from docs/images.md/ChannelEQ_example.png: only
// bands 1/4/6/8 differ from their defaults. Band 8's Q (0.79) is genuinely
// touched too, not just its frequency -- confirmed directly against the
// reference screenshot's three-line band readout.
const APPLIED_EXAMPLE_VALUES: ControlValue[] = [
  value("band1Frequency", 69.5),
  value("band4Gain", -4.4),
  value("band6Frequency", 2980),
  value("band6Gain", 1.5),
  value("band6Q", 0.93),
  value("band8Frequency", 12000),
  value("band8Q", 0.79),
];

describe("resolveChannelEqBands", () => {
  it("marks every band disabled when controls[] is empty, but still resolves registry defaults for later use", () => {
    const bands = resolveChannelEqBands(channelEq, []);
    expect(bands).toHaveLength(8);
    expect(bands.every((b) => !b.enabled)).toBe(true);
    expect(bands[0].freq).toBe(20);
    expect(bands[0].slopeDbPerOct).toBe(12);
    expect(bands[0].q).toBe(0.71);
    expect(bands[7].freq).toBe(20000);
    expect(bands[7].slopeDbPerOct).toBe(24);
    expect(bands[7].q).toBe(0.71);
  });

  it("enables only the bands with at least one parameter present, matching the real applied example", () => {
    const bands = resolveChannelEqBands(channelEq, APPLIED_EXAMPLE_VALUES);
    const enabledIndexes = bands.filter((b) => b.enabled).map((b) => b.index);
    expect(enabledIndexes).toEqual([1, 4, 6, 8]);

    const band1 = bands.find((b) => b.index === 1)!;
    expect(band1.freq).toBe(69.5);
    expect(band1.slopeDbPerOct).toBe(12); // untouched -> falls back to registry default
    expect(band1.q).toBe(0.71); // untouched -> registry default

    const band4 = bands.find((b) => b.index === 4)!;
    expect(band4.freq).toBe(250); // untouched -> registry default
    expect(band4.gainDb).toBe(-4.4);
    expect(band4.q).toBe(0.3); // untouched -> registry default

    const band8 = bands.find((b) => b.index === 8)!;
    expect(band8.freq).toBe(12000);
    expect(band8.q).toBe(0.79); // touched, differs from the 0.71 default
    expect(band8.slopeDbPerOct).toBe(24);
  });
});

describe("totalResponseDb", () => {
  it("is dead flat at 0dB across the spectrum when no bands are enabled", () => {
    const bands = resolveChannelEqBands(channelEq, []);
    for (const freq of [20, 50, 100, 500, 1000, 5000, 10000, 20000]) {
      expect(totalResponseDb(bands, freq)).toBeCloseTo(0, 6);
    }
  });

  it("does not fall back to a disabled band's default frequency -- the original mockup bug", () => {
    // Band 1's default frequency (20Hz) is right at the low edge of the
    // graph; if a disabled band still computed its response there, the
    // neutral curve would show a dip instead of being flat.
    const disabledBands = resolveChannelEqBands(channelEq, []);
    expect(totalResponseDb(disabledBands, 20)).toBeCloseTo(0, 6);

    const enabledBands = resolveChannelEqBands(channelEq, [value("band1Frequency", 20)]);
    expect(totalResponseDb(enabledBands, 20)).toBeLessThan(-2); // right at cutoff, real attenuation
  });

  it("matches the real applied example's known rolloff depth at 20Hz (independently verified in the design spike against 3 separate methods)", () => {
    const bands = resolveChannelEqBands(channelEq, APPLIED_EXAMPLE_VALUES);
    // A 69.5Hz Q0.71 highpass at 20Hz: RBJ biquad, continuous-time
    // Butterworth, and the 12dB/octave asymptotic estimate all agreed within
    // 0.5dB of ~-22dB during the mockup phase this component is built from.
    expect(totalResponseDb(bands, 20)).toBeCloseTo(-22, 0);
  });
});

describe("cascaded cut-band slope", () => {
  it("a 24dB/Oct band attenuates exactly twice as many dB as a 12dB/Oct band at the same frequency", () => {
    const band12 = { index: 1, kind: "lowpass" as const, enabled: true, freq: 1000, gainDb: 0, q: 0.71, slopeDbPerOct: 12 };
    const band24 = { ...band12, slopeDbPerOct: 24 };
    const evalFreq = 4000; // two octaves above cutoff
    const db12 = bandResponseDb(band12, evalFreq);
    const db24 = bandResponseDb(band24, evalFreq);
    expect(db24).toBeCloseTo(db12 * 2, 6);
  });
});

describe("axis helpers", () => {
  it("freqToX maps the 20Hz-20kHz range onto the plot's known left/right edges", () => {
    expect(freqToX(20)).toBeCloseTo(40, 6);
    expect(freqToX(20000)).toBeCloseTo(900, 6);
  });

  it("dbToY places 0dB on the baseline and is monotonically decreasing in y as db increases", () => {
    expect(dbToY(0)).toBe(150);
    expect(dbToY(15)).toBeLessThan(dbToY(0));
    expect(dbToY(-15)).toBeGreaterThan(dbToY(0));
    expect(dbToY(-60)).toBeGreaterThan(dbToY(-15));
  });
});

describe("selectVisibleFreqTicks", () => {
  it("always keeps every major (decade) tick", () => {
    const visible = selectVisibleFreqTicks(FREQ_TICKS);
    for (const major of FREQ_MAJOR) {
      expect(visible.has(major)).toBe(true);
    }
  });

  it("thins the dense minor ticks rather than rendering all of them", () => {
    const visible = selectVisibleFreqTicks(FREQ_TICKS);
    expect(visible.size).toBeLessThan(FREQ_TICKS.length);
  });

  it("keeps clearance between the last tick (20k) and the space just past it, matching the gain axis fix", () => {
    // 20k always visible as a major; nothing else should be crammed within a
    // few px of it on its immediate left (e.g. a lingering "9k"-style label).
    const visible = selectVisibleFreqTicks(FREQ_TICKS);
    expect(visible.has(20000)).toBe(true);
    expect(visible.has(9000)).toBe(false);
  });
});
