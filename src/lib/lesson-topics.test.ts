import { describe, expect, it } from "vitest";
import {
  curriculumTopics,
  customTopicKey,
  isTopicKey,
  isoWeekday,
  recentWeeks,
  topicTitle,
  upcomingLessonDays,
} from "./lesson-topics";

describe("lesson topics", () => {
  it("lists the Grade 7 math curriculum with keys that resolve to their titles", () => {
    const topics = curriculumTopics("math", 7);
    expect(topics.length).toBeGreaterThan(10);
    for (const t of topics) expect(topicTitle(t.key)).toBe(t.title);
    expect(curriculumTopics("hist", 7)).toEqual([]);
  });

  it("keeps the teacher's own topic in its key", () => {
    const key = customTopicKey("  Пифагорын   теорем ");
    expect(key).toBe("t:Пифагорын теорем");
    expect(topicTitle(key)).toBe("Пифагорын теорем");
  });

  it("knows app lessons and rejects unknown keys", () => {
    expect(isTopicKey("same-denominator")).toBe(true);
    expect(isTopicKey("m7.99.1")).toBe(false);
    expect(isTopicKey("t:")).toBe(false);
    expect(isTopicKey(42)).toBe(false);
  });
});

describe("lesson days", () => {
  it("gives ISO weekdays", () => {
    expect(isoWeekday("2026-10-26")).toBe(1); // Monday
    expect(isoWeekday("2026-11-01")).toBe(7); // Sunday
  });

  it("lists school weeks back from today, the current one ending today", () => {
    // Wednesday 28 October 2026.
    expect(recentWeeks("2026-10-28", 3)).toEqual([
      { from: "2026-10-26", to: "2026-10-28" },
      { from: "2026-10-19", to: "2026-10-25" },
      { from: "2026-10-12", to: "2026-10-18" },
    ]);
    // A Sunday belongs to the week before it.
    expect(recentWeeks("2026-11-01", 1)).toEqual([{ from: "2026-10-26", to: "2026-11-01" }]);
  });

  it("finds the next lesson days from today", () => {
    // Monday, Wednesday, Friday from Wednesday 28 October 2026.
    expect(upcomingLessonDays("2026-10-28", [1, 3, 5], 4)).toEqual(["2026-10-28", "2026-10-30", "2026-11-02", "2026-11-04"]);
    expect(upcomingLessonDays("2026-10-28", [], 4)).toEqual([]);
  });
});
