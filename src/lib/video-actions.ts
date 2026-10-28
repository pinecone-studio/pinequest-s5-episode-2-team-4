"use server";

// A student opening a lesson video: it stops counting as new in the menu.

import { getClassVideo } from "./data";
import { readSession, writeSession } from "./session";

/** Keeps the list short; older ids are of videos long since watched. */
const MAX_SEEN = 300;

export async function markVideoSeen(videoId: string) {
  const session = await readSession();
  if (session?.role !== "student" || (session.videosSeen ?? []).includes(videoId)) return;
  // Only a published video of the student's own class.
  if (!(await getClassVideo(videoId))) return;
  await writeSession({ ...session, videosSeen: [...(session.videosSeen ?? []), videoId].slice(-MAX_SEEN) });
}
