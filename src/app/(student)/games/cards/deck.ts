import type { GameAnswer, GameQuestion } from "@/lib/types";
import { shuffle } from "../_lib/session";
import type { Power } from "./arena/ArenaEngine";

/**
 * A card asks one game question as multiple choice. Stronger cards offer more
 * choices, so a hard card is a harder pick and hits harder.
 */
export type BattleCard = {
  id: string;
  power: Power;
  prompt: string;
  choices: GameAnswer[];
  answer: number;
  explanation: string;
  /** Source question, so a missed card can come back later with fresh choices. */
  question: GameQuestion;
};

export const POWER: Record<Power, { label: string; damage: number; choices: number }> = {
  easy: { label: "Хялбар", damage: 10, choices: 2 },
  medium: { label: "Дунд", damage: 25, choices: 3 },
  hard: { label: "Хэцүү", damage: 45, choices: 4 },
};

const POWERS: Power[] = ["easy", "medium", "hard"];
let serial = 0;

/** One right answer and (choices − 1) wrong ones, shuffled. */
export function makeCard(q: GameQuestion, power: Power): BattleCard {
  const right = q.correct[Math.floor(Math.random() * q.correct.length)];
  const choices = shuffle([right, ...shuffle(q.wrong).slice(0, POWER[power].choices - 1)]);
  return { id: `${q.id}-${serial++}`, power, prompt: q.prompt, choices, answer: choices.indexOf(right), explanation: q.explanation, question: q };
}

/** A shuffled deck with the three powers mixed evenly. */
export function makeDeck(questions: GameQuestion[]): BattleCard[] {
  return shuffle(questions).map((q, i) => makeCard(q, POWERS[i % 3]));
}

/** Damage grows with the streak: ×1.25 per right answer in a row after the first, up to ×2. */
export const comboMultiplier = (combo: number) => Math.min(2, 1 + Math.max(0, combo - 1) * 0.25);
