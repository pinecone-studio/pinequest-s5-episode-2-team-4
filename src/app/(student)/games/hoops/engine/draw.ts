import type { GameAnswer } from "@/lib/types";
import { GAME_COLORS } from "../../_lib/palette";
import { drawAnswer, measureAnswer } from "../../_lib/shapes";

// The court in a fixed 400 × 560 world: the hoop's plane is far away near
// the top, the ball rests near the bottom and shrinks as it flies away.
// Drawn as pixel art on a 4-unit grid; the answers stay crisp text.

export const W = 400;
export const H = 560;
export const RIM_Y = 206;
export const RIM_HALF = 40;
export const BOARD = { halfW: 74, top: 92, bottom: 196 };
export const BALL_REST = { x: W / 2, y: 470 };
export const BALL_R = 32;
/** Ball size at the hoop's plane, as a share of its size at rest. */
export const FAR = 0.52;

/** World units per art pixel. */
const P = 4;
const snap = (v: number, step = P) => Math.round(v / step) * step;

/** A line of `size` art pixels from (x0, y0) to (x1, y1). */
function pixelLine(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, size = P) {
  const steps = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) / size);
  for (let i = 0; i <= steps; i++) {
    const f = steps ? i / steps : 0;
    ctx.fillRect(snap(x0 + (x1 - x0) * f, size), snap(y0 + (y1 - y0) * f, size), size, size);
  }
}

/** Part of an ellipse in `size` art pixels, angles a0…a1. */
function pixelArc(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, size = P) {
  const steps = Math.ceil(((a1 - a0) * Math.max(rx, ry)) / size);
  for (let i = 0; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps;
    ctx.fillRect(snap(cx + Math.cos(a) * rx, size), snap(cy + Math.sin(a) * ry, size), size, size);
  }
}

/** A box with its corners notched by one art pixel. */
function pixelBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, n = P) {
  ctx.fillRect(x + n, y, w - 2 * n, h);
  ctx.fillRect(x, y + n, w, h - 2 * n);
}

const WALL = ["#0d0a22", "#140f33", "#1b1444", "#221855", "#2b1a66"];
const FLOOR = ["#a8683a", "#b8763f", "#c88446", "#d6924f", "#e0a160"];
const CROWD = [GAME_COLORS.gold, GAME_COLORS.magenta, "#38bdf8", GAME_COLORS.ink];

/** Gym wall, wooden floor with lines, and spotlights. */
export function drawCourt(ctx: CanvasRenderingContext2D, t: number) {
  ctx.imageSmoothingEnabled = false;
  WALL.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(0, i * 60, W, 60);
  });
  // spotlights: stepped beams that breathe
  for (const x of [72, 328]) {
    const a = 0.06 + (Math.sin(t * 2 + x) > 0 ? 0.02 : 0);
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = `rgb(255 255 255 / ${a})`;
      const half = 12 + i * 20;
      ctx.fillRect(x - half, i * 72, half * 2, 72);
    }
    ctx.fillStyle = "#fff6c8";
    ctx.fillRect(x - 12, 0, 24, 8);
  }
  // crowd rail; a few fans hop a pixel at a time
  ctx.fillStyle = "#1d1647";
  ctx.fillRect(0, 300, W, 32);
  for (let i = 0; i < 24; i++) {
    const hop = Math.sin(t * 5 + i * 1.3) > 0.7 ? P : 0;
    ctx.fillStyle = CROWD[i % 4];
    ctx.fillRect(4 + i * 17 - ((4 + i * 17) % P), 308 - hop, 8, 8);
  }
  // floor in bands, planks fanning out from the hoop
  FLOOR.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(0, 332 + i * 48, W, 48);
  });
  ctx.fillStyle = "rgb(0 0 0 / 0.1)";
  for (let x = -200; x < W + 200; x += 36) pixelLine(ctx, W / 2 + (x - W / 2) * 0.35, 336, x, H, 2);
  // key and three-point line
  ctx.fillStyle = "rgb(255 255 255 / 0.8)";
  pixelLine(ctx, 140, 332, 112, 440);
  pixelLine(ctx, 260, 332, 288, 440);
  ctx.fillRect(112, 440, 180, P);
  pixelArc(ctx, W / 2, 332, 168, 148, 0, Math.PI);
}

/** Glass backboard with its target square and the pole. */
export function drawBoard(ctx: CanvasRenderingContext2D, x: number) {
  const left = snap(x - BOARD.halfW), w = BOARD.halfW * 2, h = BOARD.bottom - BOARD.top;
  ctx.fillStyle = "#4b3a8f";
  ctx.fillRect(snap(x) - 4, BOARD.bottom, 8, 104);
  ctx.fillStyle = GAME_COLORS.ink;
  pixelBox(ctx, left, BOARD.top, w, h);
  ctx.fillStyle = "#3a2d78";
  ctx.fillRect(left + P, BOARD.top + P, w - 2 * P, h - 2 * P);
  // glass glint
  ctx.fillStyle = "rgb(246 243 255 / 0.25)";
  ctx.fillRect(left + 12, BOARD.top + 12, 24, P);
  ctx.fillRect(left + 12, BOARD.top + 16, P, 16);
  // target square
  ctx.fillStyle = GAME_COLORS.magenta;
  const tx = snap(x) - 24, ty = BOARD.bottom - 44;
  ctx.fillRect(tx, ty, 48, P);
  ctx.fillRect(tx, ty + 32, 48, P);
  ctx.fillRect(tx, ty, P, 36);
  ctx.fillRect(tx + 44, ty, P, 36);
}

