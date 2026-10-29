"use server";

// Daily quests: counting what has no other server action (free-play games).

import { recordQuestEvent } from "./quests";
import { readSession, writeSession } from "./session";

/** A free-play game reached its results: counts for today's quests. */
export async function recordGamePlayed() {
  const session = await readSession();
  if (session?.role !== "student") return;
  await writeSession({ ...session, quests: recordQuestEvent(session.quests, "game") });
}
