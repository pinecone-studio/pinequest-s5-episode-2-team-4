"use server";

// Server Functions that change the mock session. Client Components import
// these directly; they run on the server.

import { redirect } from "next/navigation";
import { petLines } from "./mock/pets";
import { testQuestions } from "./mock/questions";
import { clearSession, findAccount, readSession, writeSession } from "./session";
import type { User } from "./types";

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
  await writeSession({ ...session, testAnswers });
}
