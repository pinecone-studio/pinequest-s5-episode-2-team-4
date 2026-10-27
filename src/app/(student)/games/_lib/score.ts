import type { GameQuestion } from "@/lib/types";
import { pointsFor } from "./session";

/** What an engine reports when its session ends. */
export type ScoreSummary = { score: number; mistakes: number; bestCombo: number; missed: GameQuestion[] };

/** Score, streak and mistakes of one session, counted the same way in every game. */
export class SessionScore {
  score = 0;
  combo = 0;
  bestCombo = 0;
  mistakes = 0;
  /** Questions with at least one mistake, in the order they happened. */
  missed: GameQuestion[] = [];

  /** A right answer: grows the streak and returns the points it was worth. */
  right() {
    this.bestCombo = Math.max(this.bestCombo, ++this.combo);
    const points = pointsFor(this.combo);
    this.score += points;
    return points;
  }

  /** A wrong answer to `question`: ends the streak. */
  wrong(question: GameQuestion) {
    this.combo = 0;
    this.mistakes++;
    if (!this.missed.includes(question)) this.missed.push(question);
  }

  get summary(): ScoreSummary {
    const { score, mistakes, bestCombo, missed } = this;
    return { score, mistakes, bestCombo, missed };
  }
}
