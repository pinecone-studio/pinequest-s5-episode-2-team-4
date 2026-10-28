// Teacher content in Supabase (server only): materials, lesson videos,
// assignments and attempts (supabase/migrations/0011_teacher_content.sql),
// plus the two private Storage buckets. Callers check who is asking; every
// teacher query here also filters on teacher_id.

import "server-only";
import { randomUUID } from "node:crypto";
import type { AiInput } from "./ai/claude";
import { getSupabaseAdmin } from "./supabase";
import type {
  Assignment,
  AssignmentGameMode,
  AssignmentTarget,
  BookText,
  GameAnswer,
  GameQuestion,
  LessonVideo,
  LessonVideoStatus,
  Material,
  MaterialFile,
  Recognition,
  ReelScript,
  ReelTimings,
} from "./types";
import { MAX_UPLOAD_FILES, uploadProblem } from "./uploads";

const db = () => getSupabaseAdmin();
const MATERIALS_BUCKET = "materials";
const AUDIO_BUCKET = "lesson-audio";
/** Signed file URLs last an hour. */
const SIGNED_URL_SECONDS = 60 * 60;

function fail(what: string, error: { message: string } | null): never {
  throw new Error(`${what}: ${error?.message ?? "unknown error"}`);
}

// Uploads

/**
 * Signed URLs the browser uploads the teacher's files to directly, so big
 * files never pass through a server function. Throws on a bad file.
 */
export async function createUploadUrls(
  teacherId: string,
  files: { name: string; mime: string; size: number }[],
): Promise<{ file: MaterialFile; url: string; token: string }[]> {
  if (files.length === 0 || files.length > MAX_UPLOAD_FILES) throw new Error("Bad number of files");
  const problem = files.map(uploadProblem).find(Boolean);
  if (problem) throw new Error(problem);

  return Promise.all(
    files.map(async (f) => {
      // Never trust the file name for the path; keep it for display only.
      const ext = f.mime === "application/pdf" ? "pdf" : f.mime === "text/plain" ? "txt" : f.mime.split("/")[1];
      const path = `${teacherId}/${randomUUID()}.${ext}`;
      const { data, error } = await db().storage.from(MATERIALS_BUCKET).createSignedUploadUrl(path);
      if (error || !data) fail("Upload URL", error);
      return {
        file: { path, mime: f.mime, size: f.size, name: f.name.slice(0, 120) },
        url: data.signedUrl,
        token: data.token,
      };
    }),
  );
}

/** A material's files as model input: images and PDFs as bytes, text as text. */
export async function readMaterialFiles(files: MaterialFile[]): Promise<AiInput[]> {
  const inputs = await Promise.all(
    files.map(async (f): Promise<AiInput | undefined> => {
      const { data, error } = await db().storage.from(MATERIALS_BUCKET).download(f.path);
      if (error || !data) return undefined;
      const bytes = Buffer.from(await data.arrayBuffer());
      return f.mime === "text/plain" ? { text: bytes.toString("utf8").slice(0, 20000) } : { mime: f.mime, data: bytes };
    }),
  );
  return inputs.filter((i): i is AiInput => Boolean(i));
}

// Materials

type MaterialRow = {
  id: string;
  topic_title: string;
  class_code: string | null;
  grade: number | null;
  subject: string;
  text_content: string | null;
  files: MaterialFile[];
  extraction: Recognition | null;
  created_at: string;
};

const toMaterial = (r: MaterialRow): Material => ({
  id: r.id,
  topicTitle: r.topic_title,
  classCode: r.class_code ?? undefined,
  grade: r.grade ?? undefined,
  subject: r.subject,
  text: r.text_content ?? undefined,
  files: r.files ?? [],
  recognition: r.extraction ?? undefined,
  createdAt: r.created_at,
});

export async function createMaterial(
  teacherId: string,
  input: { topicTitle: string; classCode?: string; grade?: number; subject: string; text?: string; files: MaterialFile[] },
): Promise<Material> {
  // Only paths under the teacher's own folder.
  const files = input.files.filter((f) => f.path.startsWith(`${teacherId}/`)).slice(0, MAX_UPLOAD_FILES);
  const { data, error } = await db()
    .from("materials")
    .insert({
      teacher_id: teacherId,
      topic_title: input.topicTitle,
      class_code: input.classCode ?? null,
      grade: input.grade ?? null,
      subject: input.subject,
      text_content: input.text ?? null,
      files,
    })
    .select("*")
    .single<MaterialRow>();
  if (error || !data) fail("Create material", error);
  return toMaterial(data);
}

