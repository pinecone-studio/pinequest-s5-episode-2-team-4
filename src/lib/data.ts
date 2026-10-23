// Data access layer. Pages and components read data only through these
// functions, never by importing src/lib/mock directly, so a real API can
// replace the mock later without touching the UI.
//
// The functions are async like a real API. Call them in Server Components
// (pages, layouts) and pass the result to Client Components as props.

import { suggestExercises, tutorReply } from "./ai";
import { expressionToText, fractionToText } from "./fractions";
import { XP_PER_LEVEL, nextEvolutionLevel, petStage } from "./pets";
import { cleanSchool } from "./school";
import {
  type Account,
  listAccounts,
  listAssignments,
  readSession,
  readTeacherData,
} from "./session";
import type {
  Assignment,
  Chapter,
  ChapterStatus,
  ChatMessage,
  ClassReport,
  ExerciseItem,
  HeatmapStatus,
  SchoolClass,
  Lesson,
  MasteryResult,
  PetLine,
  Question,
  Subtopic,
  SubtopicProgress,
  TestResult,
  Topic,
  User,
} from "./types";
import { helperScripts, lessons } from "./mock/lessons";
import { sampleTestAnswers, testQuestions } from "./mock/questions";
import { demoClassSize, demoCounts, demoExercises, demoTestedCount, notifications } from "./mock/teacher";
import { petLines } from "./mock/pets";
import { grade7MathChapters } from "./mock/curriculum";
import { subtopics, topics } from "./mock/topics";

// Student

/** The logged-in user from the mock session, or undefined when logged out. */
export async function getCurrentUser(): Promise<User | undefined> {
  const session = await readSession();
  if (!session) return undefined;
  return {
    id: `user-${session.username}`,
    username: session.username,
    role: session.role,
    classCode: session.classCode,
    ...cleanSchool(session.grade, session.subject),
    pet: session.pet,
  };
}

// Pets

export async function getPetLines(): Promise<PetLine[]> {
  return petLines;
}

export async function getPetLine(id: string): Promise<PetLine | undefined> {
  return petLines.find((l) => l.id === id);
}

/** The current user's pet with its line and the stage for its level. */
export async function getCurrentPet() {
  const pet = (await readSession())?.pet;
  const line = pet && petLines.find((l) => l.id === pet.lineId);
  if (!pet || !line) return undefined;
  return { ...pet, line, stage: petStage(line, pet.level) };
}

// Topics and progress

export async function getTopics(): Promise<Topic[]> {
  return topics;
}

export async function getTopic(topicId: string): Promise<Topic | undefined> {
  return topics.find((t) => t.id === topicId);
}

export async function getSubtopics(topicId: string): Promise<Subtopic[]> {
  return subtopics
    .filter((s) => s.topicId === topicId)
    .sort((a, b) => a.order - b.order);
}

export async function getSubtopic(id: string): Promise<Subtopic | undefined> {
  return subtopics.find((s) => s.id === id);
}

/**
 * The test result per subtopic, with retest-passed subtopics "mastered".
 * Empty until the diagnostic test is taken ("new" means just mastered).
 */
export async function getProgress(): Promise<SubtopicProgress[]> {
  const [result, session] = await Promise.all([getTestResult(), readSession()]);
  const mastered = new Set(session?.mastered);
  return (
    result?.subtopics.map(({ subtopicId, status }) => ({
      subtopicId,
      status: mastered.has(subtopicId) ? "mastered" : status,
    })) ?? []
  );
}

/**
 * The year's chapters for the student's grade and subject, with each one's
 * status. A chapter is done when every playable subtopic in it is mastered;
 * the first unfinished chapter is current and every later one is locked, so
 * finishing a chapter opens the next.
 */
export async function getRoadmap(): Promise<(Chapter & { status: ChapterStatus })[]> {
  const mastered = new Set((await readSession())?.mastered);
  let found = false;
  return grade7MathChapters.map((chapter) => {
    const playable = subtopics.filter((s) => s.topicId === chapter.topicId);
    const done =
      chapter.assumedDone ||
      (playable.length > 0 && playable.every((s) => mastered.has(s.id)));
    let status: ChapterStatus = "locked";
    if (!found) {
      status = done ? "done" : "current";
      found = !done;
    }
    return { ...chapter, status };
  });
}

export async function getTestQuestions(topicId: string) {
  return testQuestions.filter((q) =>
    topics.find((t) => t.id === topicId)?.subtopicIds.includes(q.subtopicId),
  );
}

/**
 * Scores the current user's saved test answers per subtopic, weakest first.
 * Undefined until the test is taken.
 */
