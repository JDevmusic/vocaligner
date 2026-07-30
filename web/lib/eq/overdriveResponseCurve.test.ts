import { describe, expect, it } from "vitest";
import { driveCurveY, toneCurveDb, toneCurveY } from "./overdriveResponseCurve";

describe("driveCurveY", () => {
  it("reads close to a straight diagonal at a very low drive value", () => {
    expect(driveCurveY(1, 0.5)).toBeCloseTo(0.5, 1);
  });

  it("flattens hard near both ends at a near-max drive value", () => {
    expect(driveCurveY(23, 0.5)).toBeGreaterThan(0.95);
    expect(driveCurveY(23, -0.5)).toBeLessThan(-0.95);
  });

  it("is always 0 at x=0 (center) regardless of drive", () => {
    expect(driveCurveY(0.5, 0)).toBeCloseTo(0, 6);
    expect(driveCurveY(24, 0)).toBeCloseTo(0, 6);
  });

  it("reaches +-1 at the full extent of x for any drive value", () => {
    expect(driveCurveY(10, 1)).toBeCloseTo(1, 6);
    expect(driveCurveY(10, -1)).toBeCloseTo(-1, 6);
  });

  it("matches the reference calibration: 13.75dB already reads as a near-step transition at the midpoint", () => {
    const delta = driveCurveY(13.75, 0.05) - driveCurveY(13.75, -0.05);
    expect(delta).toBeGreaterThan(0.5);
  });
});

describe("toneCurveDb / toneCurveY", () => {
  it("is flat (0dB) well below the tone cutoff frequency", () => {
    expect(toneCurveDb(2400, 200)).toBeCloseTo(0, 1);
  });

  // Octave multiples are kept well under the Nyquist frequency the
  // underlying biquad math is valid up to (half of channelEqCurve's 48kHz
  // sample rate, i.e. 24kHz) -- a low tone frequency here so several
  // octaves above it still land inside the real 20Hz-20kHz graph range the
  // component actually evaluates.
  it("keeps declining as frequency increases well past cutoff, not leveling off", () => {
    const dbAt3Octaves = toneCurveDb(500, 500 * 8);
    const dbAt4Octaves = toneCurveDb(500, 500 * 16);
    expect(dbAt4Octaves).toBeLessThan(dbAt3Octaves);
  });

  it("never re-flattens into a second plateau the way a shelf filter would", () => {
    const slopeNear = toneCurveDb(500, 500 * 4) - toneCurveDb(500, 500 * 8);
    const slopeFar = toneCurveDb(500, 500 * 8) - toneCurveDb(500, 500 * 16);
    // A shelf's per-octave delta shrinks toward 0 as it nears its target
    // gain; a lowpass keeps declining at roughly its own dB/octave rate.
    expect(Math.abs(slopeFar)).toBeGreaterThan(Math.abs(slopeNear) * 0.5);
  });

  it("toneCurveY never exceeds the plot's [-1, 1] range", () => {
    expect(toneCurveY(20, 20000)).toBeGreaterThanOrEqual(-1);
    expect(toneCurveY(20000, 20)).toBeLessThanOrEqual(1);
  });
});
