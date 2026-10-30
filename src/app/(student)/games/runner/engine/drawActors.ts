import type { GameAnswer } from "@/lib/types";
import type { PixelIconName } from "@/components/ui/PixelIcon";
import { drawPixelIcon } from "../../_lib/canvas";
import { GAME_COLORS, gameFont } from "../../_lib/palette";
import { drawAnswer, measureAnswer } from "../../_lib/shapes";
import { LANE, laneX, scaleAt, yAt } from "./world";

// The gates, hero and boss as pixel art. The hero and boss are sprites (each
// letter a palette colour, "." transparent) scaled in whole art pixels; the
// answers and power numbers stay crisp text.

export type GateLook = {
  choices: GameAnswer[];
  answer: number;
  /** Set once the hero ran through: which lane, and whether it was right. */
  hit?: { lane: number; ok: boolean };
};

/** World units per art pixel at the hero's distance. */
const P = 4;
const snap = (v: number, step = P) => Math.round(v / step) * step;

type Palette = Record<string, string>;
const sprites = new Map<string, HTMLCanvasElement>();

/** A grid drawn one canvas pixel per art pixel, built once per grid and palette. */
function sprite(grid: string[], palette: Palette) {
  const key = grid.join("/") + JSON.stringify(palette);
  let canvas = sprites.get(key);
  if (canvas) return canvas;
  canvas = document.createElement("canvas");
  canvas.width = Math.max(...grid.map((r) => r.length));
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

/** Draws a sprite `cell` units per art pixel, bottom centre at (x, y). */
function blit(ctx: CanvasRenderingContext2D, img: HTMLCanvasElement, x: number, y: number, cell: number) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, snap(x - (img.width * cell) / 2, 2), snap(y - img.height * cell, 2), img.width * cell, img.height * cell);
  ctx.restore();
}

/** A box with its corners notched by `n`. */
function pixelBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, n: number) {
  ctx.fillRect(x + n, y, w - 2 * n, h);
  ctx.fillRect(x, y + n, w, h - 2 * n);
}

/** A row of 3 glass gates across the road, one answer in each. */
export function drawGate(ctx: CanvasRenderingContext2D, gate: GateLook, d: number, t: number) {
  const p = scaleAt(d), y = snap(yAt(d), 2);
  const w = snap(LANE * p * 0.9, 2), h = snap(104 * p, 2);
  const px = Math.max(2, snap(3 * p, 2));
  gate.choices.forEach((choice, lane) => {
    const x = snap(laneX(lane, d) - w / 2, 2);
    const chosen = gate.hit?.lane === lane;
    const right = gate.hit && lane === gate.answer;
    const glow = chosen ? (gate.hit!.ok ? GAME_COLORS.good : GAME_COLORS.bad) : right ? GAME_COLORS.good : GAME_COLORS.violetLight;
    const panel = snap(h * 0.78, 2);

    // posts
    ctx.fillStyle = glow;
    ctx.fillRect(x, y - h, px, h);
    ctx.fillRect(x + w - px, y - h, px, h);
    // a pulsing one-pixel glow, then the frame and the glass
    if (!gate.hit && Math.sin(t * 6) > 0) {
      ctx.globalAlpha = 0.3;
      pixelBox(ctx, x - px, y - h - px, w + 2 * px, panel + 2 * px, px);
    }
    ctx.globalAlpha = 1;
    pixelBox(ctx, x, y - h, w, panel, px);
    ctx.globalAlpha = gate.hit ? (chosen || right ? 0.75 : 0.3) : 0.92;
    ctx.fillStyle = chosen && !gate.hit!.ok ? "#4a1030" : right ? "#0f3d33" : "#2a1a6e";
    ctx.fillRect(x + px, y - h + px, w - 2 * px, panel - 2 * px);
    ctx.globalAlpha = 1;
    // glass glint
    ctx.fillStyle = "rgb(246 243 255 / 0.25)";
    ctx.fillRect(x + 2 * px, y - h + 2 * px, px * 3, px);

    // the answer, scaled to fit its panel
    const m = measureAnswer(ctx, choice);
    const s = Math.min((w * 0.86) / m.w, (h * 0.66) / m.h, 1.6 * p);
    ctx.save();
    ctx.translate(x + w / 2, y - h + panel / 2);
    ctx.scale(s, s);
    drawAnswer(ctx, choice);
    ctx.restore();
  });
}

/** Hero from behind: hair, gold headband, violet suit with a gold star, magenta cape; two stride frames. */
const HERO_TOP = [
  ".....hhhh.....", "....hhhhhh....", "...fhhhhhhf...", "...fyyyyyyf...", "....hhhhhh....",
  ".....ffff.....", "..cssssssssc..", ".ccsssssssscc.", "fccssssssssccf", "fccsssyysssccf",
  "fccssyyyyssccf", ".ccsssyyssscc.", ".ccsssssssscc.", "..cccccccccc..", "...llllllll...",
  "...llllllll...",
];
const HERO = [
  [...HERO_TOP, "...ll....ll...", "...ll....ll...", "...bb....bb..."],
  [...HERO_TOP, "....ll..ll....", "....bb..ll....", ".........bb..."],
];
const HERO_COLORS: Palette = { h: "#2b1a10", f: "#f1c7a0", y: GAME_COLORS.gold, s: GAME_COLORS.violet, c: GAME_COLORS.magenta, l: "#4b3a8f", b: "#f6f3ff" };
const HERO_HURT: Palette = { ...HERO_COLORS, s: GAME_COLORS.bad };

