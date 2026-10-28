// Boss battle questions per subject. English uses the English bank (all
// skills); every other subject turns the games' question sets into
// four-option questions. Server only, so the answers never reach the browser.

import "server-only";
import { englishQuestions } from "./mock/english";
import { gameSubjects } from "./mock/games";
import type { Boss, EnglishQuestion, GameAnswer } from "./types";

export const DEFAULT_BATTLE_SUBJECT = "eng";

/** Subjects a battle can be about, English first. */
export const BATTLE_SUBJECTS: { id: string; title: string }[] = [
  { id: DEFAULT_BATTLE_SUBJECT, title: "Англи хэл" },
  ...gameSubjects.filter((s) => s.id !== "eng").map((s) => ({ id: s.id, title: s.title })),
];

export const isBattleSubject = (id: unknown): id is string =>
  typeof id === "string" && BATTLE_SUBJECTS.some((s) => s.id === id);

export const battleSubjectTitle = (id: string) => BATTLE_SUBJECTS.find((s) => s.id === id)?.title ?? id;

const answerText = (a: GameAnswer) => (typeof a === "string" ? a : a.name);

/** Same number for the same id, so a question's options never move between requests. */
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

const subjectQuestions: Record<string, EnglishQuestion[]> = Object.fromEntries(
  gameSubjects
    .filter((s) => s.id !== "eng")
    .map((s) => [
      s.id,
      s.questions.flatMap((q): EnglishQuestion[] => {
        const right = answerText(q.correct[0] ?? "");
        const wrong = q.wrong.slice(0, 3).map(answerText);
        if (!right || wrong.length < 3) return [];
        const correctIndex = hash(q.id) % 4;
        const options = [...wrong];
        options.splice(correctIndex, 0, right);
        return [
          {
            id: `${s.id}:${q.id}`,
            unitId: s.id,
            skill: "subject",
            subjectTitle: s.title,
            difficulty: 2,
            prompt: q.prompt,
            explanation: q.explanation,
            verified: false,
            kind: "choice",
            options,
            correctIndex,
          },
        ];
      }),
    ]),
);

const byId = new Map([...englishQuestions, ...Object.values(subjectQuestions).flat()].map((q) => [q.id, q]));

/** Any battle question by id, whatever its subject. */
export const findBattleQuestion = (id: string | null | undefined) => (id ? byId.get(id) : undefined);

/** The questions a battle against `boss` about `subject` can ask. */
export function battleQuestionPool(boss: Boss, subject: string): EnglishQuestion[] {
  if (subject !== DEFAULT_BATTLE_SUBJECT && subjectQuestions[subject]?.length) return subjectQuestions[subject];
  const { min, max } = boss.questionDifficulty;
  return englishQuestions.filter((q) => q.difficulty >= min && q.difficulty <= max);
}
