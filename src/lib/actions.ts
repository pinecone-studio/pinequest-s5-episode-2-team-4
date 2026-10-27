"use server";

// Server Functions that change the mock session. Client Components import
// these directly; they run on the server.

import { redirect } from "next/navigation";
import { getRetestQuestions } from "./data";
import { lessons } from "./mock/lessons";
import { petLines } from "./mock/pets";
import { testQuestions } from "./mock/questions";
import { subtopics } from "./mock/topics";
import { XP_PER_LEVEL, addXp } from "./pets";
import { clearSession, findAccount, readSession, writeSession } from "./session";
import type { User } from "./types";
import { recordLearningDay } from "./streak";

type Credentials = {
  username: string;
  role: User["role"];
  classCode?: string;
};

/** Returned instead of redirecting when the form needs to show an error. */
export type AuthError = { error: "taken" | "unknown" };

function clean(text: string | undefined, max: number) {
  return text?.trim().slice(0, max) || undefined;
}

function homeFor(role: User["role"]) {
  return role === "teacher" ? "/teacher" : "/";
}

/** A new account: the chosen pet starts at level 1 with no test taken. */
export async function signUp(
  credentials: Credentials & { petLineId?: string },
): Promise<AuthError | void> {
  const username = clean(credentials.username, 40);
  if (!username) throw new Error("Username is required");
  if (await findAccount(username)) return { error: "taken" };
  const role = credentials.role === "teacher" ? "teacher" : "student";
  const line = petLines.find((l) => l.id === credentials.petLineId);

  await writeSession({
    username,
    role,
    classCode: clean(credentials.classCode, 10),
    pet: role === "student" && line ? { lineId: line.id, level: 1, xp: 0 } : undefined,
  });
  redirect(homeFor(role));
}

/** Logs in to an account signed up in this browser, with its pet and progress. */
export async function logIn(credentials: Credentials): Promise<AuthError | void> {
  const username = clean(credentials.username, 40);
  if (!username) throw new Error("Username is required");
  const account = await findAccount(username);
  if (!account) return { error: "unknown" };

  const classCode = clean(credentials.classCode, 10);
  await writeSession(classCode ? { ...account, classCode } : account);
  redirect(homeFor(account.role));
}

const DEMO_USERNAME = "Демо";

/** Logs in a fresh demo student: Wrougon at level 1, no test taken yet. */
export async function demoLogIn() {
  await writeSession({
    username: DEMO_USERNAME,
    role: "student",
    pet: { lineId: "wrougon", level: 1, xp: 0 },
  });
  redirect("/");
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
