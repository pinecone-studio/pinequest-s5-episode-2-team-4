import type { GameAnswer } from "@/lib/types";
import { roundRect } from "../../_lib/canvas";
import { GAME_COLORS } from "../../_lib/palette";
import { drawAnswer, measureAnswer } from "../../_lib/shapes";

// The court in a fixed 400 × 560 world: the hoop's plane is far away near
// the top, the ball rests near the bottom and shrinks as it flies away.

export const W = 400;
export const H = 560;
export const RIM_Y = 206;
export const RIM_HALF = 40;
export const BOARD = { halfW: 74, top: 92, bottom: 196 };
export const BALL_REST = { x: W / 2, y: 470 };
export const BALL_R = 32;
/** Ball size at the hoop's plane, as a share of its size at rest. */
export const FAR = 0.52;

/** Gym wall, wooden floor with lines, and spotlights. */
export function drawCourt(ctx: CanvasRenderingContext2D, t: number) {
  const wall = ctx.createLinearGradient(0, 0, 0, 330);
  wall.addColorStop(0, "#0d0a22");
  wall.addColorStop(1, "#2b1a66");
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, W, 330);
  // spotlights
  for (const [x, a] of [
    [70, 0.2],
    [330, 0.2],
  ] as const) {
    const g = ctx.createRadialGradient(x, 0, 4, x, 120, 220);
    g.addColorStop(0, `rgb(255 255 255 / ${a + 0.05 * Math.sin(t * 2 + x)})`);
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, 330);
  }
  // crowd rail
  ctx.fillStyle = "#1d1647";
  ctx.fillRect(0, 300, W, 30);
  for (let i = 0; i < 24; i++) {
    ctx.fillStyle = [GAME_COLORS.gold, GAME_COLORS.magenta, "#38bdf8", GAME_COLORS.ink][i % 4];
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(10 + i * 17, 312 + Math.sin(t * 5 + i) * 1.5, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // floor
  const floor = ctx.createLinearGradient(0, 330, 0, H);
  floor.addColorStop(0, "#b0703a");
  floor.addColorStop(1, "#e0a160");
  ctx.fillStyle = floor;
  ctx.fillRect(0, 330, W, H - 330);
  ctx.strokeStyle = "rgb(0 0 0 / 0.08)";
  ctx.lineWidth = 1;
  for (let x = -200; x < W + 200; x += 34) {
    ctx.beginPath();
    ctx.moveTo(W / 2 + (x - W / 2) * 0.35, 330);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  // key and three-point line
  ctx.strokeStyle = "rgb(255 255 255 / 0.75)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(140, 330);
  ctx.lineTo(110, 440);
  ctx.lineTo(290, 440);
  ctx.lineTo(260, 330);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(W / 2, 330, 170, 150, 0, 0, Math.PI);
  ctx.stroke();
}

/** Glass backboard with its target square and the pole. */
export function drawBoard(ctx: CanvasRenderingContext2D, x: number) {
  ctx.fillStyle = "#4b3a8f";
  ctx.fillRect(x - 5, BOARD.bottom, 10, 104);
  ctx.fillStyle = "rgb(246 243 255 / 0.18)";
  ctx.strokeStyle = GAME_COLORS.ink;
  ctx.lineWidth = 3;
  roundRect(ctx, x - BOARD.halfW, BOARD.top, BOARD.halfW * 2, BOARD.bottom - BOARD.top, 6);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = GAME_COLORS.magenta;
  ctx.strokeRect(x - 24, BOARD.bottom - 44, 48, 36);
}

/** Back half of the rim, drawn behind the ball. */
export function drawRimBack(ctx: CanvasRenderingContext2D, x: number) {
  ctx.strokeStyle = "#c2410c";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(x, RIM_Y, RIM_HALF, 8, 0, Math.PI, Math.PI * 2);
  ctx.stroke();
}

/** Net and the front half of the rim, drawn over a ball that drops through. `swish` 0…1 stretches the net. */
export function drawRimFront(ctx: CanvasRenderingContext2D, x: number, swish: number) {
  const depth = 54 + swish * 16, bottom = RIM_HALF * (0.55 - swish * 0.12);
  ctx.strokeStyle = "rgb(255 255 255 / 0.85)";
  ctx.lineWidth = 1.5;
  for (let i = 0; i <= 8; i++) {
    const a = i / 8;
    const top = x - RIM_HALF + a * RIM_HALF * 2;
    const low = x - bottom + a * bottom * 2;
    ctx.beginPath();
    ctx.moveTo(top, RIM_Y + 2);
    ctx.lineTo(low, RIM_Y + depth);
    ctx.stroke();
  }
  for (let j = 1; j <= 3; j++) {
    const k = j / 3, half = RIM_HALF + (bottom - RIM_HALF) * k;
    ctx.beginPath();
    ctx.ellipse(x, RIM_Y + depth * k, half, 4, 0, 0, Math.PI);
    ctx.stroke();
  }
  ctx.strokeStyle = "#f97316";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(x, RIM_Y, RIM_HALF, 8, 0, 0, Math.PI);
  ctx.stroke();
}

/** A basketball with its answer on a label; `k` scales it with distance. */
export function drawBall(ctx: CanvasRenderingContext2D, x: number, y: number, k: number, spin: number, answer: GameAnswer | null) {
  const r = BALL_R * k;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgb(0 0 0 / 0.25)";
  ctx.beginPath();
  ctx.ellipse(0, r * 1.05, r * 0.9, r * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  const g = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
  g.addColorStop(0, "#ffb15c");
  g.addColorStop(1, "#d9591a");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(spin);
  ctx.strokeStyle = "#5a2208";
  ctx.lineWidth = Math.max(1, 2 * k);
  ctx.beginPath();
  ctx.moveTo(-r, 0);
  ctx.lineTo(r, 0);
  ctx.moveTo(0, -r);
  ctx.lineTo(0, r);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-r * 1.25, 0, r * 0.85, -0.85, 0.85);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(r * 1.25, 0, r * 0.85, Math.PI - 0.85, Math.PI + 0.85);
  ctx.stroke();
  ctx.restore();

  if (!answer) return;
  // the answer on a pill across the ball, scaled to fit
  const m = measureAnswer(ctx, answer);
  const s = Math.min(1, 118 / m.w) * k;
  const w = m.w * s, h = m.h * s;
  ctx.fillStyle = "rgb(13 10 34 / 0.88)";
  roundRect(ctx, x - w / 2, y - h / 2, w, h, h / 2);
  ctx.fill();
  ctx.strokeStyle = GAME_COLORS.gold;
  ctx.lineWidth = 1.5 * k;
  ctx.stroke();
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  drawAnswer(ctx, answer);
  ctx.restore();
}
