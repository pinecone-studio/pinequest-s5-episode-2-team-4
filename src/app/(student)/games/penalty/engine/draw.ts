import type { GameAnswer } from "@/lib/types";
import { roundRect } from "../../_lib/canvas";
import { GAME_COLORS, gameFont } from "../../_lib/palette";
import { drawAnswer, measureAnswer } from "../../_lib/shapes";

// The penalty in a fixed 400 × 520 world, seen from behind the spot.

export const W = 400;
export const H = 520;
export const GOAL = { left: 58, right: 342, top: 118, line: 262 };
export const SPOT = { x: W / 2, y: 452 };
const MID_X = (GOAL.left + GOAL.right) / 2;
const MID_Y = (GOAL.top + GOAL.line) / 2;

/** The 4 corners: top-left, top-right, bottom-left, bottom-right. */
export const ZONES = [0, 1, 2, 3].map((i) => {
  const x = i % 2 ? MID_X : GOAL.left, y = i < 2 ? GOAL.top : MID_Y;
  return { x, y, w: MID_X - GOAL.left, h: MID_Y - GOAL.top, cx: x + (MID_X - GOAL.left) / 2, cy: y + (MID_Y - GOAL.top) / 2 };
});

export function zoneAt(x: number, y: number) {
  return ZONES.findIndex((z) => x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h);
}

export type Kit = { shirt: string; trim: string; gloves: string };

export const KITS: Record<"you" | "bot", Kit> = {
  you: { shirt: GAME_COLORS.gold, trim: "#b8892a", gloves: "#34d399" },
  bot: { shirt: GAME_COLORS.magenta, trim: "#8f0068", gloves: "#38bdf8" },
};

