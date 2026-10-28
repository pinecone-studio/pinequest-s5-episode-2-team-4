"use server";

// Server Function for the «Ойлгосон уу?» check beside a lesson. The student
// must be logged in, but who sent a signal is never stored.

import { requireStudent } from "./auth";
import { subtopics } from "./mock/topics";
import { saveSignal, signalsStored } from "./signals";
import { learningDay } from "./streak";
import type { SignalLevel } from "./types";

const LEVELS: SignalLevel[] = ["got", "unsure", "lost"];

/** noclass: the student has no class code, so there is no teacher to send it to. */
export type SignalResult = { ok: true } | { error: "noclass" | "failed" };

/** Sends (or changes) the student's signal for a lesson today, for their class's teacher. */
export async function sendSignal(subtopicId: string, level: SignalLevel): Promise<SignalResult> {
  const user = await requireStudent();
  if (!subtopics.some((s) => s.id === subtopicId) || !LEVELS.includes(level)) {
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
