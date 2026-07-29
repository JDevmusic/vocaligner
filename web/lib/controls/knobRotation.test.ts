import { describe, expect, it } from "vitest";
import { getKnobRotationDeg } from "./knobRotation";

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
