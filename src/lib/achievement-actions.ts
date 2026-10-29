"use server";

// Achievements: unlocking what the student has newly reached, with its coins.

import { newlyReached } from "./achievements";
import { getAchievementStats } from "./data";
import { readSession, writeSession } from "./session";

export type Unlocked = { id: string; emoji: string; title: string; coins: number };

/**
 * Unlocks every achievement the student has newly reached and adds their
 * coins, once each. Returns what was unlocked now (empty most of the time).
 */
export async function checkAchievements(): Promise<Unlocked[]> {
  const [session, stats] = await Promise.all([readSession(), getAchievementStats()]);
  if (session?.role !== "student" || !stats) return [];
  const reached = newlyReached(stats, session.achievements);
  if (!reached.length) return [];
  const now = new Date().toISOString();
  await writeSession({
    ...session,
    achievements: { ...session.achievements, ...Object.fromEntries(reached.map((a) => [a.id, now])) },
    coins: (session.coins ?? 0) + reached.reduce((sum, a) => sum + a.coins, 0),
  });
  return reached.map(({ id, emoji, title, coins }) => ({ id, emoji, title, coins }));
}