/** Night stadium: floodlights, crowd, striped pitch, box lines and the spot. */
export function drawStadium(ctx: CanvasRenderingContext2D, t: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, 120);
  sky.addColorStop(0, "#0d0a22");
  sky.addColorStop(1, "#2b1a66");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, 120);
  // floodlights
  for (const x of [26, W - 26]) {
    ctx.fillStyle = "#3d2a85";
    ctx.fillRect(x - 3, 20, 6, 80);
    const g = ctx.createRadialGradient(x, 22, 2, x, 22, 70);
    g.addColorStop(0, "rgb(255 255 255 / 0.9)");
    g.addColorStop(0.15, "rgb(255 240 200 / 0.45)");
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.fillRect(x - 70, 0, 140, 100);
  }
  // stands with the crowd
  ctx.fillStyle = "#26124f";
  ctx.fillRect(0, 56, W, 70);
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 26; i++) {
      ctx.fillStyle = [GAME_COLORS.gold, GAME_COLORS.ink, "#38bdf8", GAME_COLORS.magenta, GAME_COLORS.good][(i + row * 2) % 5];
      ctx.globalAlpha = 0.75;
      ctx.beginPath();
      ctx.arc((row % 2 ? 8 : 0) + i * 16, 68 + row * 17 + Math.sin(t * 5 + i + row) * 1.2, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#1d1647";
  ctx.fillRect(0, 118, W, 10);
  // pitch stripes
  for (let i = 0; i < 9; i++) {
    const y0 = 128 + i * 44;
    ctx.fillStyle = i % 2 ? "#3f9a4f" : "#46a857";
    ctx.fillRect(0, y0, W, 44);
  }
  ctx.strokeStyle = "rgb(255 255 255 / 0.8)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, GOAL.line);
  ctx.lineTo(W, GOAL.line);
  ctx.moveTo(18, GOAL.line);
  ctx.lineTo(-30, 420);
  ctx.moveTo(W - 18, GOAL.line);
  ctx.lineTo(W + 30, 420);
  ctx.moveTo(110, GOAL.line);
  ctx.lineTo(96, 300);
  ctx.lineTo(304, 300);
  ctx.lineTo(290, GOAL.line);
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.ellipse(SPOT.x, SPOT.y + 16, 5, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** Net behind the frame, then the posts and crossbar. */
export function drawGoal(ctx: CanvasRenderingContext2D) {
  const depth = 26;
  ctx.fillStyle = "rgb(13 10 34 / 0.35)";
  ctx.fillRect(GOAL.left, GOAL.top, GOAL.right - GOAL.left, GOAL.line - GOAL.top);
  ctx.strokeStyle = "rgb(255 255 255 / 0.35)";
  ctx.lineWidth = 1;
  for (let x = GOAL.left; x <= GOAL.right; x += 14) {
    ctx.beginPath();
    ctx.moveTo(x, GOAL.top);
    ctx.lineTo(x + (x - 200) * 0.06, GOAL.line - depth * 0.2);
    ctx.stroke();
  }
  for (let y = GOAL.top; y <= GOAL.line; y += 14) {
    ctx.beginPath();
    ctx.moveTo(GOAL.left, y);
    ctx.lineTo(GOAL.right, y);
    ctx.stroke();
  }
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(GOAL.left, GOAL.line);
  ctx.lineTo(GOAL.left, GOAL.top);
  ctx.lineTo(GOAL.right, GOAL.top);
  ctx.lineTo(GOAL.right, GOAL.line);
  ctx.stroke();
}

/** The 4 target corners with their answers; `pick` lights the one aimed at. */
export function drawZones(ctx: CanvasRenderingContext2D, choices: GameAnswer[], t: number, pick: number | null, result?: { zone: number; right: number }) {
  ZONES.forEach((z, i) => {
    const pad = 6;
    const isPick = pick === i, isRight = result && result.right === i, isWrongPick = result && result.zone === i && result.right !== i;
    ctx.globalAlpha = result && !isRight && !isWrongPick ? 0.35 : 1;
    ctx.fillStyle = isRight ? "rgb(52 211 153 / 0.28)" : isWrongPick ? "rgb(255 77 109 / 0.3)" : isPick ? "rgb(255 207 90 / 0.25)" : "rgb(91 0 237 / 0.22)";
    roundRect(ctx, z.x + pad, z.y + pad, z.w - pad * 2, z.h - pad * 2, 10);
    ctx.fill();
    ctx.setLineDash([6, 5]);
    ctx.lineDashOffset = -t * 20;
    ctx.strokeStyle = isRight ? GAME_COLORS.good : isWrongPick ? GAME_COLORS.bad : isPick ? GAME_COLORS.gold : "rgb(246 243 255 / 0.55)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
    // the answer on a pill
    const m = measureAnswer(ctx, choices[i]);
    const s = Math.min(1, (z.w - 24) / m.w, (z.h - 20) / m.h);
    ctx.fillStyle = "rgb(13 10 34 / 0.85)";
    roundRect(ctx, z.cx - (m.w * s) / 2, z.cy - (m.h * s) / 2, m.w * s, m.h * s, (m.h * s) / 2);
    ctx.fill();
    ctx.save();
    ctx.translate(z.cx, z.cy);
    ctx.scale(s, s);
    drawAnswer(ctx, choices[i]);
    ctx.restore();
    ctx.globalAlpha = 1;
  });
}

/** Keeper standing on the line or diving: `dive` 0…1 toward (tx, ty). */
export function drawKeeper(ctx: CanvasRenderingContext2D, kit: Kit, t: number, dive: number, tx: number, ty: number) {
  const x0 = MID_X, y0 = GOAL.line - 4;
  const e = 1 - (1 - dive) * (1 - dive);
  const x = x0 + (tx - x0) * e * 0.92, y = y0 + (ty + 34 - y0) * e;
  const side = Math.sign(tx - x0) || 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(side * e * 1.1);
  const bob = dive ? 0 : Math.sin(t * 6) * 2;
  // legs
  ctx.strokeStyle = "#1d1647";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * 7, -34);
    ctx.lineTo(s * (12 + e * 4), -2);
    ctx.stroke();
  }
  // body
  ctx.fillStyle = kit.shirt;
  roundRect(ctx, -15, -70 + bob, 30, 40, 10);
  ctx.fill();
  ctx.fillStyle = kit.trim;
  ctx.fillRect(-15, -52 + bob, 30, 4);
  // arms up with gloves
  ctx.strokeStyle = kit.shirt;
  ctx.lineWidth = 7;
  for (const s of [-1, 1]) {
    const ax = s * (26 + e * 6), ay = -88 + bob - e * 8;
    ctx.beginPath();
    ctx.moveTo(s * 12, -64 + bob);
    ctx.lineTo(ax, ay);
    ctx.stroke();
    ctx.fillStyle = kit.gloves;
    ctx.beginPath();
    ctx.arc(ax, ay, 7, 0, Math.PI * 2);
    ctx.fill();
  }
  // head
  ctx.fillStyle = "#f1c7a0";
  ctx.beginPath();
  ctx.arc(0, -82 + bob, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2b1a10";
  ctx.beginPath();
  ctx.arc(0, -85 + bob, 11, Math.PI, 0);
  ctx.fill();
  ctx.restore();
}

/** The bot's shooter, seen from behind, running up: `run` 0…1. */
export function drawShooter(ctx: CanvasRenderingContext2D, run: number, t: number) {
  const x = 262 - run * 44, y = 512 - run * 38;
  const stride = Math.sin(t * 16) * (run < 1 ? 1 : 0);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1.25, 1.25);
  ctx.strokeStyle = "#1d1647";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * 6, -34);
    ctx.lineTo(s * 6 + stride * s * 8, -4);
    ctx.stroke();
  }
  ctx.fillStyle = KITS.bot.shirt;
  roundRect(ctx, -15, -72, 30, 40, 10);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = gameFont(800, 16);
  ctx.textAlign = "center";
  ctx.fillText("9", 0, -46);
  ctx.fillStyle = "#2b1a10";
  ctx.beginPath();
  ctx.arc(0, -84, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** A classic black-and-white ball; `k` scales it with distance. */
export function drawBall(ctx: CanvasRenderingContext2D, x: number, y: number, k: number, spin: number) {
  const r = 17 * k;
  ctx.fillStyle = "rgb(0 0 0 / 0.25)";
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.95, r * 0.9, r * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spin);
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1d1647";
  const pent = (cx: number, cy: number, s: number) => {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      ctx.lineTo(cx + Math.cos(a) * s, cy + Math.sin(a) * s);
    }
    ctx.fill();
  };
  pent(0, 0, r * 0.38);
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    pent(Math.cos(a) * r * 0.86, Math.sin(a) * r * 0.86, r * 0.22);
  }
  ctx.strokeStyle = "rgb(0 0 0 / 0.2)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