export async function getTestResult(): Promise<TestResult | undefined> {
  return scoreAnswers((await readSession())?.testAnswers);
}

/** Scores diagnostic test answers per subtopic, weakest first; undefined if none. */
function scoreAnswers(answers: Record<string, number> | undefined): TestResult | undefined {
  const answered = testQuestions.filter((q) => answers?.[q.id] !== undefined);
  if (!answers || answered.length === 0) return undefined;

  const topicId =
    topics.find((t) => t.subtopicIds.includes(answered[0].subtopicId))?.id ?? "";
  const scores = subtopics
    .filter((s) => s.topicId === topicId)
    .sort((a, b) => a.order - b.order)
    .map((s) => {
      const questions = testQuestions.filter((q) => q.subtopicId === s.id);
      const correct = questions.filter((q) => answers[q.id] === q.correctIndex).length;
      return {
        subtopicId: s.id,
        status: correct === questions.length ? ("good" as const) : ("weak" as const),
        correct,
        total: questions.length,
      };
    })
    .filter((s) => s.total > 0)
    // Stable sort keeps the topic order for equal scores.
    .sort((a, b) => a.correct / a.total - b.correct / b.total);

  return {
    topicId,
    correct: scores.reduce((sum, s) => sum + s.correct, 0),
    total: scores.reduce((sum, s) => sum + s.total, 0),
    subtopics: scores,
  };
}

/**
 * The retest that just mastered `subtopicId`: its score and the pet's level
 * before and after; the subtopic is "new" in the progress. Undefined unless
 * the user's latest retest passed for this subtopic.
 */
export async function getMasteryResult(
  subtopicId: string,
): Promise<MasteryResult | undefined> {
  const [session, pet, progress] = await Promise.all([
    readSession(),
    getCurrentPet(),
    getProgress(),
  ]);
  const retest = session?.lastRetest;
  if (!pet || !retest?.passed || retest.subtopicId !== subtopicId) return undefined;

  return {
    subtopicId,
    score: { correct: retest.correct, total: retest.total },
    progress: progress.map((p) =>
      p.subtopicId === subtopicId ? { ...p, status: "new" } : p,
    ),
    pet: {
      lineId: pet.lineId,
      from: { stage: petStage(pet.line, retest.fromLevel), level: retest.fromLevel },
      to: { stage: pet.stage, level: pet.level },
      mood: "Баяртай",
      xp: pet.xp,
      xpGained: (retest.toLevel - retest.fromLevel) * XP_PER_LEVEL,
      nextEvolutionLevel: nextEvolutionLevel(pet.level),
    },
  };
}

/**
 * The retest that masters a subtopic: its 2 diagnostic test questions and
 * its lesson's practice questions.
 */
export async function getRetestQuestions(subtopicId: string): Promise<Question[]> {
  const lesson = lessons.find((l) => l.subtopicId === subtopicId);
  return [
    ...testQuestions.filter((q) => q.subtopicId === subtopicId),
    ...(lesson?.practice ?? []),
  ];
}

/** Demo answers that fill the diagnostic test (5/8). */
export async function getSampleTestAnswers(): Promise<Record<string, number>> {
  return sampleTestAnswers;
}

/** Demo answers that pass a subtopic's retest: all correct. */
export async function getSampleRetestAnswers(
  subtopicId: string,
): Promise<Record<string, number>> {
  const questions = await getRetestQuestions(subtopicId);
  return Object.fromEntries(questions.map((q) => [q.id, q.correctIndex]));
}

/** The current user's latest subtopic retest, passed or not. */
export async function getLastRetest() {
  return (await readSession())?.lastRetest;
}

/** Practice question ids the current user has solved. */
export async function getSolvedPractice(): Promise<string[]> {
  return (await readSession())?.practiceSolved ?? [];
}

export async function getLesson(subtopicId: string): Promise<Lesson | undefined> {
  return lessons.find((l) => l.subtopicId === subtopicId);
}

// AI teacher: Gemini when GEMINI_API_KEY is set, canned replies otherwise

const defaultScript = helperScripts["different-denominator"];

/** The AI teacher's opening messages and suggested questions for a lesson. */
export async function getHelperConversation(subtopicId: string) {
  const script = helperScripts[subtopicId] ?? defaultScript;
  return { messages: script.opening, suggestions: script.suggestions };
}

/** Replies to the last student message in `history`, about this lesson only. */
export async function askHelper(subtopicId: string, history: ChatMessage[]): Promise<string> {
  const question = history.at(-1)?.text ?? "";
  const [subtopic, lesson] = await Promise.all([getSubtopic(subtopicId), getLesson(subtopicId)]);
  const reply = subtopic && lesson && (await tutorReply({ subtopic, lesson, history }));
  if (reply) return reply;
  const script = helperScripts[subtopicId] ?? defaultScript;
  return script.replies[question] ?? script.fallback;
}

