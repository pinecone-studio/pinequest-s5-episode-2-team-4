"use server";

// What's in the student's class now, polled by ClassNewsWatcher so a lesson
// video or assignment the teacher just sent shows up as a notification.

import { getClassVideos, getStudentAssignments } from "./data";
import { readSession } from "./session";

export type ClassNews = {
  videos: { id: string; title: string }[];
  assignments: { id: string; title: string }[];
};

/** The class's published videos and the student's assignments, newest first; empty for anyone else. */
export async function classNews(): Promise<ClassNews> {
  const session = await readSession();
  if (session?.role !== "student" || !session.classCode) return { videos: [], assignments: [] };
  const [videos, assignments] = await Promise.all([getClassVideos(), getStudentAssignments()]);
  return {
    videos: videos.map((v) => ({ id: v.id, title: v.title })),
    assignments: assignments.map((a) => ({ id: a.id, title: a.title })),
  };
}
