import type { Guess } from "./types";

/** Seconds the slow mode lasts after a slice that looked like guessing. */
const SLOW_FOR = 9;
/** A wrong answer sliced sooner than this after its toss can't have been read. */
const READ_TIME = 0.9;

/**
 * The slow, careful mode: a wrong slice made too fast to have read the
 * answer, or a second wrong slice in one task, slows the game down for a while.
 */
export class CarefulMode {
  /** Wrong slices that looked like guessing, for the teacher note. */
  guesses = 0;
  private left = 0;

  constructor(private onChange: (on: boolean) => void) {}

  get on() {
    return this.left > 0;
  }

  /** Classifies a wrong slice and turns the mode on when it looked like guessing. */
  check(sinceToss: number, wrongCuts: number): Guess {
    const guess: Guess = sinceToss < READ_TIME ? "quick" : wrongCuts >= 2 ? "second" : null;
    if (guess) {
      this.guesses++;
      this.set(SLOW_FOR);
    }
    return guess;
  }

  /** Counts the mode down; returns the game time that passes in `dt` (slower while on). */
  tick(dt: number) {
    const scaled = dt * (this.on ? 0.6 : 1);
    if (this.on) this.set(Math.max(0, this.left - dt));
    return scaled;
  }

  reset() {
    this.guesses = 0;
    this.set(0);
  }

  private set(seconds: number) {
    if (seconds > 0 !== this.on) this.onChange(seconds > 0);
    this.left = seconds;
  }
}
