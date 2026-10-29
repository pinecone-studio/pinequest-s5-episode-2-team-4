import type { GameAnswer } from "@/lib/types";
import type { PixelIconName } from "@/components/ui/PixelIcon";
import { drawPixelIcon, roundRect } from "../../_lib/canvas";
import { GAME_COLORS, gameFont } from "../../_lib/palette";
import { drawAnswer, measureAnswer } from "../../_lib/shapes";
import { LANE, laneX, scaleAt, yAt } from "./world";

export type GateLook = {
  choices: GameAnswer[];
  answer: number;
  /** Set once the hero ran through: which lane, and whether it was right. */
  hit?: { lane: number; ok: boolean };
};

/** A row of 3 glass gates across the road, one answer in each. */
export function drawGate(ctx: CanvasRenderingContext2D, gate: GateLook, d: number, t: number) {
  const p = scaleAt(d), y = yAt(d);
  const w = LANE * p * 0.9, h = 104 * p;
  gate.choices.forEach((choice, lane) => {
    const x = laneX(lane, d) - w / 2;
    const chosen = gate.hit?.lane === lane;
    const right = gate.hit && lane === gate.answer;
    const glow = chosen ? (gate.hit!.ok ? GAME_COLORS.good : GAME_COLORS.bad) : right ? GAME_COLORS.good : GAME_COLORS.violetLight;

    // posts
    ctx.fillStyle = glow;
    ctx.fillRect(x, y - h, 3 * p, h);
    ctx.fillRect(x + w - 3 * p, y - h, 3 * p, h);
    // glass panel
    ctx.globalAlpha = gate.hit ? (chosen || right ? 0.55 : 0.15) : 0.82;
    ctx.fillStyle = chosen && !gate.hit!.ok ? "#4a1030" : right ? "#0f3d33" : "#2a1a6e";
    roundRect(ctx, x, y - h, w, h * 0.78, 6 * p);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = glow;
    ctx.lineWidth = 2 * p;
    ctx.shadowColor = glow;
    ctx.shadowBlur = gate.hit ? 0 : 6 + 4 * Math.sin(t * 6);
    roundRect(ctx, x, y - h, w, h * 0.78, 6 * p);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // the answer, scaled to fit its panel
    const m = measureAnswer(ctx, choice);
    const s = Math.min((w * 0.92) / m.w, (h * 0.7) / m.h, 1.6 * p);
    ctx.save();
    ctx.translate(x + w / 2, y - h + h * 0.39);
    ctx.scale(s, s);
    drawAnswer(ctx, choice);
    ctx.restore();
  });
}

