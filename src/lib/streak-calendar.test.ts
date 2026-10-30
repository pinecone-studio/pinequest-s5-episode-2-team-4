import { describe, expect, it } from "vitest";
import { calendarCells, shiftCalendarMonth } from "./streak-calendar";
import { recordLearningDay, streakSummary } from "./streak";

describe("streak month calendar", () => {
  it("uses Monday-first weeks and correct leap-year dates", () => {
    const leap = calendarCells("2028-02");
    expect(leap[0]).toBeNull();
    expect(leap[1]).toBe("2028-02-01");
    expect(leap.filter(Boolean)).toHaveLength(29);
    expect(calendarCells("2027-02").filter(Boolean)).toHaveLength(28);
    expect(leap.length % 7).toBe(0);
  });
  it("moves across years", () => {
    expect(shiftCalendarMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftCalendarMonth("2026-12", 1)).toBe("2027-01");
  });
  it("keeps activity older than a week while preserving the weekly summary", () => {
    const first = recordLearningDay(undefined, "2026-10-01");
    const next = recordLearningDay(first, "2026-10-29");
    const summary = streakSummary(next, "2026-10-29");
    expect(summary.calendar.activeDates).toEqual(["2026-10-01", "2026-10-29"]);
    expect(summary.days).toHaveLength(7);
    expect(summary.days.filter((day) => day.active)).toHaveLength(1);
    expect(summary.current).toBe(1);
  });
  it("trims history beyond the one-year retention window", () => {
    const first = recordLearningDay(undefined, "2025-01-01");
    const next = recordLearningDay(first, "2026-10-29");
    expect(next.recentDays).toEqual(["2026-10-29"]);
    expect(next.historyStart).toBe("2025-10-29");
  });
  it("supports existing seven-day records without inventing earlier activity", () => {
    const old = { current: 20, longest: 20, lastDate: "2026-10-29", recentDays: ["2026-10-28", "2026-10-29"] };
    const summary = streakSummary(old, "2026-10-29");
    expect(summary.calendar.availableFrom).toBe("2026-10-28");
    expect(summary.calendar.activeDates).toEqual(old.recentDays);
    expect(recordLearningDay(old, "2026-10-30").historyStart).toBe("2026-10-28");
  });
  it("starts an empty calendar at today", () => {
    expect(streakSummary(undefined, "2026-10-29").calendar).toEqual({ today: "2026-10-29", activeDates: [], availableFrom: "2026-10-29" });
  });
});
