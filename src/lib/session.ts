// Mock session kept in a cookie until there is a real backend and auth.
// The cookie is not signed or encrypted, so it is for the demo only:
// replace it with real sessions before storing anything private.

import { cookies } from "next/headers";
import type { User, UserPet } from "./types";

const COOKIE_NAME = "levelup-session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type Session = {
  username: string;
  role: User["role"];
  classCode?: string;
  pet?: UserPet;
  /** Selected option index per diagnostic test question id. */
  testAnswers?: Record<string, number>;
};

function decode(value: string): Session | undefined {
  try {
    const session = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as Session;
    return typeof session.username === "string" ? session : undefined;
  } catch {
    return undefined;
  }
}

/** The current session, or undefined when logged out. */
export async function readSession(): Promise<Session | undefined> {
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  return value ? decode(value) : undefined;
}

/** Only call from Server Functions: cookies can't be set while rendering. */
export async function writeSession(session: Session) {
  (await cookies()).set(
    COOKIE_NAME,
    Buffer.from(JSON.stringify(session)).toString("base64url"),
    { httpOnly: true, sameSite: "lax", path: "/", maxAge: MAX_AGE },
  );
}

/** Only call from Server Functions. */
export async function clearSession() {
  (await cookies()).delete(COOKIE_NAME);
}

/** For proxy.ts, which reads cookies from the request itself. */
export const SESSION_COOKIE = COOKIE_NAME;
