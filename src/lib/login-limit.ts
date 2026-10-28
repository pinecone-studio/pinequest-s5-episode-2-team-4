// Stops password guessing (server only): after MAX_FAILURES wrong logins for
// a username within WINDOW_MINUTES, that username can't log in for
// BLOCK_MINUTES after the last one. Attempts live in the login_failures table
// (supabase/migrations/0009_login_failures.sql).

import "server-only";
import { getSupabaseAdmin } from "./supabase";

const MAX_FAILURES = 5;
const WINDOW_MINUTES = 15;
const BLOCK_MINUTES = 15;
/** Attempts older than this can't matter any more and are deleted. */
const KEEP_MINUTES = WINDOW_MINUTES + BLOCK_MINUTES;

const MINUTE = 60_000;
const db = () => getSupabaseAdmin();
/** Usernames match case-insensitively, like the login. */
const keyOf = (username: string) => username.toLowerCase();

/** Whole minutes until this username may try again; 0 when it isn't blocked. */
export async function loginBlockedMinutes(username: string): Promise<number> {
  const { data, error } = await db()
    .from("login_failures")
    .select("failed_at")
    .eq("username_key", keyOf(username))
    .gte("failed_at", new Date(Date.now() - KEEP_MINUTES * MINUTE).toISOString())
    .order("failed_at", { ascending: false })
    .limit(MAX_FAILURES);
  if (error) throw new Error(`Could not check failed logins: ${error.message}`);
  if (!data || data.length < MAX_FAILURES) return 0;

  const latest = Date.parse(data[0].failed_at);
  const earliest = Date.parse(data[MAX_FAILURES - 1].failed_at);
  if (latest - earliest > WINDOW_MINUTES * MINUTE) return 0;
  return Math.max(0, Math.ceil((latest + BLOCK_MINUTES * MINUTE - Date.now()) / MINUTE));
}

/** Counts a wrong login, and drops attempts too old to matter. */
export async function recordLoginFailure(username: string) {
  const { error } = await db().from("login_failures").insert({ username_key: keyOf(username) });
  if (error) throw new Error(`Could not record failed login: ${error.message}`);
  await db()
    .from("login_failures")
    .delete()
    .lt("failed_at", new Date(Date.now() - KEEP_MINUTES * MINUTE).toISOString());
}

/** Forgets this username's wrong logins, after a successful login. */
export async function clearLoginFailures(username: string) {
  const { error } = await db().from("login_failures").delete().eq("username_key", keyOf(username));
  if (error) throw new Error(`Could not clear failed logins: ${error.message}`);
}
