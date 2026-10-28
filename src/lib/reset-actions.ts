"use server";

// Server Functions for "Нууц үг мартсан?"; the work is in password-reset.ts.
// Client Components import these directly; they run on the server.

import { redirect } from "next/navigation";
import { after } from "next/server";
import { sendEmail } from "./mailer";
import { assertResetConfigured, prepareReset, redeemReset } from "./password-reset";
import { startSession } from "./session";

/** Just the shape, like the login; the form's email field checks it first. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Emails a reset link when an account has this address. The work happens
 * after the response, so the answer looks the same, and takes as long, either way.
 */
export async function requestPasswordReset(email: string) {
  const address = String(email).trim().toLowerCase().slice(0, 254);
  if (!EMAIL.test(address)) throw new Error("Email is required");
  assertResetConfigured();
  after(async () => {
    const message = await prepareReset(address);
    if (message) await sendEmail(message);
  });
}

/** Sets a new password from a reset link and logs in; "expired" when the link no longer works. */
export async function resetPassword(token: string, password: string): Promise<{ error: "expired" } | void> {
  const account = await redeemReset(String(token), String(password));
  if (!account) return { error: "expired" };
  await startSession(account.id);
  redirect(account.role === "teacher" ? "/teacher" : "/");
}