/** Back half of the rim, drawn behind the ball. */
export function drawRimBack(ctx: CanvasRenderingContext2D, x: number) {
  ctx.fillStyle = "#c2410c";
  pixelArc(ctx, x, RIM_Y, RIM_HALF, 8, Math.PI, Math.PI * 2);
}

/** Net and the front half of the rim, drawn over a ball that drops through. `swish` 0…1 stretches the net. */
export function drawRimFront(ctx: CanvasRenderingContext2D, x: number, swish: number) {
  const depth = 54 + swish * 16, bottom = RIM_HALF * (0.55 - swish * 0.12);
  ctx.fillStyle = "rgb(255 255 255 / 0.85)";
  for (let i = 0; i <= 6; i++) {
    const a = i / 6;
    pixelLine(ctx, x - RIM_HALF + a * RIM_HALF * 2, RIM_Y + 4, x - bottom + a * bottom * 2, RIM_Y + depth, 2);
  }
  for (let j = 1; j <= 3; j++) {
    const k = j / 3;
    pixelArc(ctx, x, RIM_Y + depth * k, RIM_HALF + (bottom - RIM_HALF) * k, 4, 0, Math.PI, 2);
  }
  ctx.fillStyle = "#f97316";
  pixelArc(ctx, x, RIM_Y, RIM_HALF, 8, 0, Math.PI);
  pixelArc(ctx, x, RIM_Y + 2, RIM_HALF, 8, 0, Math.PI);
}

// The ball: a 16 × 16 pixel sprite with 2 spin frames (seams square, then turned 45°).

const BALL_GRID = 16;
const ballFrames: HTMLCanvasElement[] = [];

function ballFrame(frame: number) {
  if (ballFrames[frame]) return ballFrames[frame];
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = BALL_GRID;
  const ctx = canvas.getContext("2d");
  const c = BALL_GRID / 2, turn = frame ? Math.PI / 4 : 0;
  for (let y = 0; y < BALL_GRID; y++) {
    for (let x = 0; x < BALL_GRID; x++) {
      const dx = x + 0.5 - c, dy = y + 0.5 - c;
      const d = Math.hypot(dx, dy);
      if (!ctx || d > c) continue;
      // seams in the ball's own (turned) frame: a cross and two side curves
      const u = dx * Math.cos(turn) + dy * Math.sin(turn), v = -dx * Math.sin(turn) + dy * Math.cos(turn);
      const curve = Math.min(Math.abs(Math.hypot(u + 12, v) - 9), Math.abs(Math.hypot(u - 12, v) - 9));
      const seam = Math.abs(u) < 0.6 || Math.abs(v) < 0.6 || curve < 0.6;
      const light = Math.hypot(dx + 3, dy + 3) < 3.5;
      ctx.fillStyle = d > c - 1 ? "#5a2208" : seam ? "#5a2208" : light ? "#ffb15c" : "#e8702a";
      ctx.fillRect(x, y, 1, 1);
    }
  }
  ballFrames[frame] = canvas;
  return canvas;
}

/** A basketball with its answer on a label; `k` scales it with distance. */
export function drawBall(ctx: CanvasRenderingContext2D, x: number, y: number, k: number, spin: number, answer: GameAnswer | null) {
  const cell = Math.max(2, Math.round((BALL_R * 2 * k) / BALL_GRID));
  const size = cell * BALL_GRID, r = size / 2;
  const left = snap(x - r, 2), top = snap(y - r, 2);
  ctx.fillStyle = "rgb(0 0 0 / 0.25)";
  ctx.fillRect(snap(x - r * 0.8, 2), snap(y + r * 0.95, 2), snap(r * 1.6, 2), P);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(ballFrame(Math.floor(Math.abs(spin) / 0.8) % 2), left, top, size, size);
  ctx.restore();

  if (!answer) return;
  // the answer on a notched plate across the ball, scaled to fit
  const m = measureAnswer(ctx, answer);
  const s = Math.min(1, 118 / m.w) * k;
  const w = m.w * s, h = m.h * s;
  const n = Math.max(2, Math.round(P * k));
  ctx.fillStyle = GAME_COLORS.gold;
  pixelBox(ctx, x - w / 2 - n, y - h / 2 - n / 2, w + 2 * n, h + n, n);
  ctx.fillStyle = "rgb(13 10 34 / 0.92)";
  pixelBox(ctx, x - w / 2, y - h / 2, w, h, n);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  drawAnswer(ctx, answer);
  ctx.restore();
}
