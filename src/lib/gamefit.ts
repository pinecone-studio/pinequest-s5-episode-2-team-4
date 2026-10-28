// Which games suit a question set, and checks that a teacher's questions are
// playable. Pure functions (no server or browser APIs), shared by the teacher
// pages and tests.

import { evaluateExpression, equal, promptValue } from "./formula";
import type { GameAnswer, GameQuestion } from "./types";

/**
 * Games that play GameQuestion sets. "canvas" games draw answers in small
 * moving labels, so they need short answers; "dom" games show answers in
 * buttons or cards that wrap longer text.
 */
export const ASSIGNMENT_GAMES = [
  { id: "snake", title: "Мэдлэгийн могой", kind: "canvas" },
  { id: "slice", title: "Мэдлэгийн зүсэлт", kind: "canvas" },
  { id: "flight", title: "Мэдлэгийн нислэг", kind: "canvas" },
  { id: "hoops", title: "Сагсан бөмбөг", kind: "canvas" },
  { id: "runner", title: "Боссын зам", kind: "canvas" },
  { id: "mole", title: "Мэнгэ цохих", kind: "dom" },
  { id: "cards", title: "Картын тулаан", kind: "dom" },
  { id: "race", title: "Морин уралдаан", kind: "dom" },
  { id: "tug", title: "Олс таталт", kind: "dom" },
  { id: "penalty", title: "Пенальти", kind: "dom" },
] as const satisfies readonly { id: string; title: string; kind: "canvas" | "dom" }[];

export type AssignmentGameId = (typeof ASSIGNMENT_GAMES)[number]["id"];

export const isAssignmentGame = (id: string): id is AssignmentGameId =>
  ASSIGNMENT_GAMES.some((g) => g.id === id);

export const gameTitle = (id: string) => ASSIGNMENT_GAMES.find((g) => g.id === id)?.title ?? id;

/** Longest answer, in characters, that each kind of game shows well. */
const COMFORT = { canvas: 8, dom: 28 } as const;
/** Hard limit for any answer. */
export const MAX_ANSWER_LENGTH = 28;
export const MAX_PROMPT_LENGTH = 200;

const answerText = (a: GameAnswer) => (typeof a === "string" ? a : a.name);
/** Shapes are drawn as small pictures, so they always fit. */
const answerLength = (a: GameAnswer) => (typeof a === "string" ? a.trim().length : 0);

export type GameFit = {
  id: AssignmentGameId;
  title: string;
  fit: "best" | "ok" | "poor";
  /** Why, shown to the teacher */
  reason: string;
};

/** Every assignment game with how well it suits the questions, best first. */
export function suggestGames(questions: GameQuestion[]): GameFit[] {
  const answers = questions.flatMap((q) => [...q.correct, ...q.wrong]);
  const longest = Math.max(0, ...answers.map(answerLength));
  const tooLong = (limit: number) => answers.filter((a) => answerLength(a) > limit).length;
  const share = answers.length ? tooLong(COMFORT.canvas) / answers.length : 0;
  const order = { best: 0, ok: 1, poor: 2 };

  return ASSIGNMENT_GAMES.map((game): GameFit => {
    if (game.kind === "dom") {
      return longest > COMFORT.canvas
        ? { ...game, fit: "best", reason: "Урт хариултыг товч, картад багтаана" }
        : { ...game, fit: "ok", reason: "Тохирно" };
    }
    if (share === 0) return { ...game, fit: "best", reason: "Богино хариулт хөдөлгөөнт тоглоомд тохирно" };
    if (share <= 0.2) return { ...game, fit: "ok", reason: "Цөөн хэдэн урт хариулт багтахгүй байж магадгүй" };
    return { ...game, fit: "poor", reason: `${COMFORT.canvas}-аас урт хариулт олон байна` };
  }).sort((a, b) => order[a.fit] - order[b.fit]);
}

export type QuestionIssue = {
  level: "error" | "warning";
  message: string;
};

/**
 * Problems that stop a question from being published (errors) or that the
 * teacher should look at (warnings). Arithmetic prompts ending in "= ?" are
 * checked: every right answer must equal the value and no wrong one may.
 */
export function checkQuestion(q: Pick<GameQuestion, "prompt" | "correct" | "wrong">): QuestionIssue[] {
  const issues: QuestionIssue[] = [];
  const error = (message: string) => issues.push({ level: "error", message });
  const warn = (message: string) => issues.push({ level: "warning", message });

  const prompt = q.prompt.trim();
  if (!prompt) error("Асуулт хоосон байна");
  else if (prompt.length > MAX_PROMPT_LENGTH) error(`Асуулт ${MAX_PROMPT_LENGTH} тэмдэгтээс урт`);

  const correct = q.correct.filter((a) => answerText(a).trim());
  const wrong = q.wrong.filter((a) => answerText(a).trim());
  if (correct.length !== 3) error("Яг 3 зөв хариулт хэрэгтэй");
  if (wrong.length !== 3) error("Яг 3 буруу хариулт хэрэгтэй");

  const all = [...correct, ...wrong].map((a) => answerText(a).trim().toLowerCase());
  if (new Set(all).size !== all.length) error("Давхардсан хариулт байна");
  if ([...correct, ...wrong].some((a) => answerLength(a) > MAX_ANSWER_LENGTH)) {
    error(`Хариулт ${MAX_ANSWER_LENGTH} тэмдэгтээс урт`);
  }

  const target = promptValue(prompt);
  if (target) {
    const values = (list: GameAnswer[]) =>
      list.map((a) => (typeof a === "string" ? evaluateExpression(a) : undefined));
    const wrongRight = values(correct).filter((v) => v && !equal(v, target)).length;
    const rightWrong = values(wrong).filter((v) => v && equal(v, target)).length;
    if (wrongRight) error("Зөв гэсэн хариулт тооцоотой таарахгүй байна");
    if (rightWrong) error("Буруу гэсэн хариулт үнэндээ зөв байна");
  } else if (/\d\s*[+−×*÷:-]\s*\d/.test(prompt.replace(/(\d)\s*\/\s*(\d)/g, "$1$2"))) {
    // Arithmetic the checker couldn't work out; a fraction alone ("1/2-тэй тэнцүү") is fine.
    warn("Тооцоог автоматаар шалгах боломжгүй, өөрөө шалгаарай");
  }
  return issues;
}
