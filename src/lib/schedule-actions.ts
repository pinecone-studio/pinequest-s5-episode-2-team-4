"use server";

// Server Functions for the teacher's lesson schedule. Only the teacher's open
// class is changed; demo classes aren't stored, so nothing is saved for them.

import { refresh } from "next/cache";
import { requireTeacher } from "./auth";
import { getActiveClass } from "./data";
import { customTopicKey, isTopicKey, topicTitle, TOPIC_TITLE_MAX } from "./lesson-topics";
import { deletePlan, savePlan, setLessonDays } from "./schedule";
import { learningDay, shiftDay } from "./streak";

/** noclass: no class picked (or a demo class); invalid: a bad day or topic; failed: try again. */
export type ScheduleResult = { ok: true } | { error: "noclass" | "invalid" | "failed" };

async function editableClass() {
  const user = await requireTeacher();
  const active = await getActiveClass();
  return active && active.id !== "demo" && !user.demo ? { user, active } : undefined;
}

/** A day that can be planned: today up to four months ahead. */
const plannable = (day: unknown): day is string =>
  typeof day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(day) && day >= learningDay() && day <= shiftDay(learningDay(), 120);

/** Sets the weekdays the open class has the lesson (ISO, Monday = 1). */
export async function setLessonDaysAction(days: number[]): Promise<ScheduleResult> {
  const found = await editableClass();
  if (!found) return { error: "noclass" };
  const clean = [...new Set((Array.isArray(days) ? days : []).filter((d) => Number.isInteger(d) && d >= 1 && d <= 7))].sort();
  try {
    await setLessonDays(found.user.id, found.active.id, clean);
  } catch (error) {
    console.error(error);
    return { error: "failed" };
  }
  refresh();
  return { ok: true };
}

/** Plans a day's topic: a curriculum lesson (`key`) or the teacher's own text (`title`). */
export async function planLessonAction(day: string, topic: { key?: string; title?: string }): Promise<ScheduleResult> {
  const found = await editableClass();
  if (!found) return { error: "noclass" };
  const typed = typeof topic?.title === "string" ? topic.title.trim().slice(0, TOPIC_TITLE_MAX) : "";
  const key = typed ? customTopicKey(typed) : topic?.key;
  if (!plannable(day) || !isTopicKey(key)) return { error: "invalid" };
  try {
    await savePlan(found.active.id, { day, topicKey: key, topicTitle: topicTitle(key)! });
  } catch (error) {
    console.error(error);
    return { error: "failed" };
  }
  refresh();
  return { ok: true };
}

/** Takes the topic off a day; the students then pick it themselves. */
export async function clearLessonAction(day: string): Promise<ScheduleResult> {
  const found = await editableClass();
  if (!found) return { error: "noclass" };
  if (!plannable(day)) return { error: "invalid" };
  try {
    await deletePlan(found.active.id, day);
  } catch (error) {
    console.error(error);
    return { error: "failed" };
  }
  refresh();
  return { ok: true };
}
