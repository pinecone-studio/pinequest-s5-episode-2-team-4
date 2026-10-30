import { describe, expect, it } from "vitest";
import { ACHIEVEMENTS, type AchievementStats, achievementList, newlyReached } from "./achievements";

const none: AchievementStats = {
  testTaken: 0,
  longestStreak: 0,
  practiceSolved: 0,
  mastered: 0,
  gamesPlayed: 0,
  bossWins: 0,
  eggsWon: 0,
  petsCollected: 0,
  petLevel: 0,
  videosSeen: 0,
  assignmentsDone: 0,
  questDays: 0,
};

describe("ACHIEVEMENTS", () => {
  it("has unique ids, positive goals and coins", () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
    expect(ACHIEVEMENTS.every((a) => a.goal > 0 && a.coins > 0)).toBe(true);
  });
});

describe("newlyReached", () => {
  it("finds nothing for a new student", () => {
    expect(newlyReached(none)).toEqual([]);
  });

  it("finds every goal the stats reach", () => {
    const ids = newlyReached({ ...none, bossWins: 10, longestStreak: 3 }).map((a) => a.id);
    expect(ids).toEqual(expect.arrayContaining(["boss-1", "boss-10", "streak-3"]));
    expect(ids).not.toContain("streak-7");
  });

  it("unlocks «Өдрийн баатар» after a day with all quests claimed", () => {
    expect(newlyReached({ ...none, questDays: 1 }).map((a) => a.id)).toEqual(["quests-all"]);
  });

  it("skips what is already unlocked", () => {
    const ids = newlyReached({ ...none, bossWins: 10 }, { "boss-1": "2026-10-01T00:00:00Z" }).map((a) => a.id);
    expect(ids).toEqual(["boss-10"]);
  });
});

describe("achievementList", () => {
  it("caps progress at the goal and marks unlocked ones", () => {
    const list = achievementList({ ...none, gamesPlayed: 25 }, { "games-10": "2026-10-29T08:00:00Z" });
    const games = list.find((a) => a.id === "games-10");
    expect(games).toMatchObject({ progress: 10, unlocked: true, unlockedAt: "2026-10-29T08:00:00Z" });
    expect(list.find((a) => a.id === "boss-1")).toMatchObject({ progress: 0, unlocked: false });
  });
});
