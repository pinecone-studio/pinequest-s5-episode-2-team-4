// Mock accounts and session kept in cookies until there is a real backend
// and auth. The cookies are not signed or encrypted and passwords are not
// checked, so this is for the demo only: replace it with real auth before
// storing anything private.

import { cookies } from "next/headers";
import type { Assignment, SchoolClass, User, UserPet } from "./types";

/** Who is logged in: just the username. */
const SESSION_COOKIE_NAME = "levelup-session";
/** Accounts signed up in this browser, so logging out keeps them. */
const ACCOUNTS_COOKIE_NAME = "levelup-accounts";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days
/** Teachers' classes and assignments, kept apart so accounts stay small. */
const TEACHER_COOKIE_NAME = "levelup-teacher";
/** Keeps the accounts cookie well under the 4 KB cookie limit. */
const MAX_ACCOUNTS = 8;
/** Keeps the teacher cookie under the limit too. */
const MAX_CLASSES = 4;
const MAX_ASSIGNMENTS = 6;

export type Account = {
  username: string;
  role: User["role"];
  classCode?: string;
  /** School grade and subject id (see src/lib/school.ts); default 7 / math. */
  grade?: number;
  subject?: string;
  pet?: UserPet;
  /** Selected option index per diagnostic test question id. */
  testAnswers?: Record<string, number>;
  /** Practice question ids answered correctly at least once. */
  practiceSolved?: string[];
  /** Subtopic ids mastered by passing their retest. */
  mastered?: string[];
  /** The latest retest, for the mastered page. */
  lastRetest?: {
    subtopicId: string;
    correct: number;
    total: number;
    passed: boolean;
    /** Pet level before and after the retest. */
    fromLevel: number;
    toLevel: number;
  };
};

/** The logged-in user's account. */
export type Session = Account;

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  maxAge: MAX_AGE,
} as const;

function encode(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function decode<T>(value: string | undefined): T | undefined {
  if (!value) return undefined;
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
  } catch {
    return undefined;
  }
}

/** Usernames match case-insensitively. */
const keyOf = (username: string) => username.toLowerCase();

async function readAccounts(): Promise<Record<string, Account>> {
  const accounts = decode<Record<string, Account>>(
    (await cookies()).get(ACCOUNTS_COOKIE_NAME)?.value,
  );
  return accounts && typeof accounts === "object" ? accounts : {};
}

/** Every account signed up in this browser. */
export async function listAccounts(): Promise<Account[]> {
  return Object.values(await readAccounts());
}

export async function findAccount(username: string): Promise<Account | undefined> {
  return (await readAccounts())[keyOf(username)];
}

/** The current session, or undefined when logged out. */
export async function readSession(): Promise<Session | undefined> {
  const session = decode<{ username?: unknown }>(
    (await cookies()).get(SESSION_COOKIE_NAME)?.value,
  );
  if (typeof session?.username !== "string") return undefined;
  return findAccount(session.username);
}

/**
 * Saves the account and logs it in. Only call from Server Functions:
 * cookies can't be set while rendering.
 */
export async function writeSession(account: Account) {
  const accounts = await readAccounts();
  delete accounts[keyOf(account.username)];
  // Newest last; drop the oldest accounts past the limit.
  const kept = Object.entries({ ...accounts, [keyOf(account.username)]: account }).slice(
    -MAX_ACCOUNTS,
  );

  const store = await cookies();
  store.set(ACCOUNTS_COOKIE_NAME, encode(Object.fromEntries(kept)), cookieOptions);
  store.set(SESSION_COOKIE_NAME, encode({ username: account.username }), cookieOptions);
}

/** Logs out but keeps the account. Only call from Server Functions. */
export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE_NAME);
}

/** For proxy.ts, which reads cookies from the request itself. */
export const SESSION_COOKIE = SESSION_COOKIE_NAME;

export type TeacherData = {
  classes: SchoolClass[];
  assignments: Assignment[];
};

async function readTeacherStore(): Promise<Record<string, TeacherData>> {
  const store = decode<Record<string, TeacherData>>(
    (await cookies()).get(TEACHER_COOKIE_NAME)?.value,
  );
  return store && typeof store === "object" ? store : {};
}

/** A teacher's classes and assignments; empty for a new teacher. */
export async function readTeacherData(username: string): Promise<TeacherData> {
  const data = (await readTeacherStore())[keyOf(username)];
  return {
    classes: Array.isArray(data?.classes) ? data.classes : [],
    assignments: Array.isArray(data?.assignments) ? data.assignments : [],
  };
}

/** Every teacher's assignments in this browser, for the students' side. */
export async function listAssignments(): Promise<Assignment[]> {
  return Object.values(await readTeacherStore()).flatMap((d) =>
    Array.isArray(d?.assignments) ? d.assignments : [],
  );
}

/** Saves a teacher's data, keeping the newest. Only call from Server Functions. */
export async function writeTeacherData(username: string, data: TeacherData) {
  const store = await readTeacherStore();
  store[keyOf(username)] = {
    classes: data.classes.slice(-MAX_CLASSES),
    assignments: data.assignments.slice(-MAX_ASSIGNMENTS),
  };
  (await cookies()).set(TEACHER_COOKIE_NAME, encode(store), cookieOptions);
}
