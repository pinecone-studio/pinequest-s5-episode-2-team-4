// Answer checking for the English question bank. Runs on the server only,
// so the accepted answers never reach the browser.

import type {
  EnglishAnswer,
  EnglishAnswerResult,
  EnglishQuestion,
  EnglishQuestionView,
} from "./types";

/**
 * Lenient on form, strict on spelling: ignores case, extra spaces, curly
 * apostrophes and a final full stop, but not a single changed letter.
 */
export function normalizeAnswer(text: string) {
  return text
    .normalize("NFC")
    .toLocaleLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/["“”]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s*[.!?]+$/, "");
}

export function checkEnglishAnswer(
  question: EnglishQuestion,
  answer: EnglishAnswer,
): EnglishAnswerResult {
  const { explanation } = question;

  if (question.kind === "choice") {
    return {
      correct: answer === question.correctIndex,
      expected: question.options[question.correctIndex],
      explanation,
    };
  }

  const given = typeof answer === "string" ? normalizeAnswer(answer) : "";
  return {
    correct: question.acceptedAnswers.some((a) => normalizeAnswer(a) === given),
    expected: question.acceptedAnswers[0],
    explanation,
  };
}

/** The question without its answers, for the browser. */
export function toQuestionView(question: EnglishQuestion): EnglishQuestionView {
  const view: Record<string, unknown> = { ...question };
  delete view.correctIndex;
  delete view.acceptedAnswers;
  return view as EnglishQuestionView;
}
