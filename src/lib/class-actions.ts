"use server";

// Server Functions for classes: a teacher creates classes, picks the one to
// work in and adds students (by email, phone or a QR shown in class); a
// student picks which class (subject) to study in, or a subject to practise.

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import QRCode from "qrcode";
import {
  createGuestAccount,
  deleteOldDemoAccounts,
  findAccountByEmail,
  findAccountById,
  findAccountByPhone,
  normalPhone,
  setAccountClass,
} from "./accounts";
import { requireStudent, requireTeacher } from "./auth";
import { normalClassCode } from "./battle";
import {
  addMember,
  closeInvites,
  createClass,
  findInviteClass,
  findOpenInvite,
  listJoinedNames,
  openInvite,
  refreshInvite,
  removeMember,
} from "./classes";
import { getActiveClass, getStudentClasses, getTeacherClasses } from "./data";
import { readSession, startSession, writeSession } from "./session";
import { OPEN_GRADES, teacherSubject } from "./subjects";

async function setOwnClass(classCode: string | undefined) {
  const session = await readSession();
  if (session) await writeSession({ ...session, classCode });
}

/** The teacher's current class, or the class picker when there is none. */
async function teacherClass() {
  await requireTeacher();
  const active = await getActiveClass();
  if (!active) redirect("/classes");
  return active;
}

export type CreateClassResult = { error: "name" | "demo" | "failed" } | void;

/** A new class in the teacher's subject; opens it on its students page so they can be added. */
export async function createTeacherClass(name: string): Promise<CreateClassResult> {
  const user = await requireTeacher();
  if (user.demo) return { error: "demo" };
  const clean = normalClassCode(String(name)).slice(0, 5);
  if (!clean) return { error: "name" };
  let code: string;
  try {
    code = (await createClass(user.id, clean, user.subject ?? "math")).code;
  } catch (error) {
    console.error(error);
    return { error: "failed" };
  }
  await setOwnClass(code);
  redirect("/teacher/students");
}

/** Opens one of the teacher's classes. */
export async function selectClass(classId: string) {
  await requireTeacher();
  const found = (await getTeacherClasses()).find((c) => c.id === classId);
  if (!found) redirect("/classes");
  await setOwnClass(found.code);
  redirect("/teacher");
}

export type AddStudentResult =
  | { added: string }
  /** notFound: no student has that email or phone; already: in the class already. */
  | { error: "empty" | "notFound" | "already" | "demo" | "failed" };

/** Adds the student with this email or phone to the teacher's current class. */
export async function addStudent(contact: string): Promise<AddStudentResult> {
  const active = await teacherClass();
  if (active.id === "demo") return { error: "demo" };
  const text = String(contact).trim();
  if (!text) return { error: "empty" };
  try {
    const phone = normalPhone(text);
    const student = text.includes("@") ? await findAccountByEmail(text) : phone ? await findAccountByPhone(phone) : undefined;
    if (student?.role !== "student") return { error: "notFound" };
    if (!(await addMember(active.id, student.id))) return { error: "already" };
    // A student in no class yet starts studying in this one.
    if (!student.classCode) await setAccountClass(student.id, active.code);
    return { added: student.username };
  } catch (error) {
    console.error(error);
    return { error: "failed" };
  }
}

