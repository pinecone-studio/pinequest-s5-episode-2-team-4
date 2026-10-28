// LevelUp accounts (server only), in the accounts table
// (supabase/migrations/0008_accounts.sql). Passwords are hashed here with
// scrypt and a random salt per account; plain passwords are never stored.

import "server-only";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { exactName } from "./players";
import type { Account } from "./session";
import { getSupabaseAdmin } from "./supabase";
import type { User } from "./types";

/** Shortest password an account can have. */
export const MIN_PASSWORD_LENGTH = 6;

/** Learning progress saved with the account. */
export type AccountProgress = Omit<Account, "id" | "username" | "email" | "role" | "classCode">;

export type StoredAccount = {
  id: string;
  username: string;
  /** Lowercase; demo accounts have none. */
  email?: string;
  role: User["role"];
  classCode?: string;
  /** A throwaway demo account, which can't be logged into. */
  demo: boolean;
  progress: AccountProgress;
};

type Row = {
  id: string;
  username: string;
  email: string | null;
  password_hash: string | null;
  role: User["role"];
  class_code: string | null;
  progress: AccountProgress | null;
  demo: boolean;
};

const COLUMNS = "id, username, email, password_hash, role, class_code, progress, demo";

const db = () => getSupabaseAdmin();

function toAccount(row: Row): StoredAccount {
  return {
    id: row.id,
    username: row.username,
    email: row.email ?? undefined,
    role: row.role,
    classCode: row.class_code ?? undefined,
    demo: row.demo,
    progress: row.progress ?? {},
  };
}

// scrypt cost, saved in each hash so it can be raised later: 16 MiB of
// memory with r = 8 and p = 5, a setting OWASP recommends.
const COST = { N: 2 ** 14, r: 8, p: 5 };
const SALT_BYTES = 16;
const KEY_BYTES = 32;

function derive(password: string, salt: Buffer, cost: typeof COST, keyBytes: number) {
  return new Promise<Buffer>((resolve, reject) =>
    scrypt(
      // The same password typed on another keyboard can arrive composed differently.
      password.normalize("NFC"),
      salt,
      keyBytes,
      { ...cost, maxmem: 256 * cost.N * cost.r },
      (error, key) => (error ? reject(error) : resolve(key)),
    ),
  );
}

/** `scrypt$N$r$p$salt$key`, salt and key in base64. */
async function hashPassword(password: string) {
  const salt = randomBytes(SALT_BYTES);
  const key = await derive(password, salt, COST, KEY_BYTES);
  return ["scrypt", COST.N, COST.r, COST.p, salt.toString("base64"), key.toString("base64")].join("$");
}

async function passwordMatches(password: string, hash: string) {
  const [scheme, N, r, p, salt, key] = hash.split("$");
  if (scheme !== "scrypt" || !salt || !key) return false;
  const expected = Buffer.from(key, "base64");
  const cost = { N: Number(N), r: Number(r), p: Number(p) };
  return timingSafeEqual(await derive(password, Buffer.from(salt, "base64"), cost, expected.length), expected);
}

/** Checked against for unknown usernames, so they take as long as a wrong password. */
let dummyHash: Promise<string> | undefined;

/** A new account, or which of its unique fields another account already has. */
export async function createAccount(input: {
  username: string;
  email: string;
  password: string;
  role: User["role"];
  classCode?: string;
  progress?: AccountProgress;
}): Promise<{ account: StoredAccount } | { error: "taken" | "emailTaken" }> {
  if ([...input.password].length < MIN_PASSWORD_LENGTH) throw new Error("Password is too short");
  const { data, error } = await db()
    .from("accounts")
    .insert({
      username: input.username,
      email: input.email.toLowerCase(),
      password_hash: await hashPassword(input.password),
      role: input.role,
      class_code: input.classCode ?? null,
      progress: input.progress ?? {},
    })
    .select(COLUMNS)
    .single<Row>();
  // Unique violation: the message names the index.
  if (error?.code === "23505") {
    return { error: error.message.includes("accounts_email_key") ? "emailTaken" : "taken" };
  }
  if (error) throw new Error(`Could not create account: ${error.message}`);
  return { account: toAccount(data) };
}

/** A throwaway demo student with a fresh name, no email and no password. */
export async function createDemoAccount(progress: AccountProgress): Promise<StoredAccount> {
  for (let attempt = 1; ; attempt++) {
    const { data, error } = await db()
      .from("accounts")
      .insert({ username: `Демо-${randomBytes(3).toString("hex")}`, role: "student", demo: true, progress })
      .select(COLUMNS)
      .single<Row>();
    if (!error) return toAccount(data);
    // A name clash is unlikely; try another name.
    if (error.code !== "23505" || attempt === 3) {
      throw new Error(`Could not create demo account: ${error.message}`);
    }
  }
}

/** How long a demo account lasts. */
const DEMO_LIFETIME_MS = 24 * 60 * 60 * 1000;
/** Usernames per players delete, so each request URL stays short. */
const DELETE_BATCH = 100;

/**
 * Deletes demo accounts older than a day, with their game data: the players
 * row of the same name, whose pets, eggs, battle answers and English progress
 * go with it. Real accounts are never touched.
 */
export async function deleteOldDemoAccounts() {
  const { data, error } = await db()
    .from("accounts")
    .delete()
    .eq("demo", true)
    .lt("created_at", new Date(Date.now() - DEMO_LIFETIME_MS).toISOString())
    .select("username");
  if (error) throw new Error(`Could not delete old demo accounts: ${error.message}`);
  const names = (data ?? []).map((a: { username: string }) => a.username);
  for (let i = 0; i < names.length; i += DELETE_BATCH) {
    const players = await db().from("players").delete().in("username", names.slice(i, i + DELETE_BATCH));
    if (players.error) throw new Error(`Could not delete demo players: ${players.error.message}`);
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function findAccountById(id: string): Promise<StoredAccount | undefined> {
  if (!UUID.test(id)) return undefined;
  const { data, error } = await db().from("accounts").select(COLUMNS).eq("id", id).maybeSingle<Row>();
  if (error) throw new Error(`Could not load account: ${error.message}`);
  return data ? toAccount(data) : undefined;
}

/**
 * The account these credentials log in to: username (any case), email (any
 * case) and password must all match it. Undefined otherwise, without saying
 * which one was wrong.
 */
export async function checkLogin(credentials: {
  username: string;
  email: string;
  password: string;
}): Promise<StoredAccount | undefined> {
  const { data, error } = await db()
    .from("accounts")
    .select(COLUMNS)
    .ilike("username", exactName(credentials.username))
    .maybeSingle<Row>();
  if (error) throw new Error(`Could not load account: ${error.message}`);
  const hash = data?.password_hash ?? (await (dummyHash ??= hashPassword(randomBytes(16).toString("hex"))));
  const passwordOk = await passwordMatches(credentials.password, hash);
  if (!data || data.demo || data.email !== credentials.email.toLowerCase() || !passwordOk) return undefined;
  return toAccount(data);
}

/** Saves the class code and learning progress; nothing else changes after signup. */
export async function saveAccount(account: Pick<StoredAccount, "id" | "classCode" | "progress">) {
  const { error } = await db()
    .from("accounts")
    .update({ class_code: account.classCode ?? null, progress: account.progress })
    .eq("id", account.id);
  if (error) throw new Error(`Could not save account: ${error.message}`);
}
