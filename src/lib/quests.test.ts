import { describe, expect, it } from "vitest";
import { CLASS_ONLY_EVENTS, allQuestsClaimed, dailyQuests, markQuestClaimed, questsWithProgress, recordQuestEvent } from "./quests";

describe("dailyQuests", () => {
  it("picks three quests, each about a different activity", () => {
    const quests = dailyQuests("2026-10-29", true);
    expect(quests).toHaveLength(3);
    expect(new Set(quests.map((q) => q.event)).size).toBe(3);
  });

  it("is the same for everyone on a day and changes between days", () => {
    expect(dailyQuests("2026-10-29", true)).toEqual(dailyQuests("2026-10-29", true));
    const days = ["2026-10-29", "2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02"];
    const sets = new Set(days.map((d) => dailyQuests(d, true).map((q) => q.id).join()));
    expect(sets.size).toBeGreaterThan(1);
  });

  it("leaves out video and assignment quests for students in no class", () => {
    for (let d = 1; d <= 28; d++) {
      const day = `2026-02-${String(d).padStart(2, "0")}`;
      expect(dailyQuests(day, false).some((q) => CLASS_ONLY_EVENTS.includes(q.event))).toBe(false);
    }
  });
});

describe("recordQuestEvent", () => {
  it("counts events for the day", () => {
    let log = recordQuestEvent(undefined, "game", "2026-10-29");
    log = recordQuestEvent(log, "game", "2026-10-29");
    log = recordQuestEvent(log, "practice", "2026-10-29");
    expect(log).toEqual({ day: "2026-10-29", counts: { game: 2, practice: 1 }, claimed: [] });
  });

  it("starts over on a new day", () => {
    const yesterday = { day: "2026-10-28", counts: { game: 5 }, claimed: ["game-1"] };
    expect(recordQuestEvent(yesterday, "video", "2026-10-29")).toEqual({
      day: "2026-10-29",
      counts: { video: 1 },
      claimed: [],
    });
  });
});

describe("questsWithProgress", () => {
  const day = "2026-10-29";
  const quests = dailyQuests(day, true);

  it("caps progress at the goal and marks done and claimed quests", () => {
    const [first, second] = quests;
    const log = {
      day,
      counts: { [first.event]: first.goal + 4, [second.event]: 0 },
      claimed: [first.id],
    };
    const [a, b] = questsWithProgress(log, true, day);
    expect(a).toMatchObject({ id: first.id, progress: first.goal, done: true, claimed: true });
    expect(b).toMatchObject({ id: second.id, progress: 0, done: false, claimed: false });
  });

  it("ignores a log from another day", () => {
    const old = { day: "2026-10-28", counts: { game: 9, practice: 9, battle: 9, video: 9, assignment: 9 }, claimed: [] };
    expect(questsWithProgress(old, true, day).every((q) => q.progress === 0 && !q.done)).toBe(true);
  });
});

describe("markQuestClaimed", () => {
  it("adds the quest once", () => {
    const log = { day: "2026-10-29", counts: { game: 1 }, claimed: [] };
    const once = markQuestClaimed(log, "game-1");
    expect(once.claimed).toEqual(["game-1"]);
    expect(markQuestClaimed(once, "game-1")).toBe(once);
  });
});

describe("allQuestsClaimed", () => {
  const day = "2026-10-29";
  const ids = dailyQuests(day, true).map((q) => q.id);

  it("is true only once all three of the day's quests are claimed", () => {
    const log = { day, counts: {}, claimed: ids.slice(0, 2) };
    expect(allQuestsClaimed(log, true, day)).toBe(false);
    expect(allQuestsClaimed({ ...log, claimed: ids }, true, day)).toBe(true);
  });

  it("is false for a log from another day", () => {
    expect(allQuestsClaimed({ day: "2026-10-28", counts: {}, claimed: ids }, true, day)).toBe(false);
  });
});
