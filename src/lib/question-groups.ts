// Puts a saved question into a group of similar questions for the same class
// and lesson, so the teacher answers each group once. Runs after the student
// already has their reply.

import "server-only";
import { classifyQuestion, type ExistingGroup } from "./ai";
import { groupAnswer } from "./question-group-edits";
import { subtopics } from "./mock/topics";
import { getSupabaseAdmin } from "./supabase";

const db = () => getSupabaseAdmin();

/** Example questions sent per group; enough to compare, few enough to stay cheap. */
const EXAMPLES = 3;
/** A question that failed this many times waits for the teacher instead. */
const MAX_ATTEMPTS = 3;

type Pending = {
  id: string;
  class_code: string;
  subtopic_id: string;
  text: string;
  group_id: string | null;
  classify_attempts: number;
};

/** A lesson's groups with a few of their questions as examples. */
async function lessonGroups(classCode: string, subtopicId: string): Promise<ExistingGroup[]> {
  const lesson = { class_code: classCode, subtopic_id: subtopicId };
  const [groups, questions] = await Promise.all([
    db().from("question_groups").select("id, title").match(lesson).order("created_at").returns<{ id: string; title: string }[]>(),
    db()
      .from("anon_questions")
      .select("text, group_id")
      .match(lesson)
      .not("group_id", "is", null)
      .order("me_too", { ascending: false })
      .limit(200)
      .returns<{ text: string; group_id: string }[]>(),
  ]);
  if (groups.error) throw new Error(`Could not load question groups: ${groups.error.message}`);
  if (questions.error) throw new Error(`Could not load grouped questions: ${questions.error.message}`);
  return groups.data.map((g) => ({
    ...g,
    examples: questions.data.filter((q) => q.group_id === g.id).slice(0, EXAMPLES).map((q) => q.text),
  }));
}

/** Classifies one question and attaches it to an existing or a new group. */
export async function groupQuestion(questionId: string) {
  const found = await db()
    .from("anon_questions")
    .select("id, class_code, subtopic_id, text, group_id, classify_attempts")
    .eq("id", questionId)
    .maybeSingle<Pending>();
  if (found.error) throw new Error(`Could not load the question: ${found.error.message}`);
  const q = found.data;
  if (!q || q.group_id) return;

  const attempts = q.classify_attempts + 1;
  try {
    const groups = await lessonGroups(q.class_code, q.subtopic_id);
    const lessonTitle = subtopics.find((s) => s.id === q.subtopic_id)?.title ?? q.subtopic_id;
    const result = await classifyQuestion({ text: q.text, lessonTitle, groups });

    let groupId = result.groupId;
    // Joining a group the teacher already answered: the student gets that answer too.
    const answer = groupId ? await groupAnswer(groupId) : null;
    if (!groupId) {
      const created = await db()
        .from("question_groups")
        .insert({ class_code: q.class_code, subtopic_id: q.subtopic_id, title: result.title, source: result.source })
        .select("id")
        .single<{ id: string }>();
      if (created.error) throw new Error(`Could not create the group: ${created.error.message}`);
      groupId = created.data.id;
    }

    const saved = await db()
      .from("anon_questions")
      .update({
        group_id: groupId,
        ...(answer && { answer }),
        classify_status: "done",
        classify_attempts: attempts,
        topic: result.title,
        intent: result.intent,
        misconception: result.misconception,
        needs_review: result.needsReview,
      })
      .eq("id", q.id);
    if (saved.error) throw new Error(`Could not save the group: ${saved.error.message}`);
  } catch (error) {
    await db().from("anon_questions").update({ classify_status: "failed", classify_attempts: attempts }).eq("id", q.id);
    throw error;
  }
}

/**
 * Groups a lesson's ungrouped questions one by one (the newest one and any
 * that failed before), so two of them never start the same group at once.
 */
export async function groupLesson(classCode: string, subtopicId: string) {
  const { data, error } = await db()
    .from("anon_questions")
    .select("id")
    .match({ class_code: classCode, subtopic_id: subtopicId })
    .is("group_id", null)
    .lt("classify_attempts", MAX_ATTEMPTS)
    .order("created_at")
    .limit(20)
    .returns<{ id: string }[]>();
  if (error) throw new Error(`Could not load ungrouped questions: ${error.message}`);
  for (const { id } of data) {
    try {
      await groupQuestion(id);
    } catch (failed) {
      console.error(`[classify] question ${id}:`, failed);
    }
  }
}
