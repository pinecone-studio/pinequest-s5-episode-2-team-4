"use server";

// Server Functions that log in and change the logged-in account. Client
// Components import these directly; they run on the server.

import { redirect } from "next/navigation";
import { after } from "next/server";
import { randomBytes } from "node:crypto";
import { checkLogin, createAccount, createDemoAccount, deleteOldDemoAccounts, findAccountById, saveAccount } from "./accounts";
import { demoQuestions } from "./ai/fallback";
import { saveAssignment, setAssignmentStatus } from "./content";
import { getRetestQuestions } from "./data";
import { clearLoginFailures, loginBlockedMinutes, recordLoginFailure } from "./login-limit";
import { lessons } from "./mock/lessons";
import { petLines } from "./mock/pets";
import { testQuestions } from "./mock/questions";
import { subtopics } from "./mock/topics";
import { XP_PER_LEVEL, addXp, isStarterPet } from "./pets";
import { clearSession, readSession, startSession, writeSession } from "./session";
import type { User } from "./types";
import { recordLearningDay } from "./streak";
import { teacherSubject } from "./subjects";

type Credentials = {
  username: string;
  email: string;
  password: string;
  role: User["role"];
  classCode?: string;
};

/** Returned instead of redirecting when the form needs to show an error. */
export type AuthError =
  | { error: "taken" | "emailTaken" | "unknown" }
  /** Too many wrong logins: try again in this many minutes. */
  | { error: "blocked"; minutes: number };

function clean(text: string | undefined, max: number) {
  return text?.trim().slice(0, max) || undefined;
}

/** Just the shape; the form's email field checks it first. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanEmail(text: string | undefined) {
  const email = clean(text, 254)?.toLowerCase();
  return email && EMAIL.test(email) ? email : undefined;
}

function homeFor(role: User["role"]) {
  return role === "teacher" ? "/teacher" : "/";
}

/** A new account: a student's chosen starter pet begins at level 1 with no test taken. */
export async function signUp(
  credentials: Credentials & { petLineId?: string; subject?: string },
): Promise<AuthError | void> {
  const username = clean(credentials.username, 40);
  const email = cleanEmail(credentials.email);
  if (!username || !email) throw new Error("Username and email are required");
  const role = credentials.role === "teacher" ? "teacher" : "student";
  const line = petLines.find((l) => l.id === credentials.petLineId && isStarterPet(l));
  if (role === "student" && !line) throw new Error("Students start with a common pet");
  // A teacher teaches one subject, chosen here for good.
  const subject = teacherSubject(credentials.subject);
  if (role === "teacher" && !subject) throw new Error("Teachers pick the subject they teach");

  const result = await createAccount({
    username,
    email,
    password: String(credentials.password),
    role,
    classCode: clean(credentials.classCode, 10),
    progress:
      role === "student" && line ? { pet: { lineId: line.id, level: 1, xp: 0 } } : { subject: subject?.id },
  });
  if ("error" in result) return { error: result.error };
  await startSession(result.account.id);
  redirect(homeFor(role));
}

/**
 * Logs in when the username, email and password all belong to one account.
 * Too many wrong tries block the username for a while (login-limit.ts).
 */
export async function logIn(credentials: Credentials): Promise<AuthError | void> {
  const username = clean(credentials.username, 40);
  const email = cleanEmail(credentials.email);
  if (!username || !email) throw new Error("Username and email are required");
  const minutes = await loginBlockedMinutes(username);
  if (minutes > 0) return { error: "blocked", minutes };
  const account = await checkLogin({ username, email, password: String(credentials.password) });
  if (!account) {
    await recordLoginFailure(username);
    return { error: "unknown" };
  }
  await clearLoginFailures(username);

  const classCode = clean(credentials.classCode, 10);
  if (classCode && classCode !== account.classCode) await saveAccount({ ...account, classCode });
  await startSession(account.id);
  redirect(homeFor(account.role));
}

/** Logs in a new throwaway demo student: Dollfin, a common pet, at level 1, no test taken yet. */
export async function demoLogIn() {
  const account = await createDemoAccount({ pet: { lineId: "dollfin", level: 1, xp: 0 } });
  await startSession(account.id);
  // Each demo is a new account; clear out old ones once the response is sent.
  after(deleteOldDemoAccounts);
  redirect("/");
}

/** A fresh demo teacher in the same class as the demo students. */
export async function demoTeacherLogIn() {
  const account = await createDemoAccount({ subject: "math" }, "teacher");
  await startSession(account.id);
  after(deleteOldDemoAccounts);
  redirect("/teacher");
}

/**
 * The assignment demo: a demo teacher publishes a game assignment to a class
 * of its own, and the visitor logs in as a demo student of that class to get
 * it, play it and then see the teacher's results with `switchDemoTour`.
 */
