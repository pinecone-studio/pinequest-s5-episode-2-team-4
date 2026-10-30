"use server";

// Server Functions for teacher content. Every one checks that a teacher is
// logged in and only touches that teacher's rows; inputs from the browser
// are re-validated here.

import { redirect } from "next/navigation";
import { aiEnabled } from "./ai/generate";
import { normalClassCode } from "./battle";
import { getTeacherClassOptions } from "./data";
import { teacherSubject } from "./subjects";
import {
  type AiResult,
  generateGameQuestions,
  recognizeMaterial,
  rewriteReelSection,
  writeBookText,
  writeReelScript,
} from "./ai/tasks";
import { toRecognition, toScript, toSection } from "./ai/validate";
import {
  approveVideo,
  createMaterial,
  createUploadUrls,
  createVideo,
  getMaterial,
  getTeacherAssignment,
  getTeacherVideo,
  publishVideo,
  readMaterialFiles,
  saveAssignment,
  saveRecognition,
  saveVideoScript,
  setAssignmentStatus,
} from "./content";
import { checkFormula } from "./formula";
import { toReelFrame } from "./reel-frame";
import { DEMO_REEL_AUDIO, DEMO_STEP_MS } from "./demo-reel";
import { demoRecognition, demoReelBook, demoReelScript, demoReelTimings, isDemoReelScript } from "./mock/demoReel";
import { checkQuestion, isAssignmentGame } from "./gamefit";
import { readSession, writeSession } from "./session";
import { synthesizeReel } from "./tts";
import type {
  AssignmentGameMode,
  AssignmentTarget,
  GameQuestion,
  MaterialFile,
  Recognition,
  ReelLayout,
  ReelScript,
  ReelSection,
} from "./types";

/** True when a demo teacher asks for the pitch demo's ready material (DEMO_PAGE). */
async function readyDemo(asked: unknown) {
  return asked === true && Boolean((await readSession())?.demo);
}

