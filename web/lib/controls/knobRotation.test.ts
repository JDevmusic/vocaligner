import { describe, expect, it } from "vitest";
import { getKnobRotationDeg, invertedKnobRotationDeg, logKnobRotationDeg } from "./knobRotation";

describe("getKnobRotationDeg", () => {
  it("maps the minimum value to -135deg", () => {
    expect(getKnobRotationDeg(0, 0, 500)).toBe(-135);
  });

  it("maps the maximum value to +135deg", () => {
    expect(getKnobRotationDeg(500, 0, 500)).toBe(135);
  });

  it("maps the midpoint value to 0deg", () => {
    expect(getKnobRotationDeg(250, 0, 500)).toBe(0);
  });

  it("clamps values below the minimum", () => {
    expect(getKnobRotationDeg(-50, 0, 500)).toBe(-135);
  });

  it("clamps values above the maximum", () => {
    expect(getKnobRotationDeg(9999, 0, 500)).toBe(135);
  });

  it("handles a degenerate range (max <= min) without dividing by zero", () => {
    expect(getKnobRotationDeg(5, 10, 10)).toBe(-135);
  });

  it("works for a real Pitch Correction example (Response, 122ms of 0-500)", () => {
    expect(getKnobRotationDeg(122, 0, 500)).toBeCloseTo(-135 + (122 / 500) * 270, 6);
  });
});

describe("invertedKnobRotationDeg", () => {
  it("maps the minimum value to +135deg (the reversed sweep's start)", () => {
    expect(invertedKnobRotationDeg(0, 0, 25)).toBe(135);
  });

  it("maps the maximum value to -135deg (the reversed sweep's end)", () => {
    expect(invertedKnobRotationDeg(25, 0, 25)).toBe(-135);
  });

  it("maps the midpoint value to 0deg, same as the standard mapping", () => {
    expect(invertedKnobRotationDeg(12.5, 0, 25)).toBe(0);
  });

  it("clamps values below the minimum", () => {
    expect(invertedKnobRotationDeg(-5, 0, 25)).toBe(135);
  });

  it("clamps values above the maximum", () => {
    expect(invertedKnobRotationDeg(999, 0, 25)).toBe(-135);
  });

  it("handles a degenerate range (max <= min) without dividing by zero", () => {
    expect(invertedKnobRotationDeg(5, 10, 10)).toBe(135);
  });

  it("matches DeEsser 2's real Max Reduction example (20 of 0-25, high value -> small fill near the reversed start)", () => {
    expect(invertedKnobRotationDeg(20, 0, 25)).toBeCloseTo(135 - (20 / 25) * 270, 6);
  });

  it("is the mirror image of getKnobRotationDeg for the same value/range", () => {
    const value = 7;
    const min = 0;
    const max = 25;
    expect(invertedKnobRotationDeg(value, min, max)).toBeCloseTo(-getKnobRotationDeg(value, min, max), 6);
  });
});

describe("logKnobRotationDeg", () => {
  it("maps the minimum value to -135deg", () => {
    expect(logKnobRotationDeg(20, 20, 20000)).toBeCloseTo(-135, 6);
  });

  it("maps the maximum value to +135deg", () => {
    expect(logKnobRotationDeg(20000, 20, 20000)).toBeCloseTo(135, 6);
  });

  it("clamps values below the minimum", () => {
    expect(logKnobRotationDeg(1, 20, 20000)).toBeCloseTo(-135, 6);
  });

  it("clamps values above the maximum", () => {
    expect(logKnobRotationDeg(999999, 20, 20000)).toBeCloseTo(135, 6);
  });

  it("returns the minimum-stop angle for a degenerate or non-positive-floor range", () => {
    expect(logKnobRotationDeg(5, 10, 10)).toBe(-135);
    expect(logKnobRotationDeg(5, 0, 10)).toBe(-135);
  });

  it("matches Overdrive's real Tone example (980Hz of 20-20000Hz -> well past the linear mapping's ~5%)", () => {
    const linearFraction = (980 - 20) / (20000 - 20);
    const deg = logKnobRotationDeg(980, 20, 20000);
    expect(deg).toBeGreaterThan(-135 + linearFraction * 270 + 50);
  });

  it("defaults `floor` to `min`, unchanged from a plain log10 mapping", () => {
    const withDefault = logKnobRotationDeg(980, 20, 20000);
    const withExplicitFloor = logKnobRotationDeg(980, 20, 20000, 20);
    expect(withDefault).toBeCloseTo(withExplicitFloor, 6);
  });

  it("matches ChromaVerb's real Decay example (1.1s of 0.3-100s, fitted floor 0.06 -> ~39% of the sweep)", () => {
    const deg = logKnobRotationDeg(1.1, 0.3, 100, 0.06);
    const fraction = (deg - -135) / 270;
    expect(fraction).toBeCloseTo(0.39, 2);
  });

  it("a custom floor still clamps the printed value range to min/max, not the floor", () => {
    expect(logKnobRotationDeg(0.1, 0.3, 100, 0.06)).toBeCloseTo(logKnobRotationDeg(0.3, 0.3, 100, 0.06), 6);
  });

  it("matches Flanger's real Intensity case: a floor above min never produces -Infinity/NaN at the control's own registry min", () => {
    // Flanger's Intensity is 0-100% (min=0) with a fitted logFloor of 18.3 --
    // a plain `Math.max(min, value)` clamp lets `value=0` reach
    // Math.log10(0) = -Infinity. Regression for that bug: a value at or
    // below `min` should bottom out at the dial's minimum-stop angle, never
    // an infinite or NaN result.
    const deg = logKnobRotationDeg(0, 0, 100, 18.3);
    expect(deg).toBe(-135);
    expect(Number.isFinite(deg)).toBe(true);
  });
});
