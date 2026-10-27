import type { GameQuestion } from "@/lib/types";
import { pickRounds, ROUNDS } from "./session";

export type QueuedRound = {
  question: GameQuestion;
  /** A repeat of a task the player slipped on earlier in the session. */
  retry: boolean;
};

/** How the repeats went, for the teacher note on the results. */
export type RetryStats = { retried: number; fixed: number };

/**
 * The session's rounds, plus one repeat at the end of every task the player
 * slipped on the first time. A repeat played without a slip counts as fixed.
 */
export class RetryQueue {
  private queue: QueuedRound[];
  private retried: GameQuestion[] = [];
  private fixed = 0;
  /** First-try rounds finished so far. */
  done = 0;

  constructor(questions: GameQuestion[], private count = ROUNDS) {
    this.queue = pickRounds(questions, count).map((question) => ({ question, retry: false }));
  }

  /** Takes the next round, or undefined when the session is over. */
  next(): QueuedRound | undefined {
    return this.queue.shift();
  }

  /** The round after the current one, e.g. to show its task early. */
  peek(): QueuedRound | undefined {
    return this.queue[0];
  }

  /** Records how a round went; a first try with a slip comes back once at the end. */
  finish(round: QueuedRound, clean: boolean) {
    if (round.retry) {
      if (clean) this.fixed++;
      return;
    }
    this.done++;
    if (!clean && !this.retried.includes(round.question)) {
      this.retried.push(round.question);
      this.queue.push({ question: round.question, retry: true });
    }
  }

  /** Rounds in the whole session, repeats included. */
  get rounds() {
    return this.count + this.retried.length;
  }

  get stats(): RetryStats {
    return { retried: this.retried.length, fixed: this.fixed };
  }
}
