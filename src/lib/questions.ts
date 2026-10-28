// Anonymous questions and their groups in Supabase (see
// supabase/migrations/0011_anon_questions.sql). No student id is stored with
// a question.

import "server-only";
import { normalizeQuestion } from "./question-text";
import { getSupabaseAdmin } from "./supabase";
import type { AnonQuestion, QuestionAnswer, QuestionGroup } from "./types";

const db = () => getSupabaseAdmin();

type QuestionRow = {
  id: string;
  subtopic_id: string;
  text: string;
  me_too: number;
  group_id: string | null;
  answer: QuestionAnswer | null;
  created_at: string;
};

type GroupRow = { id: string; subtopic_id: string; title: string };

/** True when the server has Supabase keys; without them the mock data is used. */
export const questionsStored = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

/** "09:45" in Mongolian time. */
const clock = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ulaanbaatar" });

const toQuestion = (r: QuestionRow): AnonQuestion => ({
  id: r.id,
  subtopicId: r.subtopic_id,
  text: r.text,
  meToo: r.me_too,
  groupId: r.group_id ?? undefined,
  time: clock(r.created_at),
  answer: r.answer ?? undefined,
});

/** A class's questions, newest first, optionally for one subtopic. */
export async function listQuestions(classCode: string, subtopicId?: string): Promise<AnonQuestion[]> {
  let query = db()
    .from("anon_questions")
    .select("id, subtopic_id, text, me_too, group_id, answer, created_at")
    .eq("class_code", classCode)
    .order("created_at", { ascending: false })
    .limit(200);
  if (subtopicId) query = query.eq("subtopic_id", subtopicId);
  const { data, error } = await query.returns<QuestionRow[]>();
  if (error) throw new Error(`Could not load questions: ${error.message}`);
  return data.map(toQuestion);
}

/** A class's question groups with the ids of the questions in each. */
export async function listGroups(classCode: string): Promise<QuestionGroup[]> {
  const [groups, questions] = await Promise.all([
    db().from("question_groups").select("id, subtopic_id, title").eq("class_code", classCode).returns<GroupRow[]>(),
    listQuestions(classCode),
  ]);
  if (groups.error) throw new Error(`Could not load question groups: ${groups.error.message}`);
  return groups.data.map((g) => ({
    id: g.id,
    subtopicId: g.subtopic_id,
    title: g.title,
    questionIds: questions.filter((q) => q.groupId === g.id).map((q) => q.id),
  }));
}

/** Saves a question as typed; it is grouped later, so the student never waits for that. */
export async function addQuestion(classCode: string, subtopicId: string, text: string): Promise<AnonQuestion> {
  const { data, error } = await db()
    .from("anon_questions")
    .insert({ class_code: classCode, subtopic_id: subtopicId, text, normalized: normalizeQuestion(text) })
    .select("id, subtopic_id, text, me_too, group_id, answer, created_at")
    .single<QuestionRow>();
  if (error) throw new Error(`Could not save the question: ${error.message}`);
  return toQuestion(data);
}
