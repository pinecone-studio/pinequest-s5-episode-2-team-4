// Sorting and labels for the teacher's question inbox.

import type { AnonQuestion, QuestionGroup } from "@/lib/types";

export type GroupView = QuestionGroup & {
  subtopicTitle: string;
  questions: AnonQuestion[];
};

/** Students behind a group: each asker plus everyone who tapped «Би ч бас». */
export const askedBy = (questions: AnonQuestion[]) =>
  questions.reduce((sum, q) => sum + 1 + q.meToo, 0);

/** The teacher's answer the class already has, if any. */
export const sharedAnswer = (g: GroupView) =>
  g.questions.find((q) => q.answer?.by === "teacher")?.answer;

export const isAnswered = (g: GroupView) =>
  g.status === "answered" || Boolean(sharedAnswer(g));

/** Every question in it was flagged by the AI as off-topic, unclear or rude. */
export const isOffTopic = (g: GroupView) =>
  g.questions.length > 0 && g.questions.every((q) => q.needsReview);

/** "Хураах: 6/8-ийг яаж хураах вэ" → "6/8-ийг яаж хураах вэ" under the Хураах heading. */
export function shortTitle(g: GroupView) {
  const prefix = `${g.subtopicTitle}:`;
  if (!g.title.startsWith(prefix)) return g.title;
  const rest = g.title.slice(prefix.length).trim();
  return rest.charAt(0).toLocaleUpperCase("mn") + rest.slice(1);
}

/** The wrong idea behind most of the group's questions (counting «Би ч бас»), as the AI saw it. */
export function commonMisconception(questions: AnonQuestion[]) {
  const votes = new Map<string, number>();
  for (const q of questions) {
    if (!q.misconception) continue;
    votes.set(q.misconception, (votes.get(q.misconception) ?? 0) + 1 + q.meToo);
  }
  return [...votes].sort((a, b) => b[1] - a[1])[0]?.[0];
}

/** Groups under their lesson; the lesson with the most asked group first, most asked groups first. */
export function byLesson(groups: GroupView[]) {
  const lessons = new Map<string, GroupView[]>();
  const sorted = [...groups].sort(
    (a, b) => askedBy(b.questions) - askedBy(a.questions),
  );
  for (const g of sorted)
    lessons.set(g.subtopicTitle, [...(lessons.get(g.subtopicTitle) ?? []), g]);
  return [...lessons];
}