/** Takes a student out of the teacher's current class. */
export async function removeStudent(studentId: string): Promise<boolean> {
  const active = await teacherClass();
  if (active.id === "demo") return false;
  try {
    await removeMember(active.id, String(studentId));
    // Their class content stops showing; they pick another class (or none).
    await clearClassIfCurrent(String(studentId), active.code);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

async function clearClassIfCurrent(studentId: string, code: string) {
  const student = await findAccountById(studentId);
  if (student?.classCode === code) await setAccountClass(studentId, null);
}

export type InviteResult = { token: string; url: string; svg: string } | { error: "demo" | "failed" };

/** Starts showing a QR invite for the current class; it works only while it is shown. */
export async function startInvite(): Promise<InviteResult> {
  const active = await teacherClass();
  if (active.id === "demo") return { error: "demo" };
  try {
    const token = await openInvite(active.id);
    const h = await headers();
    const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
    const url = `${origin}/join/${token}`;
    const svg = await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M" });
    return { token, url, svg };
  } catch (error) {
    console.error(error);
    return { error: "failed" };
  }
}

/**
 * A QR people join with only their name (/q/<token>), for the live join
 * panel. Reuses the class's open invite, so moving between pages keeps the
 * same QR and someone typing their name isn't cut off.
 */
export async function showNameQr(): Promise<InviteResult> {
  const active = await teacherClass();
  if (active.id === "demo") return { error: "demo" };
  try {
    const token = (await findOpenInvite(active.id)) ?? (await openInvite(active.id));
    const h = await headers();
    const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
    const url = `${origin}/q/${token}`;
    const svg = await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M" });
    return { token, url, svg };
  } catch (error) {
    console.error(error);
    return { error: "failed" };
  }
}

/**
 * Polled while the live join panel is on screen: keeps its invite alive and
 * returns who has joined, the latest first. `alive` is false once it lapsed.
 */
export async function pollNameQr(token: string): Promise<{ alive: boolean; names: string[] }> {
  const active = await teacherClass();
  if (active.id === "demo") return { alive: false, names: [] };
  try {
    const [alive, names] = await Promise.all([refreshInvite(active.id, String(token)), listJoinedNames(active.id)]);
    return { alive, names };
  } catch (error) {
    console.error(error);
    return { alive: true, names: [] };
  }
}

/** Called every few seconds while the QR is on screen; false once it has stopped working. */
export async function keepInvite(token: string): Promise<boolean> {
  const active = await teacherClass();
  if (active.id === "demo") return false;
  try {
    return await refreshInvite(active.id, String(token));
  } catch (error) {
    console.error(error);
    return false;
  }
}

/** The teacher closed the QR: nobody can join with it any more. */
export async function stopInvite() {
  const active = await teacherClass();
  if (active.id === "demo") return;
  try {
    await closeInvites(active.id);
  } catch (error) {
    console.error(error);
  }
}

export type JoinResult = { error: "expired" | "failed" } | void;

/** The student joins the class of a QR invite that is still being shown. */
export async function joinClass(token: string): Promise<JoinResult> {
  const user = await requireStudent();
  if (user.demo) redirect("/");
  try {
    const found = await findInviteClass(String(token));
    if (!found) return { error: "expired" };
    await addMember(found.id, user.id);
    await setOwnClass(found.code);
  } catch (error) {
    console.error(error);
    return { error: "failed" };
  }
  redirect("/");
}

export type JoinByNameResult = { error: "name" | "expired" | "failed" } | void;

/**
 * Someone without an account joins the class of a QR that is still shown,
 * with only their name (e.g. judges at a pitch): a guest student account is
 * made in their name and logged in. Already logged in as a student, they
 * just join.
 */
export async function joinByName(token: string, name: string): Promise<JoinByNameResult> {
  const clean = String(name).replace(/\s+/g, " ").trim();
  if (!clean) return { error: "name" };
  try {
    const found = await findInviteClass(String(token));
    if (!found) return { error: "expired" };
    const session = await readSession();
    if (session?.role === "student" && !session.demo) {
      await addMember(found.id, session.id);
      await setOwnClass(found.code);
    } else {
      const guest = await createGuestAccount(clean, { pet: { lineId: "anoleaf", level: 1, xp: 0 } });
      await addMember(found.id, guest.id);
      await setAccountClass(guest.id, found.code);
      await startSession(guest.id);
    }
  } catch (error) {
    console.error(error);
    return { error: "failed" };
  }
  after(deleteOldDemoAccounts);
  redirect("/");
}

/** A student in classes picks which one (which subject) to study in. */
export async function chooseClass(classId: string) {
  await requireStudent();
  const found = (await getStudentClasses()).find((c) => c.id === classId);
  if (found) await setOwnClass(found.code);
  redirect("/");
}

/** A student in no class picks a subject and grade to practise in the games. */
export async function choosePractice(subject: string, grade: number) {
  await requireStudent();
  if (!teacherSubject(subject) || !OPEN_GRADES.includes(Number(grade))) return;
  const session = await readSession();
  if (session) await writeSession({ ...session, practiceSubject: subject, practiceGrade: Number(grade) });
  redirect("/games");
}
