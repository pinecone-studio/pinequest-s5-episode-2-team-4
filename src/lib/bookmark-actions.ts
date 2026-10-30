"use server";

import { revalidatePath } from "next/cache";
import { getClassVideo } from "./data";
import { readSession, writeSession } from "./session";

/** Explicit state makes retries idempotent; only published own-class videos can be saved. */
export async function setVideoBookmark(videoId: string, saved: boolean): Promise<{ saved: boolean } | { error: string }> {
  const session = await readSession();
  if (session?.role !== "student") return { error: "Хичээл хадгалахын тулд сурагчаар нэвтэрнэ үү." };
  if (typeof videoId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(videoId) || typeof saved !== "boolean") return { error: "Хичээлийн мэдээлэл буруу байна." };
  if (saved && !(await getClassVideo(videoId))) return { error: "Энэ хичээлийг хадгалах боломжгүй байна." };
  const bookmarks = session.bookmarkedVideos ?? [];
  if (bookmarks.includes(videoId) !== saved) {
    await writeSession({ ...session, bookmarkedVideos: saved ? [...bookmarks, videoId] : bookmarks.filter((id) => id !== videoId) });
  }
  revalidatePath("/videos");
  revalidatePath(`/videos/${videoId}`);
  return { saved };
}
