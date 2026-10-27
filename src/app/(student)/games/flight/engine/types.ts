import type { GameAnswer, GameQuestion } from "@/lib/types";

/** World size the flight game is drawn in; the canvas scales it to fit. */
export const WORLD = { w: 400, h: 500 } as const;

/** Top of the grass strip the falcon bounces off. */
export const GROUND = WORLD.h - 34;
/** The falcon flies at a fixed x; the gates scroll towards it. */
export const FALCON_X = 96;
export const FALCON_R = 14;
/** Gate pillar width, the pillar between two gaps, and the spacing of gates and tasks. */
export const GATE_W = 50;
export const PILLAR = 30;
export const GATE_DIST = 300;
export const TASK_GAP = 140;

/** One of a gate's three gaps, top to bottom. */
export type Lane = { y0: number; y1: number; c: number };

export type GateItem = { answer: GameAnswer; ok: boolean; w: number; h: number };

export type Gate = {
  x: number;
  /** Index of the task (round) the gate belongs to. */
  round: number;
  /** One answer per lane: one right, two wrong. */
  items: GateItem[];
  /** Lane the falcon committed to, once it reached the gate. */
  lane: number | null;
  done: boolean;
  result: boolean | null;
  /** Seconds since it was judged, for the pop animation; 0 before. */
  pop: number;
};

export type Falcon = { y: number; vy: number; rot: number; dizzy: number };

/** What the engine tells the React screen. */
export type FlightEvents = {
  onTask: (round: number, question: GameQuestion) => void;
  /** Result of each gate of the current task: true right, false wrong, undefined not yet. */
  onMarks: (marks: (boolean | undefined)[]) => void;
  onScore: (score: number, combo: number) => void;
  onFlap: () => void;
  /** The falcon bounced off the ground, the ceiling or a pillar. */
  onBump: () => void;
  /** Flew through a wrong gap; the game is paused until resume(). */
  onWrong: (picked: GameAnswer, right: GameAnswer, question: GameQuestion) => void;
  /** All 3 gates of a task passed without a mistake. */
  onClean: (question: GameQuestion) => void;
  onFinish: (stats: { score: number; mistakes: number; bestCombo: number; missed: GameQuestion[] }) => void;
};
