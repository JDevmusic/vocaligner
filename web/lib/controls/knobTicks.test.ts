import { describe, expect, it } from "vitest";
import { niceTickValues } from "./knobTicks";

describe("niceTickValues", () => {
  it("always includes the exact min and max as ticks", () => {
    const ticks = niceTickValues(-50, 0);
    expect(ticks[0]).toBe(-50);
    expect(ticks[ticks.length - 1]).toBe(0);
  });

  it("picks a nice round step for a wide range (Compressor Threshold, -50..0)", () => {
    expect(niceTickValues(-50, 0)).toEqual([-50, -40, -30, -20, -10, 0]);
  });

  it("picks a nice round step for a narrow range (Compressor Ratio, 1..30)", () => {
    expect(niceTickValues(1, 30)).toEqual([1, 10, 20, 30]);
  });

  it("handles a degenerate range (max <= min) without throwing", () => {
    expect(niceTickValues(5, 5)).toEqual([5]);
    expect(niceTickValues(10, 5)).toEqual([10]);
  });

  it("handles a sub-1 fractional range (Compressor Knee, 0..1)", () => {
    const ticks = niceTickValues(0, 1);
    expect(ticks[0]).toBe(0);
    expect(ticks[ticks.length - 1]).toBe(1);
    expect(ticks.length).toBeGreaterThan(2);
  });

  it("produces ticks that are non-decreasing", () => {
    const ticks = niceTickValues(-10, 0);
    for (let i = 1; i < ticks.length; i++) {
      expect(ticks[i]).toBeGreaterThanOrEqual(ticks[i - 1]);
    }
  });
});
