import { describe, expect, it } from "vitest";
import {
  learningDay,
  recordLearningDay,
  shiftDay,
  streakSummary,
} from "./streak";

describe("learningDay", () => {
  it("uses the Ulaanbaatar date, not UTC", () => {
    // 20:00 UTC is already the next day in UTC+8.
    expect(learningDay(new Date("2026-03-01T20:00:00Z"))).toBe("2026-03-02");
  });
});

describe("shiftDay", () => {
  it("moves across month and year boundaries", () => {
    expect(shiftDay("2026-03-01", -1)).toBe("2026-02-28");
    expect(shiftDay("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("recordLearningDay", () => {
  it("starts a streak of 1", () => {
    const s = recordLearningDay(undefined, "2026-03-10");
    expect(s.current).toBe(1);
    expect(s.longest).toBe(1);
  });

  it("extends the streak on consecutive days", () => {
    const first = recordLearningDay(undefined, "2026-03-10");
    const second = recordLearningDay(first, "2026-03-11");
    expect(second.current).toBe(2);
    expect(second.longest).toBe(2);
  });

  it("resets after a missed day but keeps the longest", () => {
    const a = recordLearningDay(recordLearningDay(undefined, "2026-03-10"), "2026-03-11");
    const b = recordLearningDay(a, "2026-03-14");
    expect(b.current).toBe(1);
    expect(b.longest).toBe(2);
  });

  it("is a no-op when the day was already recorded", () => {
    const a = recordLearningDay(undefined, "2026-03-10");
    expect(recordLearningDay(a, "2026-03-10")).toBe(a);
  });
});

describe("streakSummary", () => {
  it("counts a streak that ended yesterday as still alive", () => {
    const s = recordLearningDay(undefined, "2026-03-10");
    const summary = streakSummary(s, "2026-03-11");
    expect(summary.current).toBe(1);
    expect(summary.activeToday).toBe(false);
  });

  it("drops the current streak after a missed day", () => {
    const s = recordLearningDay(undefined, "2026-03-10");
    expect(streakSummary(s, "2026-03-12").current).toBe(0);
  });
});
