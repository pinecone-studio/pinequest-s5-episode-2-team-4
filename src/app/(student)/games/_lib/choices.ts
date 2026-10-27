import type { GameAnswer, GameQuestion } from "@/lib/types";
import { shuffle } from "./session";

/** A question shown as a choice: 1 of its right answers and the rest wrong ones. */
export type ChoiceRound = {
  question: GameQuestion;
  choices: GameAnswer[];
  answer: number;
};

export function makeChoiceRound(question: GameQuestion, count = 4): ChoiceRound {
  const right = shuffle(question.correct)[0];
  const choices = shuffle([right, ...shuffle(question.wrong).slice(0, count - 1)]);
  return { question, choices, answer: choices.indexOf(right) };
}
