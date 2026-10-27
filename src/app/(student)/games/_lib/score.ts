import type { GameQuestion } from "@/lib/types";
import { pointsFor } from "./session";

/** What an engine reports when its session ends. */
export type ScoreSummary = { score: number; mistakes: number; misses: number; bestCombo: number; missed: GameQuestion[] };

/** Score, streak and mistakes of one session, counted the same way in every game. */
export class SessionScore {
  score = 0;
  combo = 0;
  bestCombo = 0;
  mistakes = 0;
  /** Right answers the player let go (e.g. fell off the field), counted apart from mistakes. */
  misses = 0;
  /** Questions with at least one mistake or miss, in the order they happened. */
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
    this.mistakes++;
    this.slip(question);
  }

  /** A right answer to `question` let go: ends the streak too. */
  miss(question: GameQuestion) {
    this.misses++;
    this.slip(question);
  }

  private slip(question: GameQuestion) {
    this.combo = 0;
    if (!this.missed.includes(question)) this.missed.push(question);
  }

  get summary(): ScoreSummary {
    const { score, mistakes, misses, bestCombo, missed } = this;
    return { score, mistakes, misses, bestCombo, missed };
  }
}
