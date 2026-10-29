"use server";

// Server Functions for the anonymous question box beside a lesson. The
// student must be logged in, but who asked is never stored.

import { after } from "next/server";
import { questionClass } from "./data";
import { subtopics } from "./mock/topics";
import { groupLesson } from "./question-groups";
import { cleanQuestion } from "./question-text";
import { changeMeToo, questionsStored, saveQuestion } from "./questions";
import { readSession } from "./session";
import type { AnonQuestion } from "./types";

export type AskResult =
  | { question: AnonQuestion; duplicate: boolean }
  /** empty: nothing to ask; noclass: not in a class yet; offline: questions aren't stored on this server; failed: try again. */
  | { error: "login" | "empty" | "noclass" | "offline" | "failed" };

/** Saves an anonymous question for the student's class; the same question again counts as "me too". */
export async function askQuestion(subtopicId: string, text: string): Promise<AskResult> {
  if (!(await readSession())) return { error: "login" };
  const clean = cleanQuestion(String(text));
  if (!clean || !subtopics.some((s) => s.id === subtopicId)) return { error: "empty" };
  if (!questionsStored()) return { error: "offline" };
  const classCode = await questionClass();
  if (!classCode) return { error: "noclass" };
  try {
    const saved = await saveQuestion(classCode, subtopicId, clean);
    // Grouping waits for the AI, so it runs after the student has the reply.
    if (!saved.duplicate) after(() => groupLesson(classCode, subtopicId).catch(console.error));
    return saved;
  } catch (error) {
    console.error(error);
    return { error: "failed" };
  }
}

/** Adds (or, when `on` is false, takes back) the student's "me too" on a question. */
export async function setMeToo(questionId: string, on: boolean): Promise<boolean> {
  if (!(await readSession()) || !questionsStored()) return false;
  try {
    await changeMeToo(String(questionId), on ? 1 : -1);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}