// Teacher. Students are only ever counted: no names, ids or rows per student.

/** The logged-in teacher's classes, oldest first. */
export async function getTeacherClasses(): Promise<SchoolClass[]> {
  const session = await readSession();
  if (session?.role !== "teacher") return [];
  return (await readTeacherData(session.username)).classes;
}

/** One student's status per subtopic, for counting in the class report. */
function studentStatuses(account: Account): Map<string, HeatmapStatus> {
  const result = scoreAnswers(account.testAnswers);
  const mastered = new Set(account.mastered);
  const solved = new Set(account.practiceSolved);
  const statuses = new Map<string, HeatmapStatus>();
  for (const s of result?.subtopics ?? []) {
    const practised = lessons
      .find((l) => l.subtopicId === s.subtopicId)
      ?.practice.some((q) => solved.has(q.id));
    statuses.set(
      s.subtopicId,
      mastered.has(s.subtopicId) || s.status === "good"
        ? "good"
        : practised
          ? "learning"
          : "weak",
    );
  }
  return statuses;
}

/**
 * How many students in the class are weak / learning / good / untested per
 * subtopic: demo classmates plus the students who joined with the code in
 * this browser. Undefined if the class isn't the teacher's.
 */
export async function getClassReport(code: string): Promise<ClassReport | undefined> {
  const schoolClass = (await getTeacherClasses()).find((c) => c.code === code);
  if (!schoolClass) return undefined;

  const joined = (await listAccounts()).filter(
    (a) => a.role === "student" && a.classCode?.toUpperCase() === code,
  );
  const joinedStatuses = joined.map(studentStatuses);
  const classSubtopics = await getSubtopics(schoolClass.topicId);

  const counts = classSubtopics.map((sub) => {
    const base = demoCounts.find((c) => c.subtopicId === sub.id) ?? {
      subtopicId: sub.id,
      weak: 0,
      learning: 0,
      good: 0,
      untested: demoClassSize,
    };
    const row = { ...base };
    for (const statuses of joinedStatuses) row[statuses.get(sub.id) ?? "untested"] += 1;
    return row;
  });
  // Weakest first: most students still weak or learning.
  counts.sort((a, b) => b.weak + b.learning - (a.weak + a.learning));

  return {
    schoolClass,
    studentCount: demoClassSize + joined.length,
    testedCount: demoTestedCount + joinedStatuses.filter((s) => s.size > 0).length,
    joinedCount: joined.length,
    subtopics: counts,
  };
}

export async function getNotifications() {
  return notifications;
}

/** The class's published assignment for a subtopic, if any. */
export async function getAssignment(
  code: string,
  subtopicId: string,
): Promise<Assignment | undefined> {
  const session = await readSession();
  if (session?.role !== "teacher") return undefined;
  return (await readTeacherData(session.username)).assignments.find(
    (a) => a.classCode === code && a.subtopicId === subtopicId,
  );
}

/** Ready-made exercises for a subtopic, without calling the AI. */
export async function getDraftExercises(subtopicId: string): Promise<ExerciseItem[]> {
  const lesson = await getLesson(subtopicId);
  return (
    demoExercises[subtopicId] ??
    lesson?.practice.map((q) => ({
      question: expressionToText(q.expression),
      answer: fractionToText(q.options[q.correctIndex]),
    })) ??
    []
  );
}

/** New AI-suggested exercises for a subtopic; ready-made ones without Gemini. */
export async function getSuggestedExercises(subtopicId: string): Promise<ExerciseItem[]> {
  const [subtopic, lesson] = await Promise.all([getSubtopic(subtopicId), getLesson(subtopicId)]);
  const suggested = subtopic && (await suggestExercises({ subtopic, lesson }));
  return suggested || getDraftExercises(subtopicId);
}

/**
 * Teacher assignments for the current student: their class's, for subtopics
 * they're still weak in (not mastered). Read from this browser's teachers.
 */
export async function getStudentAssignments(): Promise<Assignment[]> {
  const [session, progress] = await Promise.all([readSession(), getProgress()]);
  const code = session?.classCode?.toUpperCase();
  if (!code) return [];
  const weak = new Set(
    progress.filter((p) => p.status === "weak" || p.status === "learning").map((p) => p.subtopicId),
  );
  return (await listAssignments()).filter((a) => a.classCode === code && weak.has(a.subtopicId));
}
