import type { GameAnswer } from "@/lib/types";
import { GAME_COLORS } from "../../_lib/palette";
import { drawAnswer, measureAnswer } from "../../_lib/shapes";

// The penalty in a fixed 400 × 520 world, seen from behind the spot, drawn as
// pixel art: everything sits on a 4-unit grid and the people and ball are
// pixel sprites (each letter a palette colour, "." transparent). The answers
// stay crisp text so fractions remain readable.

export const W = 400;
export const H = 520;
export const GOAL = { left: 58, right: 342, top: 118, line: 262 };
export const SPOT = { x: W / 2, y: 452 };
const MID_X = (GOAL.left + GOAL.right) / 2;
const MID_Y = (GOAL.top + GOAL.line) / 2;

/** World units per art pixel. */
const P = 4;
const snap = (v: number) => Math.round(v / P) * P;

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

// Sprites

/** Keeper facing us, arms up. */
const KEEPER = [
  "....hhhh....", "...hhhhhh...", "...hffffh...", "...fkffkf...", "...ffffff...",
  "gg..ffff..gg", "gg.ssssss.gg", ".s.ssssss.s.", "..ssssssss..", "...ssssss...",
  "...tttttt...", "...ssssss...", "...ssssss...", "...llllll...", "...llllll...",
  "...ll..ll...", "...ff..ff...", "...ww..ww...", "...ww..ww...", "..bbb..bbb..",
];

/** The keeper diving right: the standing sprite turned a quarter clockwise, so it stays pixel-exact. */
const KEEPER_DIVE = KEEPER[0].split("").map((_, c) => KEEPER.map((row) => row[c]).reverse().join(""));

/** The bot's shooter from behind (number 9), with two leg frames for the run. */
const SHOOTER_TOP = [
  "....hhhh....", "...hhhhhh...", "...hhhhhh...", "....ffff....", "..ssssssss..",
  ".ssswwwssss.", ".sssw.wssss.", ".ssswwwssss.", ".ssssswssss.", ".ssswwwssss.",
  "..ssssssss..", "..llllllll..", "..llllllll..",
];
const SHOOTER = [
  [...SHOOTER_TOP, "..ff....ff..", "..ww....ww..", "..bb....bb.."],
  [...SHOOTER_TOP, "...ff..ff...", "...ww..ww...", "...bb...bb.."],
];

const BALL = [
  ["..kkkk..", ".kwwwwk.", "kwwkkwwk", "kwkkkkwk", "kwwkkwwk", "kwwwwwwk", ".kwwwwk.", "..kkkk.."],
  ["..kkkk..", ".kwkwwk.", "kwwwwkwk", "kwwkkwwk", "kkwkkwwk", "kwwwwwkk", ".kwkwwk.", "..kkkk.."],
];

type Palette = Record<string, string>;

const PEOPLE: Palette = { k: "#1d1647", f: "#f1c7a0", h: "#2b1a10", l: "#1d1647", w: "#f6f3ff", b: "#0d0a22" };
const BALL_COLORS: Palette = { k: "#1d1647", w: "#f6f3ff" };

const sprites = new Map<string, HTMLCanvasElement>();

/** A grid drawn one canvas pixel per art pixel, built once per grid and palette. */
function sprite(grid: string[], palette: Palette) {
  const key = grid.join("/") + JSON.stringify(palette);
  let canvas = sprites.get(key);
  if (canvas) return canvas;
  canvas = document.createElement("canvas");
  const cols = Math.max(...grid.map((r) => r.length));
  canvas.width = cols;
  canvas.height = grid.length;
  const ctx = canvas.getContext("2d");
  grid.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (!ctx || !palette[ch]) return;
      ctx.fillStyle = palette[ch];
      ctx.fillRect(x, y, 1, 1);
    }),
  );
  sprites.set(key, canvas);
  return canvas;
}

/** Draws a sprite with `cell` world units per art pixel; `flip` mirrors it. */
function blit(ctx: CanvasRenderingContext2D, img: HTMLCanvasElement, x: number, y: number, cell: number, flip = false) {
  const w = img.width * cell, h = img.height * cell;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(snap(x), snap(y));
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(img, flip ? -w : 0, 0, w, h);
  ctx.restore();
}

/** A box with its corners notched by one art pixel. */
function pixelBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillRect(x + P, y, w - 2 * P, h);
  ctx.fillRect(x, y + P, w, h - 2 * P);
}

/** A line of art pixels from (x0, y0) to (x1, y1). */
function pixelLine(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
  const steps = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) / P);
  for (let i = 0; i <= steps; i++) {
    const f = steps ? i / steps : 0;
    ctx.fillRect(snap(x0 + (x1 - x0) * f), snap(y0 + (y1 - y0) * f), P, P);
  }
}

// Scene

