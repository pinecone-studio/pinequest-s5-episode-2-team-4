// Material a teacher adds to a group answer: where it leads and what it is
// called, plus a check for what the teacher's form sends.

import { subtopics } from "./mock/topics";
import type { AnswerMaterial } from "./types";

const MAX_LINK_TITLE = 80;

export const PART_LABELS = { explanation: "Тайлбар", practice: "Дасгал" } as const;

/** Where the student goes: the lesson part in the app, or the outside page. */
export function materialHref(m: AnswerMaterial) {
  if (m.kind === "link") return m.url;
  const topicId = subtopics.find((s) => s.id === m.subtopicId)?.topicId ?? "fractions";
  return `/lesson/${topicId}?sub=${m.subtopicId}#${m.part === "practice" ? "practice-title" : "lesson-title"}`;
}

/** "Хураах · Дасгал", or the link's title. */
export function materialLabel(m: AnswerMaterial) {
  if (m.kind === "link") return m.title;
  const title = subtopics.find((s) => s.id === m.subtopicId)?.title ?? m.subtopicId;
  return `${title} · ${PART_LABELS[m.part]}`;
}

/** A valid material from untrusted input, or null. Only http(s) links are allowed. */
export function parseMaterial(input: unknown): AnswerMaterial | null {
  if (!input || typeof input !== "object") return null;
  const m = input as Record<string, unknown>;
  if (m.kind === "lesson") {
    const part = m.part === "practice" ? "practice" : m.part === "explanation" ? "explanation" : null;
    const known = subtopics.some((s) => s.id === m.subtopicId);
    return part && known ? { kind: "lesson", subtopicId: String(m.subtopicId), part } : null;
  }
  if (m.kind === "link") {
    let url: URL;
    try {
      url = new URL(String(m.url).trim());
    } catch {
      return null;
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    const title = String(m.title ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_LINK_TITLE);
    return { kind: "link", url: url.href, title: title || url.hostname };
  }
  return null;
}