/** The hero seen from behind, running: size from power; legs and arms swing with the stride. */
export function drawHero(ctx: CanvasRenderingContext2D, x: number, y: number, k: number, t: number, power: number, opts: { strong: boolean; hurt: number }) {
  const stride = Math.sin(t * 15);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);

  // shadow and aura
  ctx.fillStyle = "rgb(0 0 0 / 0.35)";
  ctx.beginPath();
  ctx.ellipse(0, 0, 22, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  if (opts.strong) {
    ctx.strokeStyle = GAME_COLORS.gold;
    ctx.globalAlpha = 0.55 + 0.25 * Math.sin(t * 8);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, 30, 9, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // legs
  ctx.strokeStyle = "#1d1647";
  ctx.lineCap = "round";
  ctx.lineWidth = 9;
  for (const s of [1, -1]) {
    ctx.beginPath();
    ctx.moveTo(s * 6, -30);
    ctx.lineTo(s * 6 + stride * s * 7, -4);
    ctx.stroke();
  }
  // body with a cape
  ctx.fillStyle = GAME_COLORS.magenta;
  ctx.beginPath();
  ctx.moveTo(-14, -58);
  ctx.quadraticCurveTo(-22 - stride * 3, -34, -16, -20);
  ctx.lineTo(16, -20);
  ctx.quadraticCurveTo(22 + stride * 3, -34, 14, -58);
  ctx.fill();
  const suit = ctx.createLinearGradient(0, -62, 0, -26);
  suit.addColorStop(0, GAME_COLORS.violetLight);
  suit.addColorStop(1, GAME_COLORS.violet);
  ctx.fillStyle = opts.hurt > 0 ? GAME_COLORS.bad : suit;
  roundRect(ctx, -13, -62, 26, 36, 9);
  ctx.fill();
  // star on the chest
  ctx.fillStyle = GAME_COLORS.gold;
  ctx.font = gameFont(800, 12);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("★", 0, -46);
  // arms
  ctx.strokeStyle = "#f1c7a0";
  ctx.lineWidth = 6;
  for (const s of [1, -1]) {
    ctx.beginPath();
    ctx.moveTo(s * 12, -56);
    ctx.lineTo(s * 17, -38 - stride * s * 6);
    ctx.stroke();
  }
  // head from behind: ears, then hair over the back of the head
  ctx.fillStyle = "#f1c7a0";
  for (const s of [1, -1]) {
    ctx.beginPath();
    ctx.ellipse(s * 12, -72, 3.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#2b1a10";
  ctx.beginPath();
  ctx.arc(0, -74, 12.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = GAME_COLORS.gold;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-12, -76);
  ctx.lineTo(12, -76);
  ctx.stroke();
  ctx.restore();

  // power pill above the head, not scaled with the hero
  const top = y - 92 * k;
  pill(ctx, x, top - 12, `${power}`, opts.strong ? GAME_COLORS.gold : GAME_COLORS.violetLight, opts.strong ? "#2a1600" : "#fff", "lightning");
}

/** The boss at the end of the road, with its power above. */
export function drawBoss(ctx: CanvasRenderingContext2D, d: number, t: number, power: number, opts: { fall: number; shake: number; laugh: boolean }) {
  const p = scaleAt(d), y = yAt(d);
  const k = p * 3.2;
  const wob = Math.sin(t * 3) * 3;
  ctx.save();
  ctx.translate(laneX(1, d) + Math.sin(t * 50) * opts.shake * 6, y);
  ctx.rotate(opts.fall * 1.2);
  ctx.globalAlpha = 1 - opts.fall * 0.8;
  ctx.scale(k, k);

  ctx.fillStyle = "rgb(0 0 0 / 0.35)";
  ctx.beginPath();
  ctx.ellipse(0, 0, 40, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // horns
  ctx.fillStyle = GAME_COLORS.gold;
  for (const s of [1, -1]) {
    ctx.beginPath();
    ctx.moveTo(s * 18, -78 + wob);
    ctx.quadraticCurveTo(s * 40, -100 + wob, s * 34, -118 + wob);
    ctx.quadraticCurveTo(s * 30, -96 + wob, s * 8, -84 + wob);
    ctx.fill();
  }
  // body
  const body = ctx.createRadialGradient(0, -60, 8, 0, -45, 60);
  body.addColorStop(0, "#ff5cc8");
  body.addColorStop(1, "#7a0a5c");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-42, 0);
  ctx.quadraticCurveTo(-52, -60 + wob, -24, -88 + wob);
  ctx.quadraticCurveTo(0, -100 + wob, 24, -88 + wob);
  ctx.quadraticCurveTo(52, -60 + wob, 42, 0);
  ctx.closePath();
  ctx.fill();
  // arms
  ctx.strokeStyle = "#7a0a5c";
  ctx.lineWidth = 12;
  ctx.lineCap = "round";
  for (const s of [1, -1]) {
    ctx.beginPath();
    ctx.moveTo(s * 38, -48 + wob);
    ctx.lineTo(s * 56, -26 + Math.sin(t * 4 + s) * 6);
    ctx.stroke();
  }
  // eyes and mouth
  for (const s of [1, -1]) {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(s * 13, -62 + wob, 9, 7, s * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = GAME_COLORS.bad;
    ctx.beginPath();
    ctx.arc(s * 12, -61 + wob, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#2a0420";
  ctx.beginPath();
  ctx.ellipse(0, -36 + wob, 18, opts.laugh ? 12 + Math.abs(Math.sin(t * 12)) * 4 : 8, 0, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = "#fff";
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 7 - 3, -36 + wob);
    ctx.lineTo(i * 7, -30 + wob);
    ctx.lineTo(i * 7 + 3, -36 + wob);
    ctx.fill();
  }
  ctx.restore();

  if (opts.fall < 0.5) pill(ctx, laneX(1, d), y - 128 * k - 10, `${power}`, GAME_COLORS.bad, "#fff", "ogre");
}

/** A rounded label; `icon` goes before the text on a dark dot so it reads on any colour. */
function pill(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, bg: string, fg: string, icon?: PixelIconName) {
  ctx.font = gameFont(800, 14);
  const iconW = icon ? 20 : 0;
  const w = ctx.measureText(text).width + 18 + iconW;
  ctx.fillStyle = bg;
  roundRect(ctx, x - w / 2, y - 11, w, 22, 11);
  ctx.fill();
  if (icon) {
    const cx = x - w / 2 + 14;
    ctx.fillStyle = GAME_COLORS.night;
    ctx.beginPath();
    ctx.arc(cx, y, 9, 0, Math.PI * 2);
    ctx.fill();
    drawPixelIcon(ctx, icon, cx - 6, y - 6, 12, fg);
  }
  ctx.fillStyle = fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + iconW / 2, y + 1);
}
