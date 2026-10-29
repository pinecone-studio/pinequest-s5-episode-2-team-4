"use server";

import { readSession, writeSession } from "./session";
import { recordLearningDay } from "./streak";

/** Visiting or using any student page counts once per Ulaanbaatar day. */
export async function recordSiteActivity() {
  const session = await readSession();
  if (!session || session.role !== "student") return undefined;
  const streak = recordLearningDay(session.streak);
  if (streak !== session.streak) await writeSession({ ...session, streak });
  return { date: streak.lastDate };
}
