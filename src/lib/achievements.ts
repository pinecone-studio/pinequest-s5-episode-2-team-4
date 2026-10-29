// Achievements: milestones counted from what the student has done so far.
// Each unlocks once and gives its coins.

import type { Achievement, AchievementProgress, AchievementStat } from "./types";

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-test", icon: "memo", title: "Анхны тест", description: "Оношлох тестээ өг", stat: "testTaken", goal: 1, coins: 20 },
  { id: "streak-3", icon: "fire", title: "Гурван өдөр", description: "3 өдөр дараалан суралц", stat: "longestStreak", goal: 3, coins: 30 },
  { id: "streak-7", icon: "star", title: "Долоо хоногийн од", description: "7 өдөр дараалан суралц", stat: "longestStreak", goal: 7, coins: 70 },
  { id: "practice-10", icon: "pencil", title: "Дасгалч", description: "10 дасгалыг зөв бод", stat: "practiceSolved", goal: 10, coins: 40 },
  { id: "mastered-1", icon: "cap", title: "Анхны эзэмшил", description: "Нэг сэдвийг бүрэн эзэмш", stat: "mastered", goal: 1, coins: 50 },
  { id: "games-10", icon: "gamepad", title: "Тоглоомчин", description: "10 тоглоом тогло", stat: "gamesPlayed", goal: 10, coins: 30 },
  { id: "boss-1", icon: "swords", title: "Анхны ялалт", description: "Боссыг анх удаа ял", stat: "bossWins", goal: 1, coins: 30 },
  { id: "boss-10", icon: "trophy", title: "Боссын анчин", description: "10 боссыг ял", stat: "bossWins", goal: 10, coins: 100 },
  { id: "egg-1", icon: "egg", title: "Анхны өндөг", description: "Тулаанаас өндөг ол", stat: "eggsWon", goal: 1, coins: 30 },
  { id: "pets-5", icon: "pawprint", title: "Цуглуулагч", description: "5 тэжээвэртэй бол", stat: "petsCollected", goal: 5, coins: 80 },
  { id: "level-5", icon: "dumbbell", title: "Хүчирхэг тэжээвэр", description: "Тэжээврээ 5-р түвшинд хүргэ", stat: "petLevel", goal: 5, coins: 60 },
  { id: "videos-5", icon: "clapper", title: "Видео сонирхогч", description: "5 хичээлийн видео үз", stat: "videosSeen", goal: 5, coins: 30 },
  { id: "assignments-3", icon: "clipboard", title: "Хичээнгүй", description: "Багшийн 3 даалгавар биелүүл", stat: "assignmentsDone", goal: 3, coins: 50 },
];

export type AchievementStats = Record<AchievementStat, number>;

/** Every achievement with progress (capped at its goal) and whether it's unlocked. */
export function achievementList(stats: AchievementStats, unlocked: Record<string, string> = {}): AchievementProgress[] {
  return ACHIEVEMENTS.map((a) => ({
    ...a,
    progress: Math.min(a.goal, stats[a.stat]),
    unlocked: a.id in unlocked,
    unlockedAt: unlocked[a.id],
  }));
}

/** Achievements the stats now reach that aren't unlocked yet. */
export function newlyReached(stats: AchievementStats, unlocked: Record<string, string> = {}): Achievement[] {
  return ACHIEVEMENTS.filter((a) => !(a.id in unlocked) && stats[a.stat] >= a.goal);
}
