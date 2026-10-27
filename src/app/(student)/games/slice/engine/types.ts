import type { GameAnswer, GameQuestion } from "@/lib/types";
import type { QueuedRound, RetryStats } from "../../_lib/retry";
import type { ScoreSummary } from "../../_lib/score";

/** World size the slice game is drawn in; the canvas scales it to fit. */
export const WORLD = { w: 400, h: 500 } as const;
export const GRAVITY = 360;

/** One answer tossed up from the bottom, on the left (-1) or right (1) half of the field. */
export type Toss = { at: number; answer: GameAnswer; ok: boolean; side: -1 | 1; sent?: boolean };

export type Piece = {
  answer: GameAnswer;
  ok: boolean;
  w: number;
  h: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  side: -1 | 1;
  rot: number;
  vr: number;
  /** Scene time it was tossed, to tell a slice made before it could be read. */
  born: number;
  alive: boolean;
};

/** One of the two halves a cut piece falls apart into. */
export type Half = { piece: Piece; x: number; y: number; vx: number; vy: number; rot: number; vr: number; ang: number; side: 1 | -1; life: number };

export type TrailPoint = { x: number; y: number; life: number };

/** Why a wrong slice looked like guessing: too fast to have read it, or a second wrong one in the task. */
export type Guess = "quick" | "second" | null;

export type SliceSummary = ScoreSummary & { retry: RetryStats; guesses: number };

/** One task in play: its tosses, and how the player has done so far. */
export type Wave = { round: QueuedRound; t: number; plan: Toss[]; wrongCuts: number; marks: boolean[] };

/** What the engine tells the React screen. */
export type SliceEvents = {
  /** A task starts; `step` is the first-try round it counts as (repeats come after the last one). */
  onRound: (round: QueuedRound, step: number) => void;
  /** Result of each right answer of the task so far: true sliced, false let go. */
  onMarks: (marks: boolean[]) => void;
  onScore: (score: number, combo: number) => void;
  onToss: () => void;
  onSwipe: () => void;
  /** A right answer fell off the bottom without being sliced. */
  onMiss: (answer: GameAnswer) => void;
  /** A wrong answer was sliced; the game is paused until resume(). */
  onWrong: (answer: GameAnswer, question: GameQuestion, guess: Guess) => void;
  onTaskDone: (question: GameQuestion, retry: boolean, clean: boolean) => void;
  /** The slow, careful mode after guessing turned on or off. */
  onSlow: (on: boolean) => void;
  onFinish: (summary: SliceSummary) => void;
};
