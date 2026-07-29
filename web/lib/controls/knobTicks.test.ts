import { describe, expect, it } from "vitest";
import { niceTickValues } from "./knobTicks";

describe("niceTickValues", () => {
  it("always includes the exact min and max as ticks", () => {
    const ticks = niceTickValues(-60, 0);
    expect(ticks[0]).toBe(-60);
    expect(ticks[ticks.length - 1]).toBe(0);
  });

  it("picks a nice round step for a wide range (Compressor Threshold, -60..0)", () => {
    expect(niceTickValues(-60, 0)).toEqual([-60, -40, -20, 0]);
  });

  it("picks a nice round step for a narrow range (Compressor Ratio, 1..20)", () => {
    expect(niceTickValues(1, 20)).toEqual([1, 5, 10, 15, 20]);
  });

  it("handles a degenerate range (max <= min) without throwing", () => {
    expect(niceTickValues(5, 5)).toEqual([5]);
    expect(niceTickValues(10, 5)).toEqual([10]);
  });

  it("handles a sub-1 fractional range (Compressor Knee, 0.2..0.8)", () => {
    const ticks = niceTickValues(0.2, 0.8);
    expect(ticks[0]).toBe(0.2);
    expect(ticks[ticks.length - 1]).toBe(0.8);
    expect(ticks.length).toBeGreaterThan(2);
  });

  it("produces ticks that are non-decreasing", () => {
    const ticks = niceTickValues(-10, 0);
    for (let i = 1; i < ticks.length; i++) {
      expect(ticks[i]).toBeGreaterThanOrEqual(ticks[i - 1]);
    }
  });
});
