"use server";

// Server Functions for teacher content. Every one checks that a teacher is
// logged in and only touches that teacher's rows; inputs from the browser
// are re-validated here.

import { redirect } from "next/navigation";
import { aiEnabled } from "./ai/generate";
import { normalClassCode } from "./battle";
import { teacherSubject } from "./subjects";
import {
  type AiResult,
  generateGameQuestions,
  recognizeMaterial,
} from "./ai/tasks";
import { toRecognition } from "./ai/validate";
import {
  createMaterial,
  createUploadUrls,
  getMaterial,
  getTeacherAssignment,
  readMaterialFiles,
  saveAssignment,
  saveRecognition,
  setAssignmentStatus,
} from "./content";
import { checkQuestion, isAssignmentGame } from "./gamefit";
import { readSession, writeSession } from "./session";
import type {
  AssignmentGameMode,
  AssignmentTarget,
  GameQuestion,
  MaterialFile,
  Recognition,
} from "./types";

async function requireTeacherId(): Promise<string> {
  const session = await readSession();
  if (session?.role !== "teacher") redirect("/login");
  return session.id;
}

/** The teacher's own subject wins; older accounts without one choose per item. */
async function subjectFor(given: unknown): Promise<string> {
  const own = teacherSubject((await readSession())?.subject);
  return own?.id ?? teacherSubject(given)?.id ?? "math";
}

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
/** Compared like class battles do, so "7a" and "7А" are the same class. */
const cleanClassCode = (v: unknown) => normalClassCode(clean(v, 10));
const cleanGrade = (v: unknown) => (Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 12 ? (v as number) : undefined);

// Materials

/** Signed upload URLs for the browser to send files straight to Storage. */
export async function createUploadUrlsAction(files: { name: string; mime: string; size: number }[]) {
  const id = await requireTeacherId();
  try {
    return { ok: true as const, uploads: await createUploadUrls(id, files.slice(0, 10)) };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Файл оруулж чадсангүй" };
  }
}

export type MaterialInput = {
  topicTitle: string;
  classCode?: string;
  grade?: number;
  subject?: string;
  text?: string;
  files: MaterialFile[];
};

/**
 * Saves a material and reads it with the AI; returns what it recognised for
 * the teacher to edit. Without a topic, the one the AI finds is used
 * (`topicDetected`), and the teacher can still change it.
 */
export async function recognizeMaterialAction(input: MaterialInput): Promise<{
  materialId: string;
  recognition: AiResult<Recognition>;
  topicDetected: boolean;
}> {
  const id = await requireTeacherId();
  const givenTopic = clean(input.topicTitle, 120);
  const material = await createMaterial(id, {
    topicTitle: givenTopic || "Хичээл",
    classCode: cleanClassCode(input.classCode) || undefined,
    grade: cleanGrade(input.grade),
    subject: await subjectFor(input.subject),
    text: clean(input.text, 20000) || undefined,
    files: Array.isArray(input.files) ? input.files : [],
  });
  const inputs = [
    ...(material.text ? [{ text: material.text }] : []),
    ...(await readMaterialFiles(material.files)),
  ];
  const recognition = await recognizeMaterial(
    { topic: givenTopic, grade: material.grade, subject: material.subject },
    inputs,
  );
  if (!givenTopic) recognition.value.topic ||= "Хичээл";
  await saveRecognition(id, material.id, recognition.value, givenTopic ? undefined : recognition.value.topic);
  return { materialId: material.id, recognition, topicDetected: !givenTopic };
}

/** Saves the teacher's edits to what the AI recognised. */
export async function saveRecognitionAction(materialId: string, recognition: Recognition) {
  const id = await requireTeacherId();
  const value = toRecognition(recognition);
  if (!value) return { ok: false as const };
  await saveRecognition(id, materialId, value, clean(value.topic, 120));
  return { ok: true as const };
}

// Assignments

