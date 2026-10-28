// The logged-in session. Accounts live in the accounts table
// (src/lib/accounts.ts); the session cookie only holds the account id,
// signed with SESSION_SECRET so it can't be edited or faked.

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { type AccountProgress, findAccountById, saveAccount } from "./accounts";
import type { User, UserPet } from "./types";
import type { LearningStreak } from "./streak";

/** Who is logged in: the account id. */
const SESSION_COOKIE_NAME = "levelup-session";
/** Mock accounts from before real accounts; deleted at the next login. */
const OLD_ACCOUNTS_COOKIE_NAME = "levelup-accounts";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type Account = {
  id: string;
  streak?: LearningStreak;
  username: string;
  /** Lowercase; demo accounts have none. */
  email?: string;
  role: User["role"];
  classCode?: string;
  /** A throwaway «Демо нэвтрэх» account. */
  demo?: boolean;
  pet?: UserPet;
  /** Selected option index per diagnostic test question id. */
  testAnswers?: Record<string, number>;
  /** Practice question ids answered correctly at least once. */
  practiceSolved?: string[];
  /** Subtopic ids mastered by passing their retest. */
  mastered?: string[];
  /** Teachers: the one subject they teach, picked at sign-up (subjects.ts id). */
  subject?: string;
  /** Game ids the student likes most, for assignments played "by interest". */
  favoriteGames?: string[];
  /** Assignment ids that already gave XP, so replays don't farm it. */
  assignmentsRewarded?: string[];
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

/** Account fields that aren't learning progress. */
const IDENTITY_KEYS = ["id", "username", "email", "role", "classCode", "demo"] as const satisfies (keyof Account)[];

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  maxAge: MAX_AGE,
} as const;

// A fixed secret keeps local development working before `.env.local` has
// one; production must set its own.
const DEV_SECRET = "levelup-dev-only-secret";

function secret() {
  const value = process.env.SESSION_SECRET;
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET is not set");
  }
  return DEV_SECRET;
}

const sign = (payload: string) =>
  createHmac("sha256", secret()).update(payload).digest("base64url");

/** `payload.signature`, both base64url. */
function encode(value: unknown) {
  const payload = Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/** Undefined for a missing, unsigned or tampered cookie. */
function decode<T>(value: string | undefined): T | undefined {
  const [payload, signature, extra] = value?.split(".") ?? [];
  if (!payload || !signature || extra !== undefined) return undefined;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return undefined;
  }
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as T;
  } catch {
    return undefined;
  }
}

async function loadAccount(id: string): Promise<Session | undefined> {
  const account = await findAccountById(id);
  if (!account) return undefined;
  return {
    ...account.progress,
    id: account.id,
    username: account.username,
    email: account.email,
    role: account.role,
    classCode: account.classCode,
    demo: account.demo,
  };
}

/**
 * The account loaded for this request: layouts, pages and data functions
 * all read the session, so it's fetched once. writeSession keeps it current.
 */
const requestAccount = cache((): { id?: string; account?: Promise<Session | undefined> } => ({}));

/** The current session, or undefined when logged out. */
export async function readSession(): Promise<Session | undefined> {
  const session = decode<{ id?: unknown }>((await cookies()).get(SESSION_COOKIE_NAME)?.value);
  if (typeof session?.id !== "string") return undefined;
  const loaded = requestAccount();
  if (loaded.id !== session.id || !loaded.account) {
    loaded.id = session.id;
    loaded.account = loadAccount(session.id);
  }
  return loaded.account;
}

/** Saves the logged-in account's class code and progress. Only call from Server Functions. */
export async function writeSession(session: Session) {
  const progress: Record<string, unknown> = { ...session };
  for (const key of IDENTITY_KEYS) delete progress[key];
  await saveAccount({ id: session.id, classCode: session.classCode, progress: progress as AccountProgress });
  Object.assign(requestAccount(), { id: session.id, account: Promise.resolve(session) });
}

/** Logs in to this account. Only call from Server Functions: cookies can't be set while rendering. */
export async function startSession(accountId: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, encode({ id: accountId }), cookieOptions);
  store.delete(OLD_ACCOUNTS_COOKIE_NAME);
}

/** Logs out; the account stays so the user can log in again. Only call from Server Functions. */
export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE_NAME);
}

/** For proxy.ts, which reads cookies from the request itself. */
export const SESSION_COOKIE = SESSION_COOKIE_NAME;
