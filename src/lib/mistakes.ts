import "server-only";
import { findBattleQuestion } from "./battle-questions";
import { checkEnglishAnswer } from "./english";
import { lessons } from "./mock/lessons";
import { testQuestions } from "./mock/questions";
import { subtopics } from "./mock/topics";
import { mistakeKey, recordMistake, type MistakeRecord, type MistakeRecords } from "./mistake-records";
import { englishProgress } from "./progress";
import type { Session } from "./session";
import type { ExpressionToken, FractionValue } from "./types";

const mathQuestions = [...testQuestions, ...lessons.flatMap((lesson) => lesson.practice)];
const PRINCIPLES: Record<string, string> = {
  "same-denominator": "Хуваарь ижил бол хүртвэрүүдийг нэмээд, хуваарийг хэвээр үлдээнэ.",
  "different-denominator": "Бутархайнуудыг ижил хуваарьтай болгоод хүртвэрүүдийг нэмнэ. Эцэст нь хурааж болно.",
  simplify: "Хүртвэр, хуваарийг хоёуланг нь ижил ерөнхий хуваагчид хувааж хураана.",
  "mixed-numbers": "Бүхэл тоо болон бутархай хэсгийг тусад нь нэмнэ. Бутархай хэсэг 1-ээс их бол бүхэлд шилжүүлнэ.",
};
const fractionText = (value: FractionValue) => `${value.whole ? `${value.whole} ` : ""}${value.num}/${value.den}`;

export type NotebookItem = {
  id: string;
  subject: string;
  prompt: string;
  expression?: ExpressionToken[];
  display?: string;
  options?: string[];
  previousAnswer?: string;
  expected: string;
  explanation: string;
  resolved: boolean;
  lessonHref?: string;
};

export function notebookItem(record: MistakeRecord): NotebookItem | undefined {
  const base = { id: mistakeKey(record.source, record.questionId), resolved: record.resolved };
  if (record.source === "math") {
    const question = mathQuestions.find((q) => q.id === record.questionId);
    if (!question) return undefined;
    const topic = subtopics.find((s) => s.id === question.subtopicId);
    return {
      ...base, subject: "Математик", prompt: question.prompt, expression: question.expression,
      options: question.options.map(fractionText),
      previousAnswer: typeof record.answer === "number" && question.options[record.answer] ? fractionText(question.options[record.answer]) : undefined,
      expected: fractionText(question.options[question.correctIndex]),
      explanation: PRINCIPLES[question.subtopicId] ?? "Зөв хариуг хичээлийн тайлбартай харьцуулж давтаарай.",
      lessonHref: `/lesson/${topic?.topicId ?? "fractions"}?sub=${question.subtopicId}`,
    };
  }
  const question = findBattleQuestion(record.questionId);
  if (!question) return undefined;
  return {
    ...base, subject: question.subjectTitle ?? "Англи хэл", prompt: question.prompt, display: question.display,
    options: question.kind === "choice" ? question.options : undefined,
    previousAnswer: question.kind === "choice" && typeof record.answer === "number" ? question.options[record.answer] : typeof record.answer === "string" ? record.answer : undefined,
    expected: question.kind === "choice" ? question.options[question.correctIndex] : question.acceptedAnswers[0],
    explanation: question.explanation,
  };
}

/** Seed existing diagnostic and English mistakes once; saved review results take precedence. */
export async function notebookRecords(session: Session): Promise<MistakeRecords> {
  let records = { ...session.mistakes };
  for (const q of testQuestions) {
    const answer = session.testAnswers?.[q.id];
    if (answer !== undefined && Number.isInteger(answer) && q.options[answer] && !records[mistakeKey("math", q.id)]) {
      records = recordMistake(records, "math", q.id, answer, answer === q.correctIndex);
    }
  }
  const progress = await englishProgress({ id: session.id, username: session.username, role: session.role }, Number.POSITIVE_INFINITY);
  for (const mistake of progress.mistakes) {
    const key = mistakeKey("battle", mistake.questionId);
    if (!records[key]) records[key] = { source: "battle", questionId: mistake.questionId, resolved: false };
  }
  return records;
}

export function checkNotebookAnswer(record: MistakeRecord, answer: number | string) {
  if (record.source === "math") {
    const q = mathQuestions.find((question) => question.id === record.questionId);
    if (!q || typeof answer !== "number" || !Number.isInteger(answer) || !q.options[answer]) return undefined;
    return answer === q.correctIndex;
  }
  const q = findBattleQuestion(record.questionId);
  if (!q || (q.kind === "choice" ? typeof answer !== "number" || !Number.isInteger(answer) || !q.options[answer] : typeof answer !== "string" || !answer.trim() || answer.length > 300)) return undefined;
  return checkEnglishAnswer(q, answer).correct;
}
