"use server";

// Server Functions for the teacher's question groups. Only a teacher can call
// them, and only on their own class.

import { refresh } from "next/cache";
import { getCurrentUser, questionClass } from "./data";
import { answerGroup, mergeGroups, renameGroup } from "./question-group-edits";
import { questionsStored } from "./questions";

/** ok, or why not: login: not a teacher; empty: nothing typed; offline: no database; failed: try again. */
export type GroupResult = { ok: true } | { error: "login" | "empty" | "offline" | "failed" };

async function asTeacher(change: (classCode: string) => Promise<void>): Promise<GroupResult> {
  const user = await getCurrentUser();
  if (user?.role !== "teacher") return { error: "login" };
  if (!questionsStored()) return { error: "offline" };
  try {
    // The same class the dashboard shows.
    await change(await questionClass());
  } catch (error) {
    console.error(error);
    return { error: "failed" };
  }
  refresh();
  return { ok: true };
}

const clean = (text: unknown) => String(text).replace(/\s+/g, " ").trim();

export async function renameQuestionGroup(groupId: string, title: string): Promise<GroupResult> {
  const name = clean(title);
  if (!name) return { error: "empty" };
  return asTeacher((classCode) => renameGroup(classCode, String(groupId), name));
}

export async function mergeQuestionGroups(fromId: string, intoId: string): Promise<GroupResult> {
  return asTeacher((classCode) => mergeGroups(classCode, String(fromId), String(intoId)));
}

export async function answerQuestionGroup(groupId: string, text: string): Promise<GroupResult> {
  // Keeps line breaks: a worked answer often has steps on separate lines.
  const answer = String(text).trim();
  if (!answer) return { error: "empty" };
  return asTeacher((classCode) => answerGroup(classCode, String(groupId), answer));
}
