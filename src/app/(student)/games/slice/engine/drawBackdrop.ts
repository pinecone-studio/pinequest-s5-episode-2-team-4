import type { Stage } from "../../_lib/canvas";
import { WORLD } from "./types";

const { w: W, h: H } = WORLD;

function hill(x: CanvasRenderingContext2D, base: number, amp: number, color: string, phase: number) {
  x.fillStyle = color;
  x.beginPath();
  x.moveTo(0, H);
  for (let px = 0; px <= W; px += 4) x.lineTo(px, base + Math.sin(px * 0.012 + phase) * amp + Math.sin(px * 0.031 + phase * 2) * amp * 0.35);
  x.lineTo(W, H);
  x.fill();
}

/** Two horse riders as silhouettes on the ridge. */
function riders(x: CanvasRenderingContext2D) {
  x.fillStyle = "#2a0f40";
  for (const [hx, hy] of [[300, 424], [328, 427]]) {
    x.beginPath();
    x.ellipse(hx, hy, 9, 4, 0, 0, 7);
    x.fill();
    x.fillRect(hx - 7, hy, 2, 7);
    x.fillRect(hx + 5, hy, 2, 7);
    x.beginPath();
    for (const [dx, dy] of [[7, -2], [13, -8], [14, -5], [9, 1]]) x.lineTo(hx + dx, hy + dy);
    x.fill();
    x.fillRect(hx - 2, hy - 10, 3, 7);
    x.beginPath();
    x.arc(hx - 0.5, hy - 12, 2.2, 0, 7);
    x.fill();
  }
}

/** Gold meander (алхан хээ) band along the bottom. */
function meander(x: CanvasRenderingContext2D) {
  x.fillStyle = "#1a0630";
  x.fillRect(0, H - 22, W, 22);
  x.strokeStyle = x.fillStyle = "rgba(255,207,90,.55)";
  x.lineWidth = 2;
  x.beginPath();
  for (let px = 0; px < W; px += 16) {
    const y0 = H - 18, y1 = H - 4;
    for (const [dx, y] of [[0, y1], [0, y0], [12, y0], [12, y1 - 5], [5, y1 - 5], [5, y0 + 5]] as const) {
      if (dx === 0 && y === y1) x.moveTo(px, y);
      else x.lineTo(px + dx, y);
    }
  }
  x.stroke();
  x.fillRect(0, H - 22, W, 1.5);
}

/** Dusk over the steppe, drawn once per resize: sky, setting sun, hills, riders and the meander band. */
export function buildDusk(stage: Stage): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = Math.round(W * stage.scale * stage.dpr);
  c.height = Math.round(H * stage.scale * stage.dpr);
  const x = c.getContext("2d");
  if (!x || !c.width || !c.height) return c;
  x.setTransform(stage.scale * stage.dpr, 0, 0, stage.scale * stage.dpr, 0, 0);
  const sky = x.createLinearGradient(0, 0, 0, H);
  for (const [at, color] of [[0, "#120830"], [0.45, "#3b1468"], [0.72, "#a3306f"], [0.86, "#f08a4b"], [1, "#f6b26b"]] as const) sky.addColorStop(at, color);
  x.fillStyle = sky;
  x.fillRect(0, 0, W, H);
  x.fillStyle = "#fff";
  for (let i = 0; i < 70; i++) {
    x.globalAlpha = (1 - i / 70) * 0.8;
    x.beginPath();
    x.arc(Math.random() * W, Math.random() * H * 0.4, Math.random() * 1.1 + 0.2, 0, 7);
    x.fill();
  }
  x.globalAlpha = 1;
  const glow = x.createRadialGradient(W * 0.32, 400, 0, W * 0.32, 400, 120);
  glow.addColorStop(0, "rgba(255,220,150,.7)");
  glow.addColorStop(1, "rgba(255,200,120,0)");
  x.fillStyle = glow;
  x.fillRect(0, 250, W, 250);
  x.fillStyle = "#ffd9a0";
  x.beginPath();
  x.arc(W * 0.32, 405, 30, Math.PI, 0);
  x.fill();
  hill(x, 405, 12, "#5a2470", 1);
  hill(x, 430, 9, "#3a1655", 2.5);
  riders(x);
  hill(x, 452, 6, "#24093a", 4);
  meander(x);
  return c;
}

/** Warm specks drifting over the field (skipped when motion is reduced). */
export function drawFireflies(ctx: CanvasRenderingContext2D, time: number) {
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 16; i++) {
    const px = (i * 83.1 + time * 8 * (1 + (i % 3))) % W, py = 120 + ((i * 61.7) % 280) + Math.sin(time + i) * 8;
    ctx.fillStyle = `rgba(255,214,150,${0.25 + 0.25 * Math.sin(time * 2 + i)})`;
    ctx.beginPath();
    ctx.arc(px, py, 1.6, 0, 7);
    ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";
}