/** The hero seen from behind, running: size from power; legs swap with the stride. */
export function drawHero(ctx: CanvasRenderingContext2D, x: number, y: number, k: number, t: number, power: number, opts: { strong: boolean; hurt: number }) {
  const cell = Math.max(2, Math.round(4 * k));
  // shadow, and a blinking gold frame when strong
  ctx.fillStyle = "rgb(0 0 0 / 0.35)";
  ctx.fillRect(snap(x - 22 * k, 2), snap(y - 4, 2), snap(44 * k, 2), cell);
  if (opts.strong && Math.sin(t * 8) > -0.3) {
    ctx.fillStyle = GAME_COLORS.gold;
    const w = snap(64 * k, 2);
    ctx.fillRect(snap(x - w / 2, 2), snap(y + cell, 2), w, 2);
    ctx.fillRect(snap(x - w / 2, 2), snap(y - 10, 2), 2, 12);
    ctx.fillRect(snap(x + w / 2 - 2, 2), snap(y - 10, 2), 2, 12);
  }
  const img = sprite(HERO[Math.sin(t * 15) > 0 ? 0 : 1], opts.hurt > 0 ? HERO_HURT : HERO_COLORS);
  blit(ctx, img, x, y, cell);

  // power plate above the head, not scaled with the hero
  const top = y - img.height * cell;
  plate(ctx, x, top - 14, `${power}`, opts.strong ? GAME_COLORS.gold : GAME_COLORS.violetLight, opts.strong ? "#2a1600" : "#fff", "lightning");
}

/** Boss: gold horns, magenta body, white eyes with red pupils and a toothy mouth (wider when laughing). */
const BOSS_TOP = [
  ".y................y.", ".yy..............yy.", "..yy............yy..", "...yy..kkkkkk..yy...", "....ykkmmmmmmkky....",
  "....kmmmmmmmmmmk....", "...kmmmmmmmmmmmmk...", "..kmmwwwmmmmwwwmmk..", "..kmmwrwmmmmwrwmmk..", "..kmmwwwmmmmwwwmmk..",
  ".kmmmmmmmmmmmmmmmmk.", "kmmkmmmmmmmmmmmmkmmk", "kmmkmmddddddddmmkmmk", ".kk.kmdwdwdwdwmk.kk.",
];
const BOSS = {
  calm: [...BOSS_TOP, "....kmmddddddmmk....", "....kmmmmmmmmmmk....", "....kmmk....kmmk....", "....kkkk....kkkk...."],
  laugh: [...BOSS_TOP, "....kmddddddddmk....", "....kmmddddddmmk....", "....kmmk....kmmk....", "....kkkk....kkkk...."],
};
const BOSS_COLORS: Palette = { k: "#2a0420", m: "#c21a8f", y: GAME_COLORS.gold, w: "#f6f3ff", r: GAME_COLORS.bad, d: "#4a0a36" };

/** The boss at the end of the road, with its power above. */
export function drawBoss(ctx: CanvasRenderingContext2D, d: number, t: number, power: number, opts: { fall: number; shake: number; laugh: boolean }) {
  const p = scaleAt(d), y = yAt(d);
  const k = p * 3.2;
  const cell = Math.max(1, Math.round(6.5 * k));
  const img = sprite(opts.laugh && Math.sin(t * 12) > 0 ? BOSS.laugh : BOSS.calm, BOSS_COLORS);
  const bob = Math.sin(t * 3) > 0 ? cell : 0;
  const x = laneX(1, d) + Math.sin(t * 50) * opts.shake * 6;
  ctx.fillStyle = "rgb(0 0 0 / 0.35)";
  ctx.fillRect(snap(x - 40 * k, 2), snap(y - 4 * k, 2), snap(80 * k, 2), Math.max(2, cell));
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(opts.fall * 1.2);
  ctx.globalAlpha = 1 - opts.fall * 0.8;
  blit(ctx, img, 0, -bob, cell);
  ctx.restore();

  if (opts.fall < 0.5) plate(ctx, laneX(1, d), y - img.height * cell - 14, `${power}`, GAME_COLORS.bad, "#fff", "ogre");
}

/** A notched label; `icon` goes before the text on a dark square so it reads on any colour. */
function plate(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, bg: string, fg: string, icon?: PixelIconName) {
  ctx.font = gameFont(800, 14);
  const iconW = icon ? 20 : 0;
  const w = snap(ctx.measureText(text).width + 18 + iconW, 2);
  const left = snap(x - w / 2, 2), top = snap(y - 12, 2);
  ctx.fillStyle = bg;
  pixelBox(ctx, left, top, w, 24, 2);
  if (icon) {
    ctx.fillStyle = GAME_COLORS.night;
    ctx.fillRect(left + 4, top + 4, 16, 16);
    drawPixelIcon(ctx, icon, left + 6, top + 6, 12, fg);
  }
  ctx.fillStyle = fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + iconW / 2, y + 1);
}
