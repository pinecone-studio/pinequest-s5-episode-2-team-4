import type { Stage } from "../../_lib/canvas";
import { GROUND, WORLD } from "./types";

const { w: W, h: H } = WORLD;

/** Pre-rendered backdrop: a still sky and two hill strips, twice as wide so they scroll seamlessly. */
export type Backdrop = { sky: HTMLCanvasElement; far: HTMLCanvasElement; near: HTMLCanvasElement };

function layer(stage: Stage, width: number, draw: (x: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = Math.round(width * stage.scale * stage.dpr);
  c.height = Math.round(H * stage.scale * stage.dpr);
  const x = c.getContext("2d");
  if (x && c.width && c.height) {
    x.setTransform(stage.scale * stage.dpr, 0, 0, stage.scale * stage.dpr, 0, 0);
    draw(x);
  }
  return c;
}

/** Sum of sines that repeats every W, so a hill line tiles. */
const wave = (x: number, parts: [number, number, number][]) =>
  parts.reduce((s, [n, a, ph]) => s + Math.sin((x / W) * Math.PI * 2 * n + ph) * a, 0);

function drawSky(s: CanvasRenderingContext2D) {
  const g = s.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#0b0626");
  g.addColorStop(0.55, "#251050");
  g.addColorStop(0.85, "#4a1665");
  g.addColorStop(1, "#5b1a6e");
  s.fillStyle = g;
  s.fillRect(0, 0, W, H);
  s.fillStyle = "#fff";
  for (let i = 0; i < 120; i++) {
    s.globalAlpha = 0.3 + Math.random() * 0.7;
    s.beginPath();
    s.arc(Math.random() * W, Math.random() * H * 0.7, Math.random() * 1.2 + 0.2, 0, 7);
    s.fill();
  }
  s.globalAlpha = 1;
  const mx = W * 0.78, my = 150, glow = s.createRadialGradient(mx, my, 0, mx, my, 70);
  glow.addColorStop(0, "rgba(255,236,190,.45)");
  glow.addColorStop(1, "rgba(255,236,190,0)");
  s.fillStyle = glow;
  s.fillRect(mx - 70, my - 70, 140, 140);
  s.fillStyle = "#fff4d6";
  s.beginPath();
  s.arc(mx, my, 17, 0, 7);
  s.fill();
  s.fillStyle = "rgba(200,180,140,.35)";
  for (const [a, b, r] of [[-5, -4, 4], [6, 3, 3], [-2, 7, 2.2]]) {
    s.beginPath();
    s.arc(mx + a, my + b, r, 0, 7);
    s.fill();
  }
}

function drawFarHills(x: CanvasRenderingContext2D) {
  const g = x.createLinearGradient(0, 250, 0, 400);
  g.addColorStop(0, "#5a3a9a");
  g.addColorStop(0.35, "#3a1d74");
  g.addColorStop(1, "#2b1356");
  x.fillStyle = g;
  x.beginPath();
  x.moveTo(0, H);
  for (let px = 0; px <= W * 2; px += 4) x.lineTo(px, 330 + wave(px, [[1, 26, 0], [3, 14, 1], [7, 6, 2], [13, 3, 0.5]]) - Math.max(0, wave(px, [[2, 40, 2.2]])));
  x.lineTo(W * 2, H);
  x.fill();
}

/** Near hills with gers whose doors are lit. */
function drawNearHills(x: CanvasRenderingContext2D) {
  const base = (px: number) => 392 + wave(px, [[2, 10, 1], [5, 5, 0], [9, 2, 3]]);
  x.fillStyle = "#1c0b3b";
  x.beginPath();
  x.moveTo(0, H);
  for (let px = 0; px <= W * 2; px += 4) x.lineTo(px, base(px));
  x.lineTo(W * 2, H);
  x.fill();
  for (const px of [70, 230, 330].flatMap((gx) => [gx, gx + W])) {
    const y = base(px) + 2, r = 14;
    x.fillStyle = "#e9e2ff";
    x.beginPath();
    x.moveTo(px - r, y);
    x.lineTo(px - r, y - 9);
    x.quadraticCurveTo(px, y - 22, px + r, y - 9);
    x.lineTo(px + r, y);
    x.fill();
    x.fillStyle = "#b7a8ea";
    x.fillRect(px - r, y - 9, r * 2, 2.5);
    x.fillStyle = "#ffcf5a";
    x.fillRect(px - 3, y - 8, 6, 8);
    x.fillStyle = "rgba(255,207,90,.25)";
    x.beginPath();
    x.ellipse(px, y + 2, 12, 3, 0, 0, 7);
    x.fill();
  }
}

export function buildBackdrop(stage: Stage): Backdrop {
  return { sky: layer(stage, W, drawSky), far: layer(stage, W * 2, drawFarHills), near: layer(stage, W * 2, drawNearHills) };
}

/** A layer is empty while the canvas has no size; drawImage throws on that. */
const ready = (c: HTMLCanvasElement) => c.width > 0 && c.height > 0;

/** Sky, twinkling stars, the aurora (unless `still`) and both hill strips at their parallax offsets. */
export function drawBackdrop(ctx: CanvasRenderingContext2D, b: Backdrop, scroll: number, time: number, still: boolean) {
  if (ready(b.sky)) ctx.drawImage(b.sky, 0, 0, W, H);
  for (let i = 0; i < 14; i++) {
    const tw = 0.5 + 0.5 * Math.sin(time * 2 + i * 1.7);
    ctx.fillStyle = `rgba(255,255,255,${tw * 0.8})`;
    ctx.beginPath();
    ctx.arc((i * 97.3) % W, 30 + ((i * 53.7) % 220), 0.8 + tw, 0, 7);
    ctx.fill();
  }
  if (!still) drawAurora(ctx, time);
  if (ready(b.far)) ctx.drawImage(b.far, -((scroll * 0.15) % W), 0, W * 2, H);
  if (ready(b.near)) ctx.drawImage(b.near, -((scroll * 0.4) % W), 0, W * 2, H);
}

function drawAurora(ctx: CanvasRenderingContext2D, time: number) {
  ctx.globalCompositeOperation = "lighter";
  for (const [rgb, yb, ph, al] of [["52,211,153", 175, 0, 0.16], ["139,92,255", 205, 2, 0.2]] as const) {
    for (let x = 0; x <= W; x += 6) {
      const y = yb + Math.sin(x * 0.012 + time * 0.35 + ph) * 26 + Math.sin(x * 0.031 + time * 0.6) * 8;
      const h = 60 + Math.sin(x * 0.02 + time * 0.5 + ph) * 22, g = ctx.createLinearGradient(0, y - h, 0, y);
      g.addColorStop(0, `rgba(${rgb},0)`);
      g.addColorStop(0.8, `rgba(${rgb},${al})`);
      g.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(x, y - h, 6.5, h);
    }
  }
  ctx.globalCompositeOperation = "source-over";
}

/** Grass strip with tufts and dashes that scroll with the gates. */
export function drawGround(ctx: CanvasRenderingContext2D, scroll: number) {
  const g = ctx.createLinearGradient(0, GROUND, 0, H);
  g.addColorStop(0, "#2a1260");
  g.addColorStop(1, "#140832");
  ctx.fillStyle = g;
  ctx.fillRect(0, GROUND, W, H - GROUND);
  ctx.fillStyle = "#3d1b85";
  ctx.fillRect(0, GROUND, W, 3);
  ctx.fillStyle = "#4b23a3";
  for (let x = -(scroll % 18); x < W + 18; x += 18) {
    ctx.beginPath();
    ctx.moveTo(x, GROUND);
    ctx.lineTo(x + 4, GROUND - 6);
    ctx.lineTo(x + 7, GROUND);
    ctx.fill();
  }
  ctx.fillStyle = "rgba(255,255,255,.06)";
  for (let x = -(scroll % 46); x < W + 46; x += 46) ctx.fillRect(x, GROUND + 14, 22, 3);
}
