"use server";

// Server Functions for the teacher dashboard. They only ever store classes
// and exercises; nothing about individual students.

import { redirect } from "next/navigation";
import { getSubtopic, getSuggestedExercises } from "@/lib/data";
import { topics } from "@/lib/mock/topics";
import { DEFAULT_GRADE, DEFAULT_SUBJECT } from "@/lib/school";
import { readSession, readTeacherData, writeTeacherData } from "@/lib/session";
import type { ExerciseItem } from "@/lib/types";

async function requireTeacherSession() {
  const session = await readSession();
  if (session?.role !== "teacher") redirect("/login");
  return session;
}

// No 0/O or 1/I, so a code read out loud in class isn't misheard.
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function newClassCode(taken: Set<string>) {
  for (;;) {
    const code = Array.from(
      { length: 5 },
      () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)],
    ).join("");
    if (!taken.has(code)) return code;
  }
}

/** Creates a grade 7 math class and opens its dashboard. */
export async function createClass(formData: FormData) {
  const session = await requireTeacherSession();
  const name = String(formData.get("name") ?? "").trim().slice(0, 20) || "7А";
  const data = await readTeacherData(session.username);
  const code = newClassCode(new Set(data.classes.map((c) => c.code)));

  await writeTeacherData(session.username, {
    ...data,
    classes: [
      ...data.classes,
      {
        code,
        name,
        grade: DEFAULT_GRADE,
        subject: DEFAULT_SUBJECT,
        topicId: topics[0].id,
      },
    ],
  });
  redirect(`/teacher?class=${code}`);
}

/** New AI-suggested exercises for the teacher to review. */
export async function suggestExercisesAction(subtopicId: string): Promise<ExerciseItem[]> {
  await requireTeacherSession();
  if (!(await getSubtopic(subtopicId))) return [];
  return getSuggestedExercises(subtopicId);
}

/**
 * Sends the reviewed exercises to the class's students who are weak in the
 * subtopic. Replaces an earlier assignment for the same class and subtopic.
 */
export async function publishAssignment(input: {
  classCode: string;
  subtopicId: string;
  items: ExerciseItem[];
  due?: string;
}) {
  const session = await requireTeacherSession();
  const data = await readTeacherData(session.username);
  if (!data.classes.some((c) => c.code === input.classCode)) return;
  if (!(await getSubtopic(input.subtopicId))) return;

  const items = input.items
    .map((i) => ({
      question: String(i.question ?? "").trim().slice(0, 200),
      answer: String(i.answer ?? "").trim().slice(0, 30),
    }))
    .filter((i) => i.question && i.answer)
    .slice(0, 8);
  if (items.length === 0) return;

  const due = /^\d{4}-\d{2}-\d{2}$/.test(input.due ?? "") ? input.due : undefined;
  await writeTeacherData(session.username, {
    ...data,
    assignments: [
      ...data.assignments.filter(
        (a) => !(a.classCode === input.classCode && a.subtopicId === input.subtopicId),
      ),
      {
        id: `${input.classCode}-${input.subtopicId}`,
        classCode: input.classCode,
        subtopicId: input.subtopicId,
        items,
        due,
      },
    ],
  });
}

/** Takes an assignment back to draft: students stop seeing it. */
export async function unpublishAssignment(classCode: string, subtopicId: string) {
  const session = await requireTeacherSession();
  const data = await readTeacherData(session.username);
  await writeTeacherData(session.username, {
    ...data,
    assignments: data.assignments.filter(
      (a) => !(a.classCode === classCode && a.subtopicId === subtopicId),
    ),
  });
}
