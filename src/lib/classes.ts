// Classes, their students and QR invites in Supabase (see
// supabase/migrations/0017_classes.sql). A class's content is keyed by its
// unique `code`; accounts.class_code is the class a user is working in now.

import "server-only";
import { randomBytes, randomInt } from "node:crypto";
import { GUEST_EMAIL_DOMAIN } from "./accounts";
import { normalClassCode } from "./battle";
import { getSupabaseAdmin } from "./supabase";
import { XP_PER_LEVEL } from "./pets";
import type { ClassMember, SchoolClass, UserPet } from "./types";

const db = () => getSupabaseAdmin();

/** True when the server has Supabase keys; without them only demo classes exist. */
export const classesStored = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

/** Longest class name, e.g. "10Б-2"; codes stay within the 10 characters forms accept. */
export const CLASS_NAME_MAX = 5;

/** How long a shown QR stays valid without a refresh from the teacher's screen. */
export const INVITE_TTL_MS = 30_000;

type ClassRow = {
  id: string;
  code: string;
  name: string;
  subject: string;
  grade: number;
  class_members?: { count: number }[];
  accounts?: { username: string } | null;
};

const toClass = (r: ClassRow): SchoolClass => ({
  id: r.id,
  code: r.code,
  name: r.name,
  subject: r.subject,
  grade: r.grade,
  studentCount: r.class_members?.[0]?.count,
  teacherName: r.accounts?.username,
});

/** A teacher's classes, oldest first, with how many students each has. */
export async function listTeacherClasses(teacherId: string): Promise<SchoolClass[]> {
  const { data, error } = await db()
    .from("classes")
    .select("id, code, name, subject, grade, class_members(count)")
    .eq("teacher_id", teacherId)
    .order("created_at")
    .returns<ClassRow[]>();
  if (error) throw new Error(`Could not load classes: ${error.message}`);
  return data.map(toClass);
}

/** The classes a student is in, with their teachers' names. */
export async function listStudentClasses(studentId: string): Promise<SchoolClass[]> {
  const { data, error } = await db()
    .from("class_members")
    .select("classes(id, code, name, subject, grade, accounts!classes_teacher_id_fkey(username))")
    .eq("student_id", studentId)
    .order("added_at")
    .returns<{ classes: ClassRow | null }[]>();
  if (error) throw new Error(`Could not load classes: ${error.message}`);
  return data.flatMap((r) => (r.classes ? [toClass(r.classes)] : []));
}

/** A new class named e.g. "7А"; its code gets a random suffix so it is unique. */
export async function createClass(teacherId: string, name: string, subject: string): Promise<SchoolClass> {
  const clean = normalClassCode(name).slice(0, CLASS_NAME_MAX);
  for (let attempt = 1; ; attempt++) {
    const { data, error } = await db()
      .from("classes")
      .insert({ code: `${clean}-${randomInt(1000, 10000)}`, name: clean, teacher_id: teacherId, subject })
      .select("id, code, name, subject, grade")
      .single<ClassRow>();
    if (!error) return { ...toClass(data), studentCount: 0 };
    // The code is taken; try another suffix.
    if (error.code !== "23505" || attempt === 5) throw new Error(`Could not create class: ${error.message}`);
  }
}

/** Students in the class with this code; undefined when no class has it (an old typed code). */
export async function countClassMembers(code: string): Promise<number | undefined> {
  const { data, error } = await db()
    .from("classes")
    .select("class_members(count)")
    .eq("code", code)
    .maybeSingle<Pick<ClassRow, "class_members">>();
  if (error) throw new Error(`Could not count students: ${error.message}`);
  return data ? (data.class_members?.[0]?.count ?? 0) : undefined;
}

/** How many students a class has and the XP their pets have earned in all; undefined for an unknown code. */
export async function classPetXp(code: string): Promise<{ students: number; xp: number } | undefined> {
  const { data, error } = await db()
    .from("classes")
    .select("class_members(accounts(progress))")
    .eq("code", code)
    .maybeSingle<{ class_members: { accounts: { progress: { pet?: UserPet } | null } | null }[] }>();
  if (error) throw new Error(`Could not load class XP: ${error.message}`);
  if (!data) return undefined;
  const pets = data.class_members.flatMap((m) => (m.accounts?.progress?.pet ? [m.accounts.progress.pet] : []));
  return {
    students: data.class_members.length,
    xp: pets.reduce((sum, p) => sum + (p.level - 1) * XP_PER_LEVEL + p.xp, 0),
  };
}

/**
 * Each student's saved test answers and mastered subtopics, in the order they
 * joined, so student numbers (№01, №02, …) stay the same. No names.
 */
export async function listClassTestAnswers(
  classId: string,
): Promise<{ testAnswers?: Record<string, number>; mastered?: string[] }[]> {
  const { data, error } = await db()
    .from("class_members")
    .select("added_at, accounts(progress)")
    .eq("class_id", classId)
    .order("added_at", { ascending: true })
    .returns<{ accounts: { progress: { testAnswers?: Record<string, number>; mastered?: string[] } | null } | null }[]>();
  if (error) throw new Error(`Could not load test results: ${error.message}`);
  return data.flatMap((r) => (r.accounts ? [r.accounts.progress ?? {}] : []));
}

