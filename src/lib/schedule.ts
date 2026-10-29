// Lesson schedule in Supabase (supabase/migrations/0018_lesson_schedule.sql):
// a class's lesson weekdays and the topic planned for a day. Until the
// migration runs, reads come back empty, so pages work without a schedule.

import "server-only";
import { getSupabaseAdmin } from "./supabase";
import type { LessonPlan } from "./types";

const db = () => getSupabaseAdmin();

/** The class's lesson weekdays (ISO, Monday = 1); none when unset or not migrated. */
export async function getLessonDays(classId: string): Promise<number[]> {
  const { data, error } = await db().from("classes").select("lesson_days").eq("id", classId).maybeSingle<{ lesson_days: number[] }>();
  if (error) {
    console.error(`Could not load lesson days: ${error.message}`);
    return [];
  }
  return data?.lesson_days ?? [];
}

/** Sets the lesson weekdays of a class the teacher owns. */
export async function setLessonDays(teacherId: string, classId: string, days: number[]) {
  const { error } = await db().from("classes").update({ lesson_days: days }).eq("id", classId).eq("teacher_id", teacherId);
  if (error) throw new Error(`Could not save lesson days: ${error.message}`);
}

/** Planned topics from `from` to `to` (days included), by day. */
export async function listPlans(classId: string, from: string, to: string): Promise<LessonPlan[]> {
  const { data, error } = await db()
    .from("lesson_plans")
    .select("day, topic_key, topic_title")
    .eq("class_id", classId)
    .gte("day", from)
    .lte("day", to)
    .order("day")
    .returns<{ day: string; topic_key: string; topic_title: string }[]>();
  if (error) {
    console.error(`Could not load lesson plans: ${error.message}`);
    return [];
  }
  return data.map((r) => ({ day: r.day, topicKey: r.topic_key, topicTitle: r.topic_title }));
}

/** Plans (or replaces) the topic of one lesson day. */
export async function savePlan(classId: string, plan: LessonPlan) {
  const { error } = await db()
    .from("lesson_plans")
    .upsert(
      { class_id: classId, day: plan.day, topic_key: plan.topicKey, topic_title: plan.topicTitle, updated_at: new Date().toISOString() },
      { onConflict: "class_id,day" },
    );
  if (error) throw new Error(`Could not save lesson plan: ${error.message}`);
}

export async function deletePlan(classId: string, day: string) {
  const { error } = await db().from("lesson_plans").delete().eq("class_id", classId).eq("day", day);
  if (error) throw new Error(`Could not delete lesson plan: ${error.message}`);
}
