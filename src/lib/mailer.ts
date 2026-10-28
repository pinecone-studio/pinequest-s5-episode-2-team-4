// Sends email (server only) from a Gmail account over its SMTP server, with
// an app password: GMAIL_USER and GMAIL_APP_PASSWORD in .env.local. Without
// them, development prints each email to the server console instead.

import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

export type Email = { to: string; subject: string; text: string; html: string };

function gmail() {
  const user = process.env.GMAIL_USER;
  // Google shows app passwords in groups of four with spaces.
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");
  return user && pass ? { user, pass } : undefined;
}

/** Throws in production when Gmail isn't set up, so it isn't found out only by emails that never arrive. */
export function assertMailConfigured() {
  if (!gmail() && process.env.NODE_ENV === "production") {
    throw new Error("Email is not configured: set GMAIL_USER and GMAIL_APP_PASSWORD");
  }
}

let transport: Transporter | undefined;

export async function sendEmail(email: Email) {
  const auth = gmail();
  if (!auth) {
    assertMailConfigured();
    console.log(`[email to ${email.to}] ${email.subject}\n${email.text}`);
    return;
  }
  transport ??= nodemailer.createTransport({ service: "gmail", auth });
  await transport.sendMail({ from: { name: "LevelUp", address: auth.user }, ...email });
}
