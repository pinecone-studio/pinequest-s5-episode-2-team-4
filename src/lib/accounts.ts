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
export type AccountProgress = Omit<Account, "id" | "username" | "email" | "role" | "classCode" | "demo">;

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

/**
 * A Mongolian phone number as 8 digits, from "9911 2233", "+976 99112233"
 * and the like; undefined if it isn't one.
 */
export function normalPhone(text: string | undefined) {
  const digits = text?.replace(/[\s()+-]/g, "") ?? "";
  const local = digits.length === 11 && digits.startsWith("976") ? digits.slice(3) : digits;
  return /^\d{8}$/.test(local) ? local : undefined;
}

/** A new account, or which of its unique fields another account already has. */
export async function createAccount(input: {
  username: string;
  email: string;
  password: string;
  role: User["role"];
  /** normalPhone() digits; optional */
  phone?: string;
  progress?: AccountProgress;
}): Promise<{ account: StoredAccount } | { error: "taken" | "emailTaken" | "phoneTaken" }> {
  if ([...input.password].length < MIN_PASSWORD_LENGTH) throw new Error("Password is too short");
  const { data, error } = await db()
    .from("accounts")
    .insert({
      username: input.username,
      email: input.email.toLowerCase(),
      password_hash: await hashPassword(input.password),
      role: input.role,
      // Only sent when given, so sign-up works before the 0017 migration adds the column.
      ...(input.phone ? { phone: input.phone } : {}),
      progress: input.progress ?? {},
    })
    .select(COLUMNS)
    .single<Row>();
  // Unique violation: the message names the index.
  if (error?.code === "23505") {
    if (error.message.includes("accounts_email_key")) return { error: "emailTaken" };
    return { error: error.message.includes("accounts_phone_key") ? "phoneTaken" : "taken" };
  }
  if (error) throw new Error(`Could not create account: ${error.message}`);
  return { account: toAccount(data) };
}

/** Longest username. */
const USERNAME_MAX = 40;

/** Guests' made-up emails end with this; it's never shown to anyone. */
export const GUEST_EMAIL_DOMAIN = "@levelup.invalid";

/**
 * A student who joins from a QR with only their name (e.g. a judge at a
 * pitch). It's a normal account, so it gets the class's real lessons, but
 * with an email and password nobody knows: it lives in this browser's
 * session and is deleted after a day like the demo accounts. A name that's
 * taken gets a number: "Бат 2".
 */
export async function createGuestAccount(name: string, progress: AccountProgress): Promise<StoredAccount> {
  for (let n = 1; n <= 20; n++) {
    const suffix = n === 1 ? "" : ` ${n}`;
    const result = await createAccount({
      username: name.slice(0, USERNAME_MAX - suffix.length) + suffix,
      email: `guest-${randomBytes(8).toString("hex")}${GUEST_EMAIL_DOMAIN}`,
      password: randomBytes(18).toString("base64url"),
      role: "student",
      progress: { ...progress, guest: true },
    });
    if ("account" in result) return result.account;
  }
  throw new Error("Could not find a free name for a guest");
}

/** The class every demo account is in, so a demo teacher's work reaches demo students. */
// Cyrillic, as class codes are compared after normalClassCode().
export const DEMO_CLASS_CODE = "ДЕМО";

/** A throwaway demo student or teacher with a fresh name, no email and no password. */
export async function createDemoAccount(
  progress: AccountProgress,
  role: User["role"] = "student",
  classCode = DEMO_CLASS_CODE,
): Promise<StoredAccount> {
  for (let attempt = 1; ; attempt++) {
    const { data, error } = await db()
      .from("accounts")
      .insert({
        username: `${role === "teacher" ? "Демо-багш" : "Демо"}-${randomBytes(3).toString("hex")}`,
        role,
        class_code: classCode,
        demo: true,
        progress,
      })
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
  const before = new Date(Date.now() - DEMO_LIFETIME_MS).toISOString();
  const demos = await db().from("accounts").delete().eq("demo", true).lt("created_at", before).select("username");
  if (demos.error) throw new Error(`Could not delete old demo accounts: ${demos.error.message}`);
  // Guests who joined from a QR (createGuestAccount) go too.
  const guests = await db()
    .from("accounts")
    .delete()
    .eq("progress->>guest", "true")
    .lt("created_at", before)
    .select("username");
  if (guests.error) throw new Error(`Could not delete old guest accounts: ${guests.error.message}`);
  const names = [...(demos.data ?? []), ...(guests.data ?? [])].map((a: { username: string }) => a.username);
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

/** The account with this email (any case). Demo accounts have no email. */
export async function findAccountByEmail(email: string): Promise<StoredAccount | undefined> {
  const { data, error } = await db()
    .from("accounts")
    .select(COLUMNS)
    .eq("email", email.toLowerCase())
    .eq("demo", false)
    .maybeSingle<Row>();
  if (error) throw new Error(`Could not load account: ${error.message}`);
  return data ? toAccount(data) : undefined;
}

/** The account with this phone (normalPhone() digits). Demo accounts have none. */
export async function findAccountByPhone(phone: string): Promise<StoredAccount | undefined> {
  const { data, error } = await db()
    .from("accounts")
    .select(COLUMNS)
    .eq("phone", phone)
    .eq("demo", false)
    .maybeSingle<Row>();
  if (error) throw new Error(`Could not load account: ${error.message}`);
  return data ? toAccount(data) : undefined;
}

/**
 * Points another account at a class (or none), e.g. a student just added to
 * or removed from one. The logged-in user changes their own via writeSession.
 */
export async function setAccountClass(id: string, classCode: string | null) {
  const { error } = await db().from("accounts").update({ class_code: classCode }).eq("id", id);
  if (error) throw new Error(`Could not set class: ${error.message}`);
}

/** Replaces the account's password, from a reset link. */
export async function setPassword(id: string, password: string) {
  if ([...password].length < MIN_PASSWORD_LENGTH) throw new Error("Password is too short");
  const { error } = await db()
    .from("accounts")
    .update({ password_hash: await hashPassword(password) })
    .eq("id", id);
  if (error) throw new Error(`Could not set password: ${error.message}`);
}

/** Saves the class code and learning progress; the password changes only through setPassword. */
export async function saveAccount(account: Pick<StoredAccount, "id" | "classCode" | "progress">) {
  const { error } = await db()
    .from("accounts")
    .update({ class_code: account.classCode ?? null, progress: account.progress })
    .eq("id", account.id);
  if (error) throw new Error(`Could not save account: ${error.message}`);
}
