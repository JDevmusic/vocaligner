import { describe, expect, it } from "vitest";
import { getKnobRotationDeg, invertedKnobRotationDeg } from "./knobRotation";

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