/** AI questions on a topic, or from a material the teacher uploaded. */
export async function generateQuestionsAction(input: {
  topic: string;
  subject?: string;
  grade?: number;
  count: number;
  materialId?: string;
}): Promise<{ questions: GameQuestion[]; source: "ai" | "demo" }> {
  const id = await requireTeacherId();
  const count = Math.min(10, Math.max(3, Math.round(Number(input.count) || 6)));
  const material = input.materialId ? await getMaterial(id, input.materialId) : undefined;
  const { value, source } = await generateGameQuestions(
    { topic: clean(input.topic, 120) || material?.topicTitle || "Бутархай", grade: cleanGrade(input.grade), subject: await subjectFor(input.subject) },
    count,
    material && { recognition: material.recognition },
  );
  return { questions: value.map((q, i) => ({ ...q, id: `new-${Date.now()}-${i}` })), source };
}

export type AssignmentDraftInput = {
  title: string;
  classCode: string;
  subject: string;
  materialId?: string;
  games: string[];
  gameMode: AssignmentGameMode;
  target: AssignmentTarget;
  targetSubtopicId?: string;
  dueAt?: string;
  questions: Pick<GameQuestion, "prompt" | "correct" | "wrong" | "explanation">[];
};

/**
 * Saves the assignment (as a draft) and publishes it when `publish` is set
 * and every question passes the checks. Returns its id, or the problems.
 */
export async function saveAssignmentAction(
  input: AssignmentDraftInput,
  options: { id?: string; publish?: boolean },
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const teacher = await requireTeacherId();
  const title = clean(input.title, 120);
  const classCode = cleanClassCode(input.classCode);
  if (!title) return { ok: false, error: "Даалгаврын нэр хэрэгтэй" };
  if (!classCode) return { ok: false, error: "Ангийн код хэрэгтэй" };

  const questions = (Array.isArray(input.questions) ? input.questions : []).slice(0, 20).map((q) => ({
    prompt: clean(q.prompt, 200),
    correct: (q.correct ?? []).map((a) => clean(a, 28)).filter(Boolean),
    wrong: (q.wrong ?? []).map((a) => clean(a, 28)).filter(Boolean),
    explanation: clean(q.explanation, 400),
  }));
  if (questions.length === 0) return { ok: false, error: "Дор хаяж нэг асуулт хэрэгтэй" };

  const games = [...new Set((input.games ?? []).filter(isAssignmentGame))].slice(0, 3);
  if (games.length === 0) return { ok: false, error: "Дор хаяж нэг тоглоом сонгоно уу" };

  if (options.publish) {
    const bad = questions.findIndex((q) => checkQuestion(q).some((i) => i.level === "error"));
    if (bad >= 0) return { ok: false, error: `${bad + 1}-р асуултад алдаа байна` };
  }

  const dueAt = input.dueAt && !Number.isNaN(Date.parse(input.dueAt)) ? new Date(input.dueAt).toISOString() : undefined;
  const id = await saveAssignment(
    teacher,
    {
      title,
      classCode,
      subject: await subjectFor(input.subject),
      materialId: input.materialId,
      games,
      gameMode: input.gameMode === "interest" ? "interest" : "fixed",
      target: input.target === "weak" && input.targetSubtopicId ? "weak" : "class",
      targetSubtopicId: input.target === "weak" ? clean(input.targetSubtopicId, 60) || undefined : undefined,
      dueAt,
      questions,
    },
    options.id && (await getTeacherAssignment(teacher, options.id)) ? options.id : undefined,
  );
  await setAssignmentStatus(teacher, id, options.publish ? "published" : "draft");
  return { ok: true, id };
}

export async function unpublishAssignmentAction(assignmentId: string) {
  const teacher = await requireTeacherId();
  await setAssignmentStatus(teacher, assignmentId, "draft");
}

/** Whether Claude is set up, so pages can say when content is demo data. */
export async function aiStatusAction() {
  await requireTeacherId();
  return { ai: aiEnabled() };
}

/** For teacher accounts made before teachers picked a subject: picks it once. */
export async function chooseTeacherSubject(form: FormData) {
  const session = await readSession();
  if (session?.role !== "teacher") redirect("/login");
  const subject = teacherSubject(form.get("subject"));
  if (subject && !session.subject) await writeSession({ ...session, subject: subject.id });
  redirect("/teacher");
}
