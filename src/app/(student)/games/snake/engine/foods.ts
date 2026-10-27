import type { GameQuestion } from "@/lib/types";
import { measureAnswer } from "../../_lib/shapes";
import { shuffle } from "../../_lib/session";
import { WORLD, type Food, type Snake } from "./types";

/** Spreads the question's answers over the field, away from the head and from each other. */
export function placeFoods(
  ctx: CanvasRenderingContext2D,
  question: GameQuestion,
  snake: Snake,
  top: number,
  now: number,
): Food[] {
  const answers = shuffle([
    ...question.correct.map((answer) => ({ answer, ok: true })),
    ...question.wrong.map((answer) => ({ answer, ok: false })),
  ]);
  const foods: Food[] = [];
  for (const { answer, ok } of answers) {
    const { w, h } = measureAnswer(ctx, answer);
    let x = 0, y = 0;
    for (let tries = 0; tries < 300; tries++) {
      x = 24 + w / 2 + Math.random() * (WORLD.w - 48 - w);
      y = top + 30 + Math.random() * (WORLD.h - top - 70);
      const nearHead = Math.hypot(x - snake.x, y - snake.y) < 100;
      const overlaps = foods.some(
        (f) => Math.abs(f.x - x) < (f.w + w) / 2 + 14 && Math.abs(f.y - y) < (f.h + h) / 2 + 14,
      );
      if (!nearHead && !overlaps) break;
    }
    foods.push({ answer, ok, x, y, w, h, born: now + foods.length * 0.06, near: 0, dying: 0 });
  }
  return foods;
}
