import { describe, expect, it } from "vitest";
import { nextStep, share, summarizeRow } from "./class-results";
import type { HeatmapStatus } from "./types";

// One letter per student: W weak, L learning, G good, - not tested.
const codes: Record<string, HeatmapStatus> = { W: "weak", L: "learning", G: "good", "-": "untested" };
const row = (subtopicId: string, s: string) => ({
  subtopicId,
  cells: s.split("").map((c) => codes[c]),
});

describe("share", () => {
  it("rounds to a whole percent", () => {
    expect(share(1, 3)).toBe(33);
    expect(share(2, 3)).toBe(67);
  });

  it("is 0 instead of dividing by zero", () => {
    expect(share(0, 0)).toBe(0);
  });
});

describe("summarizeRow", () => {
  it("counts and shares only the students who took the test", () => {
    const result = summarizeRow(row("same-denominator", "WWLLLGGGGG--"));
    expect(result.tested).toBe(10);
    expect(result.counts).toEqual({ weak: 2, learning: 3, good: 5 });
    expect(result.shares).toEqual({ weak: 20, learning: 30, good: 50 });
  });

  it("handles a class where nobody took the test", () => {
    const result = summarizeRow(row("same-denominator", "----"));
    expect(result.tested).toBe(0);
    expect(result.shares).toEqual({ weak: 0, learning: 0, good: 0 });
    expect(result.step).toBe("few");
  });
});

describe("nextStep", () => {
  it("gives no verdict with too few results", () => {
    expect(nextStep({ weak: 4, learning: 0, good: 0 }, 4)).toBe("few");
  });

  it("asks to explain again when many students are weak", () => {
    expect(nextStep({ weak: 4, learning: 1, good: 5 }, 10)).toBe("reexplain");
  });

  it("suggests a review when weak and learning add up", () => {
    expect(nextStep({ weak: 1, learning: 3, good: 6 }, 10)).toBe("review");
  });

  it("suggests a review when a fifth of the class is weak", () => {
    expect(nextStep({ weak: 8, learning: 2, good: 18 }, 28)).toBe("review");
  });

  it("moves on when most students are good", () => {
    expect(nextStep({ weak: 1, learning: 2, good: 7 }, 10)).toBe("next");
  });
});
