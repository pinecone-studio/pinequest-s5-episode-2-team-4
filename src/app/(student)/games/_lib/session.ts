import type { GameQuestion } from "@/lib/types";

/** Rounds (questions) in one game session. */
export const ROUNDS = 5;

export function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** `count` questions in random order, repeating the set if it is shorter. */
export function pickRounds(questions: GameQuestion[], count = ROUNDS): GameQuestion[] {
  const pool = shuffle(questions);
  return Array.from({ length: count }, (_, i) => pool[i % pool.length]);
}

/** 3 stars for no mistakes, 2 for up to 3, otherwise 1. */
export function starsFor(mistakes: number): 1 | 2 | 3 {
  if (mistakes === 0) return 3;
  return mistakes <= 3 ? 2 : 1;
}

/** Points for a right answer: 10, doubled from a 3-streak, tripled from 4. */
export function pointsFor(combo: number) {
  return 10 * Math.min(3, Math.max(1, combo - 1));
}

/** What a finished session reports to the results panel. */
export type SessionResult = {
  score: number;
  /** Share of answers that were right, 0–100. */
  accuracy: number;
  bestCombo: number;
  stars: 1 | 2 | 3;
  /** Explanation of the first question the player got wrong, to revisit. */
  review?: string;
  /** Ids of the questions answered wrong, for assignment results. */
  missedIds?: string[];
};
