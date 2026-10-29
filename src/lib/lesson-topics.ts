// Lesson topics a class can be taught, as the keys «Ойлгосон уу?» signals
// use: the app's own lessons (subtopic ids), the Grade 7 math curriculum
// ("m7.<chapter>.<lesson>") and topics a teacher types ("t:<title>"). Pure,
// so it runs anywhere and in tests.

import { grade7MathCurriculum } from "./mock/curriculum";
import { subtopics } from "./mock/topics";
import { shiftDay } from "./streak";
import type { LessonTopic } from "./types";

const CUSTOM = "t:";
/** Longest topic a teacher can type. */
export const TOPIC_TITLE_MAX = 120;

/** The key for a topic the teacher typed: its title, tidied up. */
export const customTopicKey = (title: string) =>
  CUSTOM + title.replace(/\s+/g, " ").trim().slice(0, TOPIC_TITLE_MAX);

export const isCustomTopic = (key: string) => key.startsWith(CUSTOM);

/** The curriculum lessons of a subject and grade; only Grade 7 math so far. */
export function curriculumTopics(subject: string, grade: number): LessonTopic[] {
  if (subject !== "math" || grade !== 7) return [];
  return grade7MathCurriculum.flatMap((chapter) =>
    chapter.lessons.map((title, i) => ({
      key: `m7.${chapter.order}.${i + 1}`,
      title,
      group: `${chapter.order}. ${chapter.title}`,
    })),
  );
}

/** A topic key's title, or undefined for a key that isn't a topic. */
export function topicTitle(key: string): string | undefined {
  if (isCustomTopic(key)) return key.slice(CUSTOM.length) || undefined;
  const lesson = /^m7\.(\d+)\.(\d+)$/.exec(key);
  if (lesson) return grade7MathCurriculum.find((c) => c.order === Number(lesson[1]))?.lessons[Number(lesson[2]) - 1];
  return subtopics.find((s) => s.id === key)?.title;
}

export const isTopicKey = (key: unknown): key is string =>
  typeof key === "string" && key.length <= TOPIC_TITLE_MAX + CUSTOM.length && topicTitle(key) !== undefined;

/** Weekdays as stored (ISO: Monday is 1), with the short names a school uses. */
export const WEEKDAYS = [
  { day: 1, short: "Да", name: "Даваа" },
  { day: 2, short: "Мя", name: "Мягмар" },
  { day: 3, short: "Лх", name: "Лхагва" },
  { day: 4, short: "Пү", name: "Пүрэв" },
  { day: 5, short: "Ба", name: "Баасан" },
  { day: 6, short: "Бя", name: "Бямба" },
  { day: 7, short: "Ня", name: "Ням" },
];

/** ISO weekday of a "YYYY-MM-DD" day. */
export function isoWeekday(day: string): number {
  const weekday = new Date(`${day}T00:00:00Z`).getUTCDay();
  return weekday === 0 ? 7 : weekday;
}

/**
 * The school weeks (Monday to Sunday) up to the one with `today`, newest
 * first; the current week ends at today.
 */
export function recentWeeks(today: string, count: number): { from: string; to: string }[] {
  const monday = shiftDay(today, 1 - isoWeekday(today));
  return Array.from({ length: count }, (_, i) => {
    const from = shiftDay(monday, -7 * i);
    return { from, to: i === 0 ? today : shiftDay(from, 6) };
  });
}

/** The next `count` lesson days from `from` (included), within two months. */
export function upcomingLessonDays(from: string, lessonDays: number[], count: number): string[] {
  const days: string[] = [];
  for (let i = 0; i < 62 && days.length < count; i++) {
    const day = shiftDay(from, i);
    if (lessonDays.includes(isoWeekday(day))) days.push(day);
  }
  return days;
}
