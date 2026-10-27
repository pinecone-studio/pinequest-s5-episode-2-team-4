import type { GameAnswer, GameQuestion } from "@/lib/types";

/** World size the snake game is drawn in; the canvas scales it to fit. */
export const WORLD = { w: 400, h: 500 } as const;

/** Radius of a body bead; the head is a little bigger. */
export const SNAKE_RADIUS = 12;

export type Point = { x: number; y: number };

export type Food = {
  answer: GameAnswer;
  ok: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Time it appears (staggered pop-in). */
  born: number;
  /** 0…1, how close the snake's head is; the pill grows and glows. */
  near: number;
  /** Seconds since eaten, or 0 while it is still on the field. */
  dying: number;
};

export type Snake = {
  x: number;
  y: number;
  /** Heading in radians. */
  angle: number;
  /** Body length in beads. */
  length: number;
  /** Recent head positions, newest first; the body follows this path. */
  trail: Point[];
};

export type SnakeSkin = {
  id: string;
  name: string;
  /** Colour bands repeated along the body, head first. */
  bands: string[];
  /** Stars needed to unlock. */
  need: number;
  /** Twinkling stars on the body. */
  sparkle?: boolean;
};

/** What the engine tells the React screen. */
export type SnakeEvents = {
  onRound: (index: number, question: GameQuestion) => void;
  onScore: (score: number, combo: number) => void;
  onFound: (found: number) => void;
  /** A wrong answer was eaten; the game is paused until resume(). */
  onWrong: (answer: GameAnswer, question: GameQuestion) => void;
  /** All 3 right answers eaten; `clean` when there was no mistake. */
  onRoundDone: (question: GameQuestion, bonus: number, clean: boolean) => void;
  onFinish: (stats: { score: number; mistakes: number; bestCombo: number; missed: GameQuestion[] }) => void;
};

export type SnakeLook = {
  skin: SnakeSkin;
  time: number;
  /** Red flashing after a wrong bite. */
  hurt: boolean;
  /** Green or skin-coloured glow (right bite, or a streak of 3+). */
  glow: string | null;
  paused: boolean;
  blinking: boolean;
  tongue: boolean;
  crown: boolean;
  /** The food the head is about to bite: eyes look at it, mouth opens. */
  target?: Food;
};
