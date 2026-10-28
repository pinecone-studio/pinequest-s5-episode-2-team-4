// "Нууц үг мартсан?" (server only): emails a link that sets a new password.
// Links live in the password_resets table
// (supabase/migrations/0010_password_resets.sql): only a hash of each token
// is stored, and a link works once, for RESET_MINUTES.

import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { MIN_PASSWORD_LENGTH, type StoredAccount, findAccountByEmail, findAccountById, setPassword } from "./accounts";
import { clearLoginFailures } from "./login-limit";
import { type Email, assertMailConfigured } from "./mailer";
import { getSupabaseAdmin } from "./supabase";

export const RESET_MINUTES = 30;
/** Reset emails per account per hour, so the form can't be used to spam someone. */
const MAX_PER_HOUR = 3;

const MINUTE = 60_000;
const db = () => getSupabaseAdmin();
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** Where links point: APP_URL, or the dev server in development. */
function appUrl() {
  const url = process.env.APP_URL;
  if (url) return url.replace(/\/+$/, "");
  if (process.env.NODE_ENV === "production") throw new Error("APP_URL is not set");
  return "http://localhost:3000";
}

/** Throws in production when email or APP_URL isn't set up, so a reset never fails silently. */
export function assertResetConfigured() {
  assertMailConfigured();
  appUrl();
}

const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function resetEmail(account: StoredAccount, link: string): Email {
  const intro = `LevelUp-ийн нууц үгээ шинэчлэх бол доорх холбоос дээр дарна уу. Холбоос ${RESET_MINUTES} минут хүчинтэй, нэг удаа ашиглагдана.`;
  const ignore = "Хэрэв та хүсэлт илгээгээгүй бол энэ имэйлийг үл тоомсорлоно уу. Таны нууц үг өөрчлөгдөхгүй.";
  return {
    to: account.email!,
    subject: "LevelUp: нууц үг сэргээх",
    text: `Сайн байна уу, ${account.username}!\n\n${intro}\n${link}\n\n${ignore}\n`,
    html:
      `<p>Сайн байна уу, ${escapeHtml(account.username)}!</p><p>${intro}</p>` +
      `<p><a href="${escapeHtml(link)}" style="display:inline-block;padding:12px 20px;border-radius:12px;background:#5b00ed;color:#fff;font-weight:bold;text-decoration:none">Нууц үг шинэчлэх</a></p>` +
      `<p style="color:#666">${ignore}</p>`,
  };
}

/**
 * The reset email for this address, with a new link. Undefined when no
 * account has the address or it already got MAX_PER_HOUR links this hour.
 */
export async function prepareReset(email: string): Promise<Email | undefined> {
  const account = await findAccountByEmail(email);
  if (!account) return undefined;

  const { count, error } = await db()
    .from("password_resets")
    .select("id", { count: "exact", head: true })
    .eq("account_id", account.id)
    .gte("created_at", new Date(Date.now() - 60 * MINUTE).toISOString());
  if (error) throw new Error(`Could not check reset links: ${error.message}`);
  if ((count ?? 0) >= MAX_PER_HOUR) return undefined;

  const token = randomBytes(32).toString("base64url");
  const inserted = await db()
    .from("password_resets")
    .insert({
      account_id: account.id,
      token_hash: hashToken(token),
      expires_at: new Date(Date.now() + RESET_MINUTES * MINUTE).toISOString(),
    });
  if (inserted.error) throw new Error(`Could not create reset link: ${inserted.error.message}`);
  // Links older than a day can't matter any more.
  await db()
    .from("password_resets")
    .delete()
    .lt("created_at", new Date(Date.now() - 24 * 60 * MINUTE).toISOString());

  return resetEmail(account, `${appUrl()}/reset-password?token=${token}`);
}

/** The account a link is for, while the link is unused and not expired. */
export async function findResetAccount(token: string): Promise<StoredAccount | undefined> {
  const { data, error } = await db()
    .from("password_resets")
    .select("account_id")
    .eq("token_hash", hashToken(token))
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle<{ account_id: string }>();
  if (error) throw new Error(`Could not check reset link: ${error.message}`);
  return data ? findAccountById(data.account_id) : undefined;
}

/**
 * Uses a link: sets the new password, stops the account's other links working
 * and lifts any failed-login block. Undefined when the link is used or expired.
 */
export async function redeemReset(token: string, password: string): Promise<StoredAccount | undefined> {
  // Before using up the link, so a too-short password can be fixed and resent.
  if ([...password].length < MIN_PASSWORD_LENGTH) throw new Error("Password is too short");
  const now = new Date().toISOString();
  // One update, so two requests with the same link can't both use it.
  const { data, error } = await db()
    .from("password_resets")
    .update({ used_at: now })
    .eq("token_hash", hashToken(token))
    .is("used_at", null)
    .gt("expires_at", now)
    .select("account_id")
    .maybeSingle<{ account_id: string }>();
  if (error) throw new Error(`Could not use reset link: ${error.message}`);
  const account = data && (await findAccountById(data.account_id));
  if (!account) return undefined;

  await setPassword(account.id, password);
  await db().from("password_resets").update({ used_at: now }).eq("account_id", account.id).is("used_at", null);
  await clearLoginFailures(account.username);
  return account;
}
