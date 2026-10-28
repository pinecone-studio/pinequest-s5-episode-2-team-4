"use server";

// Server Functions for the anonymous question box beside a lesson. The
// student must be logged in, but who asked is never stored.

import { questionClass } from "./data";
import { subtopics } from "./mock/topics";
import { cleanQuestion } from "./question-text";
import { changeMeToo, questionsStored, saveQuestion } from "./questions";
import { readSession } from "./session";
import type { AnonQuestion } from "./types";

export type AskResult =
  | { question: AnonQuestion; duplicate: boolean }
  /** empty: nothing to ask; offline: questions aren't stored on this server; failed: try again. */
  | { error: "login" | "empty" | "offline" | "failed" };

/** Saves an anonymous question for the student's class; the same question again counts as "me too". */
export async function askQuestion(subtopicId: string, text: string): Promise<AskResult> {
  if (!(await readSession())) return { error: "login" };
  const clean = cleanQuestion(String(text));
  if (!clean || !subtopics.some((s) => s.id === subtopicId)) return { error: "empty" };
  if (!questionsStored()) return { error: "offline" };
  try {
    return await saveQuestion(await questionClass(), subtopicId, clean);
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
