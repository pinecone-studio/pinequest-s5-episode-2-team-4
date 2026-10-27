import type { GameQuestion } from "@/lib/types";
import { shuffle } from "../../_lib/session";
import { measureAnswer } from "../../_lib/shapes";
import { GRAVITY, WORLD, type Piece, type Toss, type Wave } from "./types";

const HALF = WORLD.w / 2;

/**
 * Three bursts of two answers, 1.7 s apart: each burst has one right and one
 * wrong answer, on opposite halves of the field so one swipe can't catch both.
 */
export function planWave(question: GameQuestion): Toss[] {
  const rights = shuffle(question.correct), wrongs = shuffle(question.wrong), plan: Toss[] = [];
  for (let b = 0; b < 3; b++) {
    const pair = shuffle([{ answer: rights[b], ok: true }, { answer: wrongs[b], ok: false }].filter((p) => p.answer !== undefined));
    const side: -1 | 1 = Math.random() < 0.5 ? -1 : 1;
    pair.forEach((p, j) => plan.push({ at: b * 1.7 + j * 0.3, ...p, side: j ? (-side as -1 | 1) : side }));
  }
  return plan;
}

/** x range a piece of width `w` stays in on its half of the field. */
function bounds(side: -1 | 1, w: number) {
  return side < 0 ? [w / 2 + 4, HALF - 8] : [HALF + 8, WORLD.w - w / 2 - 4];
}

/** Throws a planned answer up from below the field. */
export function toss(ctx: CanvasRenderingContext2D, t: Toss, time: number): Piece {
  const size = measureAnswer(ctx, t.answer), [lo, hi] = bounds(t.side, size.w);
  return {
    answer: t.answer, ok: t.ok, ...size, side: t.side, born: time, alive: true,
    x: lo + Math.random() * Math.max(0, hi - lo), y: WORLD.h + 40,
    vx: t.side * (6 + Math.random() * 14), vy: -(395 + Math.random() * 55),
    rot: (Math.random() - 0.5) * 0.3, vr: (Math.random() - 0.5) * 0.6,
  };
}

/**
 * Moves a wave on by dt: tosses the answers that are due and flies the pieces.
 * Returns the pieces still in play, the right ones that fell unsliced, and
 * whether the wave is over.
 */
export function stepWave(w: Wave, pieces: Piece[], dt: number, ctx: CanvasRenderingContext2D, time: number, onToss: () => void) {
  w.t += dt;
  for (const t of w.plan) {
    if (t.sent || w.t < t.at) continue;
    t.sent = true;
    pieces.push(toss(ctx, t, time));
    onToss();
  }
  const fell = pieces.filter((p) => p.alive && fall(p, dt));
  for (const p of fell) p.alive = false;
  const live = pieces.filter((p) => p.alive);
  return { pieces: live, missed: fell.filter((p) => p.ok), done: w.plan.every((t) => t.sent) && !live.length };
}

/** Flies a piece under gravity, bouncing off the edges of its half. Returns true once it has fallen out. */
function fall(p: Piece, dt: number) {
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  p.vy += GRAVITY * dt;
  p.rot += p.vr * dt;
  const [lo, hi] = bounds(p.side, p.w);
  if (p.x < lo) [p.x, p.vx] = [lo, Math.abs(p.vx)];
  if (p.x > hi) [p.x, p.vx] = [hi, -Math.abs(p.vx)];
  return p.vy > 0 && p.y > WORLD.h + 50;
}
