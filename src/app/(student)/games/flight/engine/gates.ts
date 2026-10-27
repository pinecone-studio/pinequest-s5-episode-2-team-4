import type { GameQuestion } from "@/lib/types";
import { shuffle } from "../../_lib/session";
import { measureAnswer } from "../../_lib/shapes";
import { FALCON_R, GATE_DIST, GROUND, PILLAR, TASK_GAP, WORLD, type Gate, type Lane } from "./types";

/** The three gaps between the pillars, below the task banner at `top`. */
export function lanes(top: number): Lane[] {
  const gap = (GROUND - top - 4 * PILLAR) / 3;
  return [0, 1, 2].map((i) => {
    const y0 = top + PILLAR + i * (gap + PILLAR);
    return { y0, y1: y0 + gap, c: y0 + gap / 2 };
  });
}

/** Index of the lane whose centre is closest to `y`. */
export function nearestLane(all: Lane[], y: number) {
  return all.reduce((best, l, i) => (Math.abs(l.c - y) < Math.abs(all[best].c - y) ? i : best), 0);
}

/**
 * Three gates per task, each with one of its right answers and two wrong
 * ones in random lanes. Tasks are spaced a little wider than gates.
 */
export function buildGates(ctx: CanvasRenderingContext2D, rounds: GameQuestion[]): Gate[] {
  const gates: Gate[] = [];
  let x = WORLD.w + 80;
  rounds.forEach((question, round) => {
    const wrongs = shuffle(question.wrong);
    for (let g = 0; g < 3; g++) {
      const picks = [question.correct[g], wrongs[g % wrongs.length], wrongs[(g + 1) % wrongs.length]];
      const items = shuffle(picks.map((answer, j) => ({ answer, ok: j === 0, ...measureAnswer(ctx, answer) })));
      gates.push({ x, round, items, lane: null, done: false, result: null, pop: 0 });
      x += GATE_DIST;
    }
    x += TASK_GAP;
  });
  return gates;
}

/** Keeps the falcon inside the gap it chose: the pillars act as soft bumpers. Returns true on a hard bump. */
export function steerIntoLane(falcon: { y: number; vy: number }, lane: Lane, dt: number) {
  const lo = lane.y0 + FALCON_R + 2, hi = lane.y1 - FALCON_R - 2;
  if (falcon.y >= lo && falcon.y <= hi) return false;
  const target = Math.max(lo, Math.min(hi, falcon.y));
  falcon.y += (target - falcon.y) * Math.min(1, dt * 16);
  if (Math.abs(falcon.vy) <= 120) return false;
  falcon.vy *= -0.35;
  return true;
}
