// Role checks for layouts. proxy.ts only checks that a session cookie
// exists; these also catch a cookie without an account and the wrong role.

import { redirect } from "next/navigation";
import { getCurrentUser } from "./data";
import type { User } from "./types";

/** The logged-in student; teachers go to their dashboard. */
export async function requireStudent(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "teacher") redirect("/teacher");
  return user;
}

/** The logged-in teacher; students go home. */
export async function requireTeacher(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "student") redirect("/");
  return user;
}