/** The class's students, by name. */
export async function listClassMembers(classId: string): Promise<ClassMember[]> {
  const { data, error } = await db()
    .from("class_members")
    .select("accounts(id, username, email, phone)")
    .eq("class_id", classId)
    .returns<{ accounts: { id: string; username: string; email: string | null; phone: string | null } | null }[]>();
  if (error) throw new Error(`Could not load students: ${error.message}`);
  return data
    .flatMap((r) => (r.accounts ? [r.accounts] : []))
    .map((a) => ({
      id: a.id,
      username: a.username,
      // A QR guest's email is made up, so it isn't shown.
      contact: a.email?.endsWith(GUEST_EMAIL_DOMAIN) ? "QR-аар нэгдсэн" : (a.email ?? a.phone ?? undefined),
    }))
    .sort((a, b) => a.username.localeCompare(b.username));
}

/**
 * The student's place in the class with this code by when they joined (0 is
 * the first); undefined when the code is no class or they aren't in it.
 */
export async function memberIndex(classCode: string, studentId: string): Promise<number | undefined> {
  const { data, error } = await db()
    .from("classes")
    .select("class_members(student_id, added_at)")
    .eq("code", classCode)
    .order("added_at", { referencedTable: "class_members" })
    .maybeSingle<{ class_members: { student_id: string }[] }>();
  if (error) throw new Error(`Could not load students: ${error.message}`);
  const index = data?.class_members.findIndex((m) => m.student_id === studentId) ?? -1;
  return index < 0 ? undefined : index;
}

/** Adds a student; false if they were already in the class. */
export async function addMember(classId: string, studentId: string): Promise<boolean> {
  const { error } = await db().from("class_members").insert({ class_id: classId, student_id: studentId });
  if (error?.code === "23505") return false;
  if (error) throw new Error(`Could not add student: ${error.message}`);
  return true;
}

export async function removeMember(classId: string, studentId: string) {
  const { error } = await db().from("class_members").delete().eq("class_id", classId).eq("student_id", studentId);
  if (error) throw new Error(`Could not remove student: ${error.message}`);
}

const inviteExpiry = () => new Date(Date.now() + INVITE_TTL_MS).toISOString();

/** A fresh QR invite for the class; any earlier one stops working. */
export async function openInvite(classId: string): Promise<string> {
  await closeInvites(classId);
  const token = randomBytes(18).toString("base64url");
  const { error } = await db().from("class_invites").insert({ token, class_id: classId, expires_at: inviteExpiry() });
  if (error) throw new Error(`Could not open invite: ${error.message}`);
  return token;
}

/** Keeps a shown invite alive; false once it has expired or been closed. */
export async function refreshInvite(classId: string, token: string): Promise<boolean> {
  const { data, error } = await db()
    .from("class_invites")
    .update({ expires_at: inviteExpiry() })
    .eq("class_id", classId)
    .eq("token", token)
    .gt("expires_at", new Date().toISOString())
    .select("token");
  if (error) throw new Error(`Could not refresh invite: ${error.message}`);
  return data.length > 0;
}

/** The class's invite that still works, if one is open (so another screen can show the same QR). */
export async function findOpenInvite(classId: string): Promise<string | undefined> {
  const { data, error } = await db()
    .from("class_invites")
    .select("token")
    .eq("class_id", classId)
    .gt("expires_at", new Date().toISOString())
    .limit(1)
    .returns<{ token: string }[]>();
  if (error) throw new Error(`Could not load invite: ${error.message}`);
  return data[0]?.token;
}

/** Names of the class's students, the latest to join first. */
export async function listJoinedNames(classId: string): Promise<string[]> {
  const { data, error } = await db()
    .from("class_members")
    .select("added_at, accounts(username)")
    .eq("class_id", classId)
    .order("added_at", { ascending: false })
    .returns<{ added_at: string; accounts: { username: string } | null }[]>();
  if (error) throw new Error(`Could not load students: ${error.message}`);
  return data.flatMap((r) => (r.accounts ? [r.accounts.username] : []));
}

/** Ends every invite of the class: the teacher closed the QR. */
export async function closeInvites(classId: string) {
  const { error } = await db().from("class_invites").delete().eq("class_id", classId);
  if (error) throw new Error(`Could not close invite: ${error.message}`);
}

/** The class an invite still lets students join, if it is being shown now. */
export async function findInviteClass(token: string): Promise<SchoolClass | undefined> {
  if (!/^[\w-]{20,40}$/.test(token)) return undefined;
  const { data, error } = await db()
    .from("class_invites")
    .select("classes(id, code, name, subject, grade, accounts!classes_teacher_id_fkey(username))")
    .eq("token", token)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle<{ classes: ClassRow | null }>();
  if (error) throw new Error(`Could not load invite: ${error.message}`);
  return data?.classes ? toClass(data.classes) : undefined;
}
