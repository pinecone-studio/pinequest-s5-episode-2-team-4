import { GAME_COLORS } from "../../_lib/palette";
import { drawFace } from "./drawFace";
import { SNAKE_RADIUS as RADIUS, type Point, type Snake, type SnakeLook } from "./types";

/** Distance between body beads along the head's trail. */
export const SPACING = 4.2;

/** Bead centres from the head back, SPACING apart along the trail. */
export function bodyPoints(snake: Snake): Point[] {
  const pts: Point[] = [{ x: snake.x, y: snake.y }];
  let walked = 0, next = SPACING;
  for (let i = 1; i < snake.trail.length && pts.length < snake.length; i++) {
    const a = snake.trail[i - 1], b = snake.trail[i];
    walked += Math.hypot(b.x - a.x, b.y - a.y);
    if (walked >= next) {
      pts.push(b);
      next += SPACING;
    }
  }
  return pts;
}

// Highlight and rim-shadow gradients per bead size, built once and reused.
const shadeCache = new Map<number, { hi: CanvasGradient; lo: CanvasGradient }>();
export const clearShadeCache = () => shadeCache.clear();

function shade(ctx: CanvasRenderingContext2D, r: number) {
  const key = Math.round(r * 2);
  let s = shadeCache.get(key);
  if (!s) {
    const hi = ctx.createRadialGradient(-r * 0.35, -r * 0.42, 0, -r * 0.35, -r * 0.42, r * 0.95);
    hi.addColorStop(0, "rgba(255,255,255,.75)");
    hi.addColorStop(0.25, "rgba(255,255,255,.28)");
    hi.addColorStop(1, "rgba(255,255,255,0)");
    const lo = ctx.createRadialGradient(r * 0.1, r * 0.15, r * 0.35, 0, 0, r * 1.02);
    lo.addColorStop(0, "rgba(0,0,0,0)");
    lo.addColorStop(0.75, "rgba(0,0,0,.18)");
    lo.addColorStop(1, "rgba(0,0,0,.55)");
    s = { hi, lo };
    shadeCache.set(key, s);
  }
  return s;
}

/** A glossy ball: flat colour, darker rim, light from the top left. */
function bead(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  const s = shade(ctx, r);
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.fillStyle = s.lo;
  ctx.fill();
  ctx.fillStyle = s.hi;
  ctx.fill();
  ctx.restore();
}

export function drawSnake(ctx: CanvasRenderingContext2D, snake: Snake, look: SnakeLook) {
  const pts = bodyPoints(snake), n = pts.length, flashRed = look.hurt && Math.floor(look.time * 10) % 2 === 1;
  const radiusAt = (i: number) => {
    const tail = n - 1 - i;
    return tail < 8 ? RADIUS * (0.45 + (0.55 * tail) / 8) : RADIUS;
  };
  ctx.save();
  ctx.lineCap = ctx.lineJoin = "round";
  ctx.lineWidth = RADIUS * 2;
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x + 4, p.y + 7) : ctx.moveTo(p.x + 4, p.y + 7)));
  ctx.strokeStyle = "rgba(0,0,0,.35)";
  ctx.stroke();
  if (look.glow) {
    ctx.globalCompositeOperation = "lighter";
    ctx.shadowColor = look.glow;
    ctx.shadowBlur = 26;
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.strokeStyle = "rgba(255,255,255,.08)";
    ctx.stroke();
  }
  ctx.restore();
  const { bands } = look.skin;
  for (let i = n - 1; i >= 1; i--) {
    bead(ctx, pts[i].x, pts[i].y, radiusAt(i), flashRed ? GAME_COLORS.bad : bands[Math.floor(i / 3) % bands.length]);
    if (look.skin.sparkle && i % 6 === 2) {
      ctx.fillStyle = "rgba(255,255,255,.9)";
      ctx.beginPath();
      ctx.arc(pts[i].x + Math.sin(i) * 4, pts[i].y + Math.cos(i) * 4, 0.8 + 0.7 * Math.abs(Math.sin(look.time * 3 + i)), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  bead(ctx, snake.x, snake.y, RADIUS + 1.5, flashRed ? GAME_COLORS.bad : bands[0]);
  drawFace(ctx, snake, look);
}
