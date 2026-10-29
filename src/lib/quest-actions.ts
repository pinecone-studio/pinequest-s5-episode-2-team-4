"use server";

// Daily quests: counting what has no other server action (free-play games)
// and claiming a finished quest's bonus.

import { addXp } from "./pets";
import { markQuestClaimed, questsWithProgress, recordQuestEvent } from "./quests";
import { readSession, writeSession } from "./session";
import { learningDay } from "./streak";

/** A free-play game reached its results: counts for today's quests. */
export async function recordGamePlayed() {
  const session = await readSession();
  if (session?.role !== "student") return;
  await writeSession({
    ...session,
    quests: recordQuestEvent(session.quests, "game"),
    gamesPlayed: (session.gamesPlayed ?? 0) + 1,
  });
}

export type ClaimResult = { ok: true; xp: number; coins: number } | { error: "notdone" | "claimed" | "failed" };

/** Claims a finished quest of today: its XP goes to the pet and its coins to the student, once. */
export async function claimQuest(questId: string): Promise<ClaimResult> {
  const session = await readSession();
  if (session?.role !== "student") return { error: "failed" };
  const today = learningDay();
  const quest = questsWithProgress(session.quests, Boolean(session.classCode), today).find((q) => q.id === questId);
  if (!quest?.done || !session.quests) return { error: "notdone" };
  if (quest.claimed) return { error: "claimed" };
  await writeSession({
    ...session,
    quests: markQuestClaimed(session.quests, quest.id),
    coins: (session.coins ?? 0) + quest.coins,
    pet: session.pet ? addXp(session.pet, quest.xp) : session.pet,
  });
  return { ok: true, xp: quest.xp, coins: quest.coins };
}