const SKY = ["#0d0a22", "#140f33", "#1b1444", "#221855", "#2b1a66"];
const STARS = [[40, 8], [92, 20], [150, 6], [214, 16], [268, 4], [330, 22], [372, 10]];
const CROWD = [GAME_COLORS.gold, GAME_COLORS.ink, "#38bdf8", GAME_COLORS.magenta, GAME_COLORS.good];

/** Night stadium: stepped sky, floodlights, a hopping crowd, striped pitch, box lines and the spot. */
export function drawStadium(ctx: CanvasRenderingContext2D, t: number) {
  ctx.imageSmoothingEnabled = false;
  SKY.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(0, i * 24, W, 24);
  });
  STARS.forEach(([x, y], i) => {
    ctx.fillStyle = Math.sin(t * 2 + i * 1.7) > 0.3 ? "#f6f3ff" : "#6b5fb0";
    ctx.fillRect(x, y, P, P);
  });
  // floodlights: pole, lamp and a stepped glow
  for (const x of [24, W - 32]) {
    ctx.fillStyle = "rgb(255 240 200 / 0.12)";
    ctx.fillRect(x - 24, 4, 56, 40);
    ctx.fillStyle = "rgb(255 240 200 / 0.2)";
    ctx.fillRect(x - 12, 12, 32, 24);
    ctx.fillStyle = "#3d2a85";
    ctx.fillRect(x, 28, 8, 72);
    ctx.fillStyle = "#fff6c8";
    ctx.fillRect(x - 8, 20, 24, 8);
  }
  // stands with the crowd; a few fans hop a pixel at a time
  ctx.fillStyle = "#26124f";
  ctx.fillRect(0, 56, W, 64);
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 26; i++) {
      const hop = Math.sin(t * 5 + i * 1.3 + row) > 0.7 ? P : 0;
      ctx.fillStyle = CROWD[(i + row * 2) % 5];
      ctx.fillRect((row % 2 ? 8 : 0) + i * 16, 64 + row * 16 - hop, 8, 8);
    }
  }
  // advertising boards
  ctx.fillStyle = "#1d1647";
  ctx.fillRect(0, 116, W, 12);
  for (let x = 0; x < W; x += 40) {
    ctx.fillStyle = (x / 40) % 2 ? GAME_COLORS.violet : GAME_COLORS.magenta;
    ctx.fillRect(x + 8, 120, 24, 4);
  }
  // pitch stripes
  for (let i = 0; i < 9; i++) {
    ctx.fillStyle = i % 2 ? "#3f9a4f" : "#46a857";
    ctx.fillRect(0, 128 + i * 44, W, 44);
  }
  ctx.fillStyle = "rgb(255 255 255 / 0.85)";
  ctx.fillRect(0, GOAL.line, W, P);
  pixelLine(ctx, 16, GOAL.line, -32, 420);
  pixelLine(ctx, W - 20, GOAL.line, W + 28, 420);
  pixelLine(ctx, 108, GOAL.line, 96, 300);
  pixelLine(ctx, 292, GOAL.line, 304, 300);
  ctx.fillRect(96, 300, 212, P);
  ctx.fillStyle = "#f6f3ff";
  ctx.fillRect(SPOT.x - 6, SPOT.y + 14, 12, P);
}

/** Net behind the frame, then the posts and crossbar. */
export function drawGoal(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "rgb(13 10 34 / 0.35)";
  ctx.fillRect(GOAL.left, GOAL.top, GOAL.right - GOAL.left, GOAL.line - GOAL.top);
  ctx.fillStyle = "rgb(255 255 255 / 0.3)";
  for (let x = GOAL.left + 16; x < GOAL.right; x += 16) ctx.fillRect(x, GOAL.top, 2, GOAL.line - GOAL.top);
  for (let y = GOAL.top + 16; y < GOAL.line; y += 16) ctx.fillRect(GOAL.left, y, GOAL.right - GOAL.left, 2);
  // posts with a shaded inner edge
  ctx.fillStyle = "#f6f3ff";
  ctx.fillRect(GOAL.left - 8, GOAL.top - 8, 8, GOAL.line - GOAL.top + 8);
  ctx.fillRect(GOAL.right, GOAL.top - 8, 8, GOAL.line - GOAL.top + 8);
  ctx.fillRect(GOAL.left - 8, GOAL.top - 8, GOAL.right - GOAL.left + 16, 8);
  ctx.fillStyle = "#b4a9e3";
  ctx.fillRect(GOAL.left - 2, GOAL.top, 2, GOAL.line - GOAL.top);
  ctx.fillRect(GOAL.right, GOAL.top, 2, GOAL.line - GOAL.top);
  ctx.fillRect(GOAL.left, GOAL.top - 2, GOAL.right - GOAL.left, 2);
}