export async function assignmentDemoLogIn() {
  // Its own class, so other visitors' demo assignments don't show up.
  // Digits only after the prefix, so normalClassCode() leaves it as it is.
  const classCode = `ДЕМО-${randomBytes(2).readUInt16BE() % 10000}`;
  const teacher = await createDemoAccount({ subject: "math" }, "teacher", classCode);
  const assignmentId = await saveAssignment(teacher.id, {
    title: "Бутархайн дасгал",
    classCode,
    subject: "math",
    games: ["snake", "mole", "cards"],
    gameMode: "fixed",
    target: "class",
    questions: demoQuestions("math", 6),
  });
  await setAssignmentStatus(teacher.id, assignmentId, "published");
  const student = await createDemoAccount(
    { pet: { lineId: "dollfin", level: 1, xp: 0 }, demoTour: { otherId: teacher.id, assignmentId } },
    "student",
    classCode,
  );
  await saveAccount({
    id: teacher.id,
    classCode,
    progress: { subject: "math", demoTour: { otherId: student.id, assignmentId } },
  });
  await startSession(student.id);
  after(deleteOldDemoAccounts);
  redirect("/assignments");
}

/** In the assignment demo, switches between the student and the teacher. */
export async function switchDemoTour() {
  const tour = (await readSession())?.demoTour;
  const other = tour && (await findAccountById(tour.otherId));
  // Only ever into the paired demo account.
  if (!tour || !other?.demo) redirect("/");
  await startSession(other.id);
  redirect(other.role === "teacher" ? `/teacher/assignments/${tour.assignmentId}` : "/assignments");
}

/** Ends the session; the account stays so the user can log in again. */
export async function logOut() {
  await clearSession();
  redirect("/login");
}

/** Saves the diagnostic test answers; only known questions and options are kept. */
export async function submitTest(answers: Record<string, number>) {
  const session = await readSession();
  if (!session) redirect("/login");

  const testAnswers: Record<string, number> = {};
  for (const q of testQuestions) {
    const index = answers[q.id];
    if (Number.isInteger(index) && index >= 0 && index < q.options.length) {
      testAnswers[q.id] = index;
    }
  }
  await writeSession({
    ...session, testAnswers,
    streak: Object.keys(testAnswers).length > 0 ? recordLearningDay(session.streak) : session.streak,
  });
}

/** XP for the first correct answer to a practice question. */
const PRACTICE_XP = 10;

/** Records a correct practice answer and gives XP the first time. */
export async function savePractice(questionId: string, index: number) {
  const session = await readSession();
  if (!session) redirect("/login");
  const question = lessons
    .flatMap((l) => l.practice)
    .find((q) => q.id === questionId);
  const solved = session.practiceSolved ?? [];
  if (!question || !Number.isInteger(index) || index < 0 || index >= question.options.length) {
    return;
  }

  const firstCorrect = index === question.correctIndex && !solved.includes(questionId);

  await writeSession({
    ...session,
    streak: recordLearningDay(session.streak),
    practiceSolved: firstCorrect ? [...solved, questionId] : solved,
    pet: session.pet && firstCorrect ? addXp(session.pet, PRACTICE_XP) : session.pet,
  });
}

/** Retest score needed to master a subtopic: all but one correct. */
const passMark = (total: number) => Math.max(1, total - 1);

/**
 * Scores a subtopic's retest. Passing masters the subtopic (the pet gains a
 * level the first time) and opens the mastered page; otherwise the lesson
 * opens again with the score.
 */
export async function submitRetest(subtopicId: string, answers: Record<string, number>) {
  const session = await readSession();
  if (!session) redirect("/login");
  const subtopic = subtopics.find((s) => s.id === subtopicId);
  const questions = await getRetestQuestions(subtopicId);
  if (!subtopic || questions.length === 0) redirect("/");

  const correct = questions.filter((q) => answers[q.id] === q.correctIndex).length;
  const passed = correct >= passMark(questions.length);
  const mastered = session.mastered ?? [];
  const firstTime = passed && !mastered.includes(subtopicId);
  const pet = session.pet && firstTime ? addXp(session.pet, XP_PER_LEVEL) : session.pet;
  const level = session.pet?.level ?? 1;

  await writeSession({
    ...session,
    pet,
    streak: questions.some((q) => Number.isInteger(answers[q.id]) && answers[q.id] >= 0 && answers[q.id] < q.options.length)
      ? recordLearningDay(session.streak) : session.streak,
    mastered: firstTime ? [...mastered, subtopicId] : mastered,
    lastRetest: {
      subtopicId,
      correct,
      total: questions.length,
      passed,
      fromLevel: level,
      toLevel: pet?.level ?? level,
    },
  });
  redirect(
    passed
      ? `/mastered/${subtopicId}`
      : `/lesson/${subtopic.topicId}?sub=${subtopicId}&retest=failed`,
  );
}