export async function getMaterial(teacherId: string, id: string): Promise<Material | undefined> {
  const { data } = await db().from("materials").select("*").eq("id", id).eq("teacher_id", teacherId).maybeSingle<MaterialRow>();
  return data ? toMaterial(data) : undefined;
}

/** Saves what was recognised; `topicTitle` replaces the material's topic (e.g. one the AI found). */
export async function saveRecognition(teacherId: string, id: string, recognition: Recognition, topicTitle?: string) {
  const { error } = await db()
    .from("materials")
    .update({ extraction: recognition, ...(topicTitle ? { topic_title: topicTitle } : {}) })
    .eq("id", id)
    .eq("teacher_id", teacherId);
  if (error) fail("Save recognition", error);
}

// Lesson videos

type VideoRow = {
  id: string;
  title: string;
  class_code: string;
  status: LessonVideoStatus;
  script: ReelScript;
  book: BookText | null;
  audio_path: string | null;
  timings: ReelTimings | null;
  material_id: string | null;
  updated_at: string;
  published_at: string | null;
};

async function toVideo(r: VideoRow): Promise<LessonVideo> {
  let audioUrl: string | undefined;
  if (r.audio_path) {
    const { data } = await db().storage.from(AUDIO_BUCKET).createSignedUrl(r.audio_path, SIGNED_URL_SECONDS);
    audioUrl = data?.signedUrl;
  }
  return {
    id: r.id,
    title: r.title,
    classCode: r.class_code,
    status: r.status,
    script: r.script,
    book: r.book ?? undefined,
    audioUrl,
    timings: r.timings ?? undefined,
    materialId: r.material_id ?? undefined,
    updatedAt: r.updated_at,
    publishedAt: r.published_at ?? undefined,
  };
}

export async function createVideo(
  teacherId: string,
  input: { title: string; classCode: string; materialId?: string; script: ReelScript; book?: BookText },
): Promise<string> {
  const { data, error } = await db()
    .from("lesson_videos")
    .insert({
      teacher_id: teacherId,
      title: input.title,
      class_code: input.classCode,
      material_id: input.materialId ?? null,
      script: input.script,
      book: input.book ?? null,
    })
    .select("id")
    .single<{ id: string }>();
  if (error || !data) fail("Create video", error);
  return data.id;
}

export async function getTeacherVideo(teacherId: string, id: string): Promise<LessonVideo | undefined> {
  const { data } = await db().from("lesson_videos").select("*").eq("id", id).eq("teacher_id", teacherId).maybeSingle<VideoRow>();
  return data ? toVideo(data) : undefined;
}

export async function listTeacherVideos(teacherId: string): Promise<LessonVideo[]> {
  const { data } = await db()
    .from("lesson_videos")
    .select("*")
    .eq("teacher_id", teacherId)
    .order("updated_at", { ascending: false })
    .limit(50)
    .returns<VideoRow[]>();
  return Promise.all((data ?? []).map(toVideo));
}

