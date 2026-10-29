"use server";

// A student opening a lesson video: it stops counting as new in the menu and
// counts for today's quests.

import { getClassVideo } from "./data";
import { recordQuestEvent } from "./quests";
import { readSession, writeSession } from "./session";

/** Keeps the list short; older ids are of videos long since watched. */
const MAX_SEEN = 300;

export async function markVideoSeen(videoId: string) {
  const session = await readSession();
  if (session?.role !== "student") return;
  // Only a published video of the student's own class.
  if (!(await getClassVideo(videoId))) return;
  const seen = session.videosSeen ?? [];
  await writeSession({
    ...session,
    videosSeen: seen.includes(videoId) ? seen : [...seen, videoId].slice(-MAX_SEEN),
    // Watching counts for today's quests even when the video isn't new.
    quests: recordQuestEvent(session.quests, "video"),
  });
}
