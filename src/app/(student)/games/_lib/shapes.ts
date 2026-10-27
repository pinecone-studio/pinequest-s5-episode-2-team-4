import type { GameAnswer, GameShape } from "@/lib/types";
import { GAME_COLORS, gameFont } from "./palette";

/** Text shown for an answer (shapes use their name, e.g. for screen readers and summaries). */
export const answerLabel = (answer: GameAnswer) =>
  typeof answer === "string" ? answer : answer.name;

/** Size of the pill an answer is drawn in. Shapes get a fixed square. */
export function measureAnswer(ctx: CanvasRenderingContext2D, answer: GameAnswer) {
  if (typeof answer !== "string") return { w: 64, h: 64 };
  ctx.font = gameFont(700, 15);
  return { w: Math.max(52, ctx.measureText(answer).width + 30), h: 36 };
}

/** Draws an answer centred on (0, 0): its text, or the shape picture. */
export function drawAnswer(ctx: CanvasRenderingContext2D, answer: GameAnswer) {
  if (typeof answer !== "string") return drawShape(ctx, answer);
  ctx.fillStyle = GAME_COLORS.ink;
  ctx.font = gameFont(700, 15);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(answer, 0, 1);
}

function drawShape(ctx: CanvasRenderingContext2D, s: GameShape) {
  ctx.strokeStyle = GAME_COLORS.ink;
  ctx.fillStyle = "rgba(255,255,255,.08)";
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  if (s.shape === "angle") drawAngle(ctx, s.deg);
  else if (s.shape === "poly") drawPolygon(ctx, s);
  else drawMeasured(ctx, s);
}

function drawAngle(ctx: CanvasRenderingContext2D, deg: number) {
  const vx = -14, vy = 12, a = (-deg * Math.PI) / 180, len = 26;
  ctx.beginPath();
  ctx.moveTo(vx + len, vy);
  ctx.lineTo(vx, vy);
  ctx.lineTo(vx + Math.cos(a) * len, vy + Math.sin(a) * len);
  ctx.stroke();
  ctx.strokeStyle = GAME_COLORS.gold;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (deg === 90) {
    ctx.moveTo(vx + 7, vy);
    ctx.lineTo(vx + 7, vy - 7);
    ctx.lineTo(vx, vy - 7);
  } else ctx.arc(vx, vy, 8, a, 0);
  ctx.stroke();
}

function drawPolygon(ctx: CanvasRenderingContext2D, s: Extract<GameShape, { shape: "poly" }>) {
  const n = s.n ?? 3;
  const pts =
    s.pts ??
    Array.from({ length: n }, (_, i): [number, number] => {
      const t = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      return [Math.cos(t) * 1.1, Math.sin(t) * 1.1];
    });
  const P = pts.map(([x, y]) => [x * 17, y * 17]);
  ctx.beginPath();
  P.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (s.right === undefined) return;
  // Small square marking the right angle at corner `right`.
  const [x0, y0] = P[s.right];
  const [x1, y1] = P[(s.right + 1) % P.length];
  const [x2, y2] = P[(s.right + P.length - 1) % P.length];
  const u = Math.hypot(x1 - x0, y1 - y0), v = Math.hypot(x2 - x0, y2 - y0), q = 6;
  const ax = ((x1 - x0) / u) * q, ay = ((y1 - y0) / u) * q, bx = ((x2 - x0) / v) * q, by = ((y2 - y0) / v) * q;
  ctx.strokeStyle = GAME_COLORS.gold;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x0 + ax, y0 + ay);
  ctx.lineTo(x0 + ax + bx, y0 + ay + by);
  ctx.lineTo(x0 + bx, y0 + by);
  ctx.stroke();
}

/** Rectangle or triangle with its side lengths written next to it. */
function drawMeasured(ctx: CanvasRenderingContext2D, s: Extract<GameShape, { shape: "rect" | "tri" }>) {
  const base = s.shape === "rect" ? s.w : s.b;
  const k = 34 / Math.max(base, s.h), w = base * k, h = s.h * k, x = -w / 2, y = -h / 2 + 2;
  ctx.beginPath();
  if (s.shape === "rect") ctx.rect(x, y, w, h);
  else {
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w * 0.35, y);
    ctx.closePath();
  }
  ctx.fill();
  ctx.stroke();
  if (s.shape === "tri") {
    ctx.setLineDash([2, 2]);
    ctx.strokeStyle = GAME_COLORS.gold;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.35, y);
    ctx.lineTo(x + w * 0.35, y + h);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.fillStyle = GAME_COLORS.gold;
  ctx.font = gameFont(700, 10);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(base), 0, y + h + 8);
  ctx.fillText(String(s.h), s.shape === "rect" ? x - 7 : x + w * 0.35 - 6, y + h / 2);
}