/** The 4 target corners with their answers; `pick` lights the one aimed at. */
export function drawZones(ctx: CanvasRenderingContext2D, choices: GameAnswer[], t: number, pick: number | null, result?: { zone: number; right: number }) {
  ZONES.forEach((z, i) => {
    const pad = 8;
    const isPick = pick === i, isRight = result && result.right === i, isWrongPick = result && result.zone === i && result.right !== i;
    const x = z.x + pad, y = z.y + pad, w = z.w - pad * 2, h = z.h - pad * 2;
    ctx.globalAlpha = result && !isRight && !isWrongPick ? 0.35 : 1;
    ctx.fillStyle = isRight ? "rgb(52 211 153 / 0.28)" : isWrongPick ? "rgb(255 77 109 / 0.3)" : isPick ? "rgb(255 207 90 / 0.25)" : "rgb(91 0 237 / 0.22)";
    ctx.fillRect(x, y, w, h);
    // a dashed pixel frame that marches round
    ctx.fillStyle = isRight ? GAME_COLORS.good : isWrongPick ? GAME_COLORS.bad : isPick ? GAME_COLORS.gold : "rgb(246 243 255 / 0.55)";
    const march = Math.floor(t * 6) % 2 ? P * 2 : 0;
    for (let d = march; d < w; d += P * 4) {
      const len = Math.min(P * 2, w - d);
      ctx.fillRect(x + d, y, len, P);
      ctx.fillRect(x + w - d - len, y + h - P, len, P);
    }
    for (let d = march; d < h; d += P * 4) {
      const len = Math.min(P * 2, h - d);
      ctx.fillRect(x + w - P, y + d, P, len);
      ctx.fillRect(x, y + h - d - len, P, len);
    }
    // the answer on a notched plate
    const m = measureAnswer(ctx, choices[i]);
    const s = Math.min(1, (z.w - 28) / m.w, (z.h - 24) / m.h);
    ctx.fillStyle = "rgb(13 10 34 / 0.85)";
    pixelBox(ctx, z.cx - (m.w * s) / 2 - P, z.cy - (m.h * s) / 2, m.w * s + 2 * P, m.h * s);
    ctx.save();
    ctx.translate(z.cx, z.cy);
    ctx.scale(s, s);
    drawAnswer(ctx, choices[i]);
    ctx.restore();
    ctx.globalAlpha = 1;
  });
}

const kitPalette = (kit: Kit): Palette => ({ ...PEOPLE, s: kit.shirt, t: kit.trim, g: kit.gloves });

/** Keeper standing on the line or diving: `dive` 0…1 toward (tx, ty). */
export function drawKeeper(ctx: CanvasRenderingContext2D, kit: Kit, t: number, dive: number, tx: number, ty: number) {
  const x0 = MID_X, y0 = GOAL.line - 4;
  const e = 1 - (1 - dive) * (1 - dive);
  const x = x0 + (tx - x0) * e * 0.92, y = y0 + (ty + 34 - y0) * e;
  const side = Math.sign(tx - x0);
  const palette = kitPalette(kit);
  if (e > 0.3 && side) {
    // Diving: lying flat toward the ball, gloves first.
    const img = sprite(KEEPER_DIVE, palette);
    blit(ctx, img, x - (img.width * P) / 2, y - 34 - (img.height * P) / 2, P, side < 0);
    return;
  }
  const img = sprite(KEEPER, palette);
  const bob = !dive && Math.sin(t * 6) > 0 ? P : 0;
  blit(ctx, img, x - (img.width * P) / 2, y - img.height * P - bob, P);
}

/** The bot's shooter, seen from behind, running up: `run` 0…1. */
export function drawShooter(ctx: CanvasRenderingContext2D, run: number, t: number) {
  const cell = 5;
  const x = 262 - run * 44, y = 512 - run * 38;
  const frame = run < 1 && Math.sin(t * 16) > 0 ? 1 : 0;
  const img = sprite(SHOOTER[frame], { ...PEOPLE, s: KITS.bot.shirt });
  blit(ctx, img, x - (img.width * cell) / 2, y - img.height * cell, cell);
}

/** The pixel ball with a shadow; `k` scales it with distance, `spin` swaps its frames. */
export function drawBall(ctx: CanvasRenderingContext2D, x: number, y: number, k: number, spin: number) {
  const cell = Math.max(2, Math.round(4.25 * k));
  const size = 8 * cell;
  ctx.fillStyle = "rgb(0 0 0 / 0.25)";
  ctx.fillRect(snap(x - size * 0.4), snap(y + size * 0.4), snap(size * 0.8), P);
  const img = sprite(BALL[Math.floor(spin / 1.5) % 2], BALL_COLORS);
  blit(ctx, img, x - size / 2, y - size / 2, cell);
}