/** A ready result after a pause, so the demo still shows the AI working. */
const readyAfter = <T,>(ms: number, value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

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

/** Teachers publish only to their own classes (or codes they used before classes existed). */
async function isOwnClass(classCode: string) {
  return (await getTeacherClassOptions()).some((o) => o.code === classCode);
}
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
  /** The pitch demo's ready textbook page (DEMO_PAGE): a demo teacher gets its ready reel. */
  demoMaterial?: boolean;
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
  const recognition = (await readyDemo(input.demoMaterial))
    ? await readyAfter(DEMO_STEP_MS.read, { value: demoRecognition, source: "ai" as const })
    : await recognizeMaterial({ topic: givenTopic, grade: material.grade, subject: material.subject }, [
        ...(material.text ? [{ text: material.text }] : []),
        ...(await readMaterialFiles(material.files)),
      ]);
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
  if (!classCode) return { ok: false, error: "Анги сонгоно уу" };
  if (!(await isOwnClass(classCode))) return { ok: false, error: "Зөвхөн өөрийн ангид оноох боломжтой" };

  const questions = (Array.isArray(input.questions) ? input.questions : []).slice(0, 20).map((q) => ({
    prompt: clean(q.prompt, 200),
    correct: (q.correct ?? []).map((a) => clean(a, 28)).filter(Boolean),
    wrong: (q.wrong ?? []).map((a) => clean(a, 28)).filter(Boolean),
    explanation: clean(q.explanation, 400),
  }));
  if (questions.length === 0) return { ok: false, error: "Дор хаяж нэг асуулт хэрэгтэй" };

  const games = [...new Set((input.games ?? []).filter(isAssignmentGame))];
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

// Lesson videos

/** A reel script and textbook text from the teacher's edited recognition; creates the draft video. */
export async function createVideoAction(input: {
  /** Made from the pitch demo's ready page: its ready script and book text are used */
  demoMaterial?: boolean;
  materialId: string;
  classCode: string;
  recognition: Recognition;
  /** The shape and background the teacher picked */
  layout?: ReelLayout;
  background?: string;
}): Promise<{ ok: true; id: string; source: "ai" | "demo" } | { ok: false; error: string }> {
  const teacher = await requireTeacherId();
  const material = await getMaterial(teacher, input.materialId);
  const recognition = toRecognition(input.recognition);
  const classCode = cleanClassCode(input.classCode) || material?.classCode;
  if (!material || !recognition) return { ok: false, error: "Материал олдсонгүй" };
  if (!classCode) return { ok: false, error: "Анги сонгоно уу" };
  if (!(await isOwnClass(classCode))) return { ok: false, error: "Зөвхөн өөрийн ангид нийтлэх боломжтой" };
  // The topic the teacher settled on (maybe changed from the AI's) is the material's.
  await saveRecognition(teacher, material.id, recognition, clean(recognition.topic, 120));

  const context = { topic: recognition.topic, grade: material.grade, subject: material.subject };
  const [script, book] = (await readyDemo(input.demoMaterial))
    ? await readyAfter(DEMO_STEP_MS.write, [
        { value: demoReelScript, source: "ai" as const },
        { value: demoReelBook, source: "ai" as const },
      ] as const)
    : await Promise.all([writeReelScript(context, recognition), writeBookText(context, recognition)]);
  const id = await createVideo(teacher, {
    title: script.value.title,
    classCode,
    materialId: material.id,
    script: { ...script.value, ...toReelFrame(input) },
    book: book.value,
  });
  return { ok: true, id, source: script.source };
}

export async function rewriteSectionAction(
  videoId: string,
  script: ReelScript,
  index: number,
  note: string,
): Promise<{ section: ReelSection; source: "ai" | "demo" } | undefined> {
  const teacher = await requireTeacherId();
  const clean = toScript(script);
  if (!(await getTeacherVideo(teacher, videoId)) || !clean || !clean.sections[index]) return undefined;
  const { value, source } = await rewriteReelSection(clean, index, String(note ?? ""));
  return { section: value, source };
}

export async function saveScriptAction(videoId: string, script: ReelScript) {
  const teacher = await requireTeacherId();
  const clean = toScript({ ...script, sections: (script.sections ?? []).map(toSection).filter(Boolean) });
  if (!clean) return { ok: false as const, error: "Скриптэд дор хаяж 3 хэсэг хэрэгтэй" };
  await saveVideoScript(teacher, videoId, clean.title, clean);
  return { ok: true as const };
}

/** Formulas that are computably wrong block approval; unknown ones need the teacher's tick. */
function formulaProblems(script: ReelScript, checkedByTeacher: number[]) {
  return script.sections.flatMap((s, i) => {
    if (!s.formula) return [];
    const check = checkFormula(s.formula);
    if (check.status === "wrong") return [`${i + 1}-р хэсгийн томъёо буруу (зөв нь ${check.expected})`];
    if (check.status === "unknown" && !checkedByTeacher.includes(i)) return [`${i + 1}-р хэсгийн томъёог шалгаж тэмдэглэнэ үү`];
    return [];
  });
}

/**
 * Saves the script and, only if every formula checks out, approves it:
 * narration audio and word timings are made now.
 */
export async function approveVideoAction(
  videoId: string,
  script: ReelScript,
  checkedByTeacher: number[],
): Promise<{ ok: true; voiced: boolean } | { ok: false; error: string }> {
  const teacher = await requireTeacherId();
  const saved = await saveScriptAction(videoId, script);
  if (!saved.ok) return saved;
  const video = await getTeacherVideo(teacher, videoId);
  if (!video) return { ok: false, error: "Видео олдсонгүй" };
  const problems = formulaProblems(video.script, Array.isArray(checkedByTeacher) ? checkedByTeacher : []);
  if (problems.length) return { ok: false, error: problems.join(". ") };

  const { audio, timings } =
    (await readyDemo(true)) && isDemoReelScript(video.script)
      ? await readyAfter(DEMO_STEP_MS.voice, { audio: DEMO_REEL_AUDIO, timings: demoReelTimings })
      : await synthesizeReel(video.script);
  await approveVideo(teacher, videoId, audio, timings);
  return { ok: true, voiced: Boolean(audio) };
}

export async function publishVideoAction(videoId: string) {
  const teacher = await requireTeacherId();
  await publishVideo(teacher, videoId);
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
