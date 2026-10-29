"use server";

// Server Functions for the «Ойлгосон уу?» check: beside an app lesson, and
// for the day's class lesson on the home page. The student must be logged
// in, but who sent a signal is never stored.

import { requireStudent } from "./auth";
import { isTopicKey } from "./lesson-topics";
import { readSession, writeSession } from "./session";
import { saveSignal, signalsStored } from "./signals";
import { learningDay } from "./streak";
import type { SignalLevel } from "./types";

const LEVELS: SignalLevel[] = ["got", "unsure", "lost"];

/** noclass: the student has no class code, so there is no teacher to send it to. */
export type SignalResult = { ok: true } | { error: "noclass" | "failed" };

/**
 * Sends (or changes) the student's signal for a lesson today, for their
 * class's teacher. `subtopicId` is an app lesson or a class lesson topic.
 */
export async function sendSignal(subtopicId: string, level: SignalLevel): Promise<SignalResult> {
  const user = await requireStudent();
  if (!isTopicKey(subtopicId) || !LEVELS.includes(level)) {
    return { error: "failed" };
  }
  // Demo teachers see the sample lesson, so demo signals aren't stored.
  if (user.demo || !signalsStored()) return { ok: true };
  if (!user.classCode) return { error: "noclass" };
  try {
    await saveSignal(
      { classCode: user.classCode, subtopicId, day: learningDay(), studentId: user.id },
      level,
    );
    return { ok: true };
  } catch (error) {
    console.error(error);
    return { error: "failed" };
  }
}

/** «Ойлгосон уу?» for today's class lesson; remembered so the home card shows the answer. */
export async function sendLessonSignal(topicKey: string, level: SignalLevel): Promise<SignalResult> {
  const result = await sendSignal(topicKey, level);
  if ("error" in result) return result;
  const session = await readSession();
  if (session) await writeSession({ ...session, lessonCheck: { day: learningDay(), topicKey, level } });
  return result;
}
