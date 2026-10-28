"use server";

// Server Functions for teacher content. Every one checks that a teacher is
// logged in and only touches that teacher's rows; inputs from the browser
// are re-validated here.

import { redirect } from "next/navigation";
import { readSession, writeSession } from "./session";
import { teacherSubject } from "./subjects";

/** For teacher accounts made before teachers picked a subject: picks it once. */
export async function chooseTeacherSubject(form: FormData) {
  const session = await readSession();
  if (session?.role !== "teacher") redirect("/login");
  const subject = teacherSubject(form.get("subject"));
  if (subject && !session.subject) await writeSession({ ...session, subject: subject.id });
  redirect("/teacher");
}
