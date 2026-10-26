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

/**
 * The English word or short phrase a spelling or translation question
 * teaches, without end punctuation. Sentence questions and "find the
 * misspelling" don't teach one.
 */
export function vocabularyWord(question: EnglishQuestion): string | undefined {
  const word = rawVocabularyWord(question);
  return word?.replace(/[.!?]+$/, "");
}

function rawVocabularyWord(question: EnglishQuestion): string | undefined {
  if (question.skill !== "spelling" && question.skill !== "translation") return undefined;
  const isMongolian = (text: string) => /[а-яөүё]/i.test(text);
  if (question.kind === "text") {
    const answer = question.acceptedAnswers[0];
    if (question.skill === "spelling") return answer;
    // "Translate into English: шатар" → chess; "Translate into Mongolian: hobby" → hobby.
    if (question.display && !question.display.includes(" ")) {
      return isMongolian(question.display) ? answer : question.display;
    }
    const quoted = question.prompt.match(/"([^"]+)"/)?.[1];
    return quoted && !isMongolian(quoted) ? quoted : undefined;
  }
  if (question.kind === "choice" && question.skill === "translation" && !question.display) {
    // "What does "holiday" mean in Mongolian?"
    return question.prompt.match(/"([^"]+)"/)?.[1];
  }
  return undefined;
}
