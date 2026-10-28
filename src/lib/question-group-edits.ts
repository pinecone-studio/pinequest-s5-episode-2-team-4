// The teacher's changes to question groups: rename, merge and answer. Every
// change is limited to the teacher's own class.

import "server-only";
import { getSupabaseAdmin } from "./supabase";
import type { AnswerMaterial, QuestionAnswer } from "./types";

const db = () => getSupabaseAdmin();

/** Same limit as the question_groups.title check. */
const MAX_TITLE_LENGTH = 120;
export const MAX_ANSWER_LENGTH = 1000;

type Group = {
  id: string;
  subtopic_id: string;
  status: "pending" | "answered";
  answer: string | null;
  material: AnswerMaterial | null;
};

async function findGroup(classCode: string, id: string): Promise<Group> {
  const { data, error } = await db()
    .from("question_groups")
    .select("id, subtopic_id, status, answer, material")
    .match({ id, class_code: classCode })
    .maybeSingle<Group>();
  if (error) throw new Error(`Could not load the group: ${error.message}`);
  if (!data) throw new Error("No such group in this class");
  return data;
}

const teacherAnswer = (text: string, material: AnswerMaterial | null): QuestionAnswer => ({
  by: "teacher",
  text,
  approved: true,
  kudos: 0,
  ...(material && { material }),
});

/** The answer a question joining this group should get, if the teacher already answered it. */
export async function groupAnswer(groupId: string): Promise<QuestionAnswer | null> {
  const { data, error } = await db()
    .from("question_groups")
    .select("status, answer, material")
    .eq("id", groupId)
    .maybeSingle<Pick<Group, "status" | "answer" | "material">>();
  if (error) throw new Error(`Could not load the group answer: ${error.message}`);
  return data?.status === "answered" && data.answer ? teacherAnswer(data.answer, data.material) : null;
}

/** Gives every question in the group the teacher's answer. */
async function shareAnswer(groupId: string, text: string, material: AnswerMaterial | null) {
  const { error } = await db()
    .from("anon_questions")
    .update({ answer: teacherAnswer(text, material) })
    .eq("group_id", groupId);
  if (error) throw new Error(`Could not send the answer: ${error.message}`);
}

export async function renameGroup(classCode: string, id: string, title: string) {
  await findGroup(classCode, id);
  const { error } = await db()
    .from("question_groups")
    .update({ title: title.slice(0, MAX_TITLE_LENGTH), source: "teacher", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`Could not rename the group: ${error.message}`);
}

/** Moves `fromId`'s questions into `intoId` (same lesson) and removes `fromId`. */
export async function mergeGroups(classCode: string, fromId: string, intoId: string) {
  if (fromId === intoId) throw new Error("Cannot merge a group into itself");
  const [from, into] = await Promise.all([findGroup(classCode, fromId), findGroup(classCode, intoId)]);
  if (from.subtopic_id !== into.subtopic_id) throw new Error("Groups are from different lessons");

  const moved = await db().from("anon_questions").update({ group_id: intoId }).eq("group_id", fromId);
  if (moved.error) throw new Error(`Could not move the questions: ${moved.error.message}`);
  // The moved questions get the answer the class already has.
  if (into.status === "answered" && into.answer) await shareAnswer(intoId, into.answer, into.material);
  const removed = await db().from("question_groups").delete().eq("id", fromId);
  if (removed.error) throw new Error(`Could not remove the old group: ${removed.error.message}`);
}

/** One answer for the whole group, with optional material; students see it beside the lesson. */
export async function answerGroup(classCode: string, id: string, text: string, material: AnswerMaterial | null) {
  await findGroup(classCode, id);
  const answer = text.slice(0, MAX_ANSWER_LENGTH);
  const { error } = await db()
    .from("question_groups")
    .update({ status: "answered", answer, material, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`Could not save the answer: ${error.message}`);
  await shareAnswer(id, answer, material);
}