/** Saves an edited script; an approved video goes back to draft. */
export async function saveVideoScript(teacherId: string, id: string, title: string, script: ReelScript) {
  const { error } = await db()
    .from("lesson_videos")
    .update({ title, script, status: "draft", audio_path: null, timings: null, approved_at: null, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("teacher_id", teacherId)
    .neq("status", "published");
  if (error) fail("Save script", error);
}

/** Uploads narration audio and stores it with its timings, marking the video approved. */
export async function approveVideo(teacherId: string, id: string, audio: Buffer | undefined, timings: ReelTimings) {
  let audioPath: string | null = null;
  if (audio) {
    audioPath = `${teacherId}/${id}-${Date.now()}.mp3`;
    const { error } = await db().storage.from(AUDIO_BUCKET).upload(audioPath, audio, { contentType: "audio/mpeg", upsert: true });
    if (error) fail("Upload audio", error);
  }
  const now = new Date().toISOString();
  const { error } = await db()
    .from("lesson_videos")
    .update({ status: "approved", audio_path: audioPath, timings, approved_at: now, updated_at: now })
    .eq("id", id)
    .eq("teacher_id", teacherId);
  if (error) fail("Approve video", error);
}

export async function publishVideo(teacherId: string, id: string) {
  const now = new Date().toISOString();
  const { error } = await db()
    .from("lesson_videos")
    .update({ status: "published", published_at: now, updated_at: now })
    .eq("id", id)
    .eq("teacher_id", teacherId)
    .eq("status", "approved");
  if (error) fail("Publish video", error);
}

/** Published videos for a class, newest first. */
export async function listClassVideos(classCode: string): Promise<LessonVideo[]> {
  const { data } = await db()
    .from("lesson_videos")
    .select("*")
    .eq("class_code", classCode)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(50)
    .returns<VideoRow[]>();
  return Promise.all((data ?? []).map(toVideo));
}

export async function getClassVideo(classCode: string, id: string): Promise<LessonVideo | undefined> {
  const { data } = await db()
    .from("lesson_videos")
    .select("*")
    .eq("id", id)
    .eq("class_code", classCode)
    .eq("status", "published")
    .maybeSingle<VideoRow>();
  return data ? toVideo(data) : undefined;
}

// Assignments

type AssignmentRow = {
  id: string;
  title: string;
  class_code: string;
  subject: string;
  games: string[];
  game_mode: AssignmentGameMode;
  target: AssignmentTarget;
  target_subtopic_id: string | null;
  due_at: string | null;
  status: "draft" | "published";
  created_at: string;
};

const toAssignment = (r: AssignmentRow): Assignment => ({
  id: r.id,
  title: r.title,
  classCode: r.class_code,
  subject: r.subject,
  games: r.games ?? [],
  gameMode: r.game_mode,
  target: r.target,
  targetSubtopicId: r.target_subtopic_id ?? undefined,
  dueAt: r.due_at ?? undefined,
  status: r.status,
  createdAt: r.created_at,
});

type QuestionRow = {
  id: string;
  prompt: string;
  correct: GameAnswer[];
  wrong: GameAnswer[];
  explanation: string;
};

const toQuestion = (r: QuestionRow): GameQuestion => ({
  id: r.id,
  prompt: r.prompt,
  correct: r.correct,
  wrong: r.wrong,
  explanation: r.explanation,
});

export type AssignmentInput = {
  title: string;
  classCode: string;
  subject: string;
  materialId?: string;
  games: string[];
  gameMode: AssignmentGameMode;
  target: AssignmentTarget;
  targetSubtopicId?: string;
  dueAt?: string;
  questions: Omit<GameQuestion, "id">[];
};

/** Creates or replaces a draft assignment with its questions; returns its id. */
export async function saveAssignment(teacherId: string, input: AssignmentInput, id?: string): Promise<string> {
  const row = {
    teacher_id: teacherId,
    title: input.title,
    class_code: input.classCode,
    subject: input.subject,
    material_id: input.materialId ?? null,
    games: input.games,
    game_mode: input.gameMode,
    target: input.target,
    target_subtopic_id: input.targetSubtopicId ?? null,
    due_at: input.dueAt ?? null,
  };
  let assignmentId = id;
  if (assignmentId) {
    const { error } = await db().from("assignments").update(row).eq("id", assignmentId).eq("teacher_id", teacherId);
    if (error) fail("Update assignment", error);
    const del = await db().from("assignment_questions").delete().eq("assignment_id", assignmentId);
    if (del.error) fail("Replace questions", del.error);
  } else {
    const { data, error } = await db().from("assignments").insert(row).select("id").single<{ id: string }>();
    if (error || !data) fail("Create assignment", error);
    assignmentId = data.id;
  }
  const { error } = await db()
    .from("assignment_questions")
    .insert(input.questions.map((q, position) => ({ assignment_id: assignmentId, position, ...q })));
  if (error) fail("Save questions", error);
  return assignmentId;
}

export async function setAssignmentStatus(teacherId: string, id: string, status: "draft" | "published") {
  const { error } = await db()
    .from("assignments")
    .update({ status, published_at: status === "published" ? new Date().toISOString() : null })
    .eq("id", id)
    .eq("teacher_id", teacherId);
  if (error) fail("Publish assignment", error);
}

export async function listTeacherAssignments(teacherId: string): Promise<Assignment[]> {
  const { data } = await db()
    .from("assignments")
    .select("*")
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<AssignmentRow[]>();
  return (data ?? []).map(toAssignment);
}

export async function getTeacherAssignment(
  teacherId: string,
  id: string,
): Promise<{ assignment: Assignment; questions: GameQuestion[] } | undefined> {
  const { data } = await db().from("assignments").select("*").eq("id", id).eq("teacher_id", teacherId).maybeSingle<AssignmentRow>();
  if (!data) return undefined;
  return { assignment: toAssignment(data), questions: await listQuestions(id) };
}

async function listQuestions(assignmentId: string): Promise<GameQuestion[]> {
  const { data } = await db()
    .from("assignment_questions")
    .select("id, prompt, correct, wrong, explanation")
    .eq("assignment_id", assignmentId)
    .order("position")
    .returns<QuestionRow[]>();
  return (data ?? []).map(toQuestion);
}

/** Published assignments for a class, newest first. */
export async function listClassAssignments(classCode: string): Promise<Assignment[]> {
  const { data } = await db()
    .from("assignments")
    .select("*")
    .eq("class_code", classCode)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(50)
    .returns<AssignmentRow[]>();
  return (data ?? []).map(toAssignment);
}

/** A published assignment of the class with its questions. */
export async function getClassAssignment(
  classCode: string,
  id: string,
): Promise<{ assignment: Assignment; questions: GameQuestion[] } | undefined> {
  const { data } = await db()
    .from("assignments")
    .select("*")
    .eq("id", id)
    .eq("class_code", classCode)
    .eq("status", "published")
    .maybeSingle<AssignmentRow>();
  if (!data) return undefined;
  return { assignment: toAssignment(data), questions: await listQuestions(id) };
}

// Attempts

export async function saveAttempt(attempt: {
  assignmentId: string;
  studentId: string;
  game: string;
  score: number;
  accuracy: number;
  stars: number;
  bestCombo: number;
  missedQuestionIds: string[];
  xpAwarded: number;
}) {
  const { error } = await db().from("assignment_attempts").insert({
    assignment_id: attempt.assignmentId,
    student_id: attempt.studentId,
    game: attempt.game,
    score: attempt.score,
    accuracy: attempt.accuracy,
    stars: attempt.stars,
    best_combo: attempt.bestCombo,
    missed_question_ids: attempt.missedQuestionIds,
    xp_awarded: attempt.xpAwarded,
  });
  if (error) fail("Save attempt", error);
}

/** Assignment ids the student has finished at least once. */
export async function finishedAssignmentIds(studentId: string, assignmentIds: string[]): Promise<Set<string>> {
  if (assignmentIds.length === 0) return new Set();
  const { data } = await db()
    .from("assignment_attempts")
    .select("assignment_id")
    .eq("student_id", studentId)
    .in("assignment_id", assignmentIds)
    // Done means at least one right answer, as in submitAssignmentAttempt.
    .gt("accuracy", 0)
    .returns<{ assignment_id: string }[]>();
  return new Set((data ?? []).map((r) => r.assignment_id));
}

/** All attempts of an assignment, for the teacher's counts. */
export async function listAttempts(assignmentId: string) {
  const { data } = await db()
    .from("assignment_attempts")
    .select("student_id, accuracy, missed_question_ids, game")
    .eq("assignment_id", assignmentId)
    .returns<{ student_id: string; accuracy: number; missed_question_ids: string[]; game: string }[]>();
  return data ?? [];
}

/** Everyone in a class, for counting who hasn't done an assignment. */
export async function countClassStudents(classCode: string): Promise<number> {
  const { count } = await db()
    .from("accounts")
    .select("id", { count: "exact", head: true })
    .eq("class_code", classCode)
    .eq("role", "student")
    .eq("demo", false);
  return count ?? 0;
}
