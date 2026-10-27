import { roundRect, type Stage } from "../../_lib/canvas";
import { GAME_COLORS } from "../../_lib/palette";
import { drawAnswer } from "../../_lib/shapes";
import { WORLD, type Food } from "./types";

/** Dark hexagon floor with a vignette, drawn once per resize. */
export function buildFloor(stage: Stage): HTMLCanvasElement {
  const { w: W, h: H } = WORLD;
  const floor = document.createElement("canvas");
  floor.width = Math.round(W * stage.scale * stage.dpr);
  floor.height = Math.round(H * stage.scale * stage.dpr);
  const f = floor.getContext("2d");
  if (!f) return floor;
  f.setTransform(stage.dpr * stage.scale, 0, 0, stage.dpr * stage.scale, 0, 0);
  f.fillStyle = "#0b0820";
  f.fillRect(0, 0, W, H);
  const R = 15, hw = Math.sqrt(3) * R;
  for (let row = -1; row * R * 1.5 < H + R; row++) {
    for (let col = -1; col * hw < W + hw; col++) {
      const cx = col * hw + (row % 2 ? hw / 2 : 0), cy = row * R * 1.5;
      f.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = Math.PI / 6 + (i * Math.PI) / 3;
        f.lineTo(cx + Math.cos(a) * (R - 1.6), cy + Math.sin(a) * (R - 1.6));
      }
      f.closePath();
      const g = f.createLinearGradient(cx, cy - R, cx, cy + R);
      g.addColorStop(0, "#221a48");
      g.addColorStop(1, "#16112f");
      f.fillStyle = g;
      f.fill();
    }
  }
  const v = f.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.75);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,.55)");
  f.fillStyle = v;
  f.fillRect(0, 0, W, H);
  return floor;
}

type Orb = { x: number; y: number; r: number; color: string; phase: number; vx: number; vy: number };
const ORB_COLORS = ["#ff4d6d", "#ffcf5a", "#8b5cff", "#e30ba6", "#38bdf8"];

/** Small glowing lights drifting over the floor. */
export function makeOrbs(): Orb[] {
  return Array.from({ length: 22 }, (_, i) => ({
    x: Math.random() * WORLD.w, y: Math.random() * WORLD.h, r: 1.5 + Math.random() * 2.5,
    color: ORB_COLORS[i % ORB_COLORS.length], phase: Math.random() * 6,
    vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8,
  }));
}

export function moveOrbs(orbs: Orb[], dt: number) {
  for (const o of orbs) {
    o.x = (o.x + o.vx * dt + WORLD.w) % WORLD.w;
    o.y = (o.y + o.vy * dt + WORLD.h) % WORLD.h;
  }
}

export function drawLights(ctx: CanvasRenderingContext2D, orbs: Orb[], tint: [string, string], time: number) {
  const { w: W, h: H } = WORLD;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  tint.forEach((c, i) => {
    const x = W / 2 + Math.sin(time * 0.25 + i * 2) * W * 0.35, y = H * 0.5 + Math.cos(time * 0.2 + i * 2) * H * 0.3;
    const g = ctx.createRadialGradient(x, y, 0, x, y, 200);
    g.addColorStop(0, c + "1f");
    g.addColorStop(1, c + "00");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  });
  for (const o of orbs) {
    const s = o.r * 6 * (0.75 + 0.25 * Math.sin(time * 2 + o.phase));
    const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, s);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.15, o.color);
    g.addColorStop(1, o.color + "00");
    ctx.globalAlpha = 0.55 + 0.35 * Math.sin(time * 1.5 + o.phase);
    ctx.fillStyle = g;
    ctx.fillRect(o.x - s, o.y - s, s * 2, s * 2);
  }
  ctx.restore();
}

/** An answer pill: all look the same, so the player has to think. */
export function drawFood(ctx: CanvasRenderingContext2D, f: Food, time: number, still: boolean) {
  const born = Math.min(1, Math.max(0, (time - f.born) / 0.35));
  if (!born) return;
  const die = f.dying ? Math.min(1, f.dying / 0.3) : 0;
  const s = (0.5 + 0.5 * born) * (1 + f.near * 0.12) * (1 + die * 0.6);
  const bob = still ? 0 : Math.sin(time * 2.2 + f.x * 0.05) * 2.5;
  const hot = f.near > 0.3;
  ctx.save();
  ctx.globalAlpha = 1 - die;
  ctx.translate(f.x, f.y + bob);
  ctx.scale(s, s);
  ctx.shadowColor = hot ? "rgba(255,207,90,.6)" : "rgba(139,92,255,.5)";
  ctx.shadowBlur = 10 + f.near * 14;
  const g = ctx.createLinearGradient(0, -f.h / 2, 0, f.h / 2);
  g.addColorStop(0, "#2d2270");
  g.addColorStop(1, "#1c1550");
  roundRect(ctx, -f.w / 2, -f.h / 2, f.w, f.h, Math.min(18, f.h / 2));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = 2;
  ctx.strokeStyle = hot ? GAME_COLORS.gold : "rgba(139,92,255,.75)";
  ctx.stroke();
  drawAnswer(ctx, f.answer);
  ctx.restore();
}
