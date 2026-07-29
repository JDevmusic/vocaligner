import { describe, expect, it } from "vitest";
import { getScaleNotes } from "./scaleIntervals";

describe("getScaleNotes", () => {
  it("computes C Major -- coincidentally the white keys, not proof the mapping works on its own", () => {
    expect(getScaleNotes("C", "Major Scale")).toEqual(new Set(["C", "D", "E", "F", "G", "A", "B"]));
  });

  it("computes G Major, which includes a black key (F#) -- the real test that the lookup generalizes", () => {
    expect(getScaleNotes("G", "Major Scale")).toEqual(new Set(["G", "A", "B", "C", "D", "E", "F#"]));
  });

  it("computes E Min7 (root not C/G, non-Major scale)", () => {
    expect(getScaleNotes("E", "Min7")).toEqual(new Set(["E", "G", "B", "D"]));
  });

  it("computes D Natural Minor (Aeolian), which includes a black key (A#) on a non-C/G root", () => {
    expect(getScaleNotes("D", "Natural Minor Scale (Aeolian)")).toEqual(
      new Set(["D", "E", "F", "G", "A", "A#", "C"])
    );
  });

  it("computes Chromatic Scale as all 12 notes regardless of root", () => {
    const notes = getScaleNotes("C", "Chromatic Scale");
    expect(notes.size).toBe(12);
  });

  it("Drone is root + a fifth, not root-only (confirmed against Apple's documentation)", () => {
    expect(getScaleNotes("C", "Drone")).toEqual(new Set(["C", "G"]));
  });

  it("Single is root-only", () => {
    expect(getScaleNotes("C", "Single")).toEqual(new Set(["C"]));
  });

  it("returns an empty set for an unrecognised root or scale rather than throwing", () => {
    expect(getScaleNotes("None", "Major Scale")).toEqual(new Set());
    expect(getScaleNotes("C", "Not A Real Scale")).toEqual(new Set());
  });
});
