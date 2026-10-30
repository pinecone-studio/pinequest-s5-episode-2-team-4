import { darken } from "../../_lib/color";
import { GAME_COLORS } from "../../_lib/palette";
import { PIXEL as P, pixelDisc, snap } from "../../_lib/pixel";
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

type Bead = { x: number; y: number; r: number; color: string };

/**
 * Pixel balls: every darker rim first, then every colour inside, so the body
 * reads as one outlined snake; one light pixel at the top left of each.
 */
function drawBeads(ctx: CanvasRenderingContext2D, beads: Bead[]) {
  for (const b of beads) {
    ctx.fillStyle = darken(b.color, 0.45);
    pixelDisc(ctx, b.x, b.y, b.r);
  }
  for (const b of beads) {
    ctx.fillStyle = b.color;
    pixelDisc(ctx, b.x, b.y, b.r - P);
  }
  ctx.fillStyle = "rgba(255,255,255,.6)";
  for (const b of beads) if (b.r > 2 * P) ctx.fillRect(snap(b.x - b.r / 2), snap(b.y - b.r / 2), P, P);
}

export function drawSnake(ctx: CanvasRenderingContext2D, snake: Snake, look: SnakeLook) {
  const pts = bodyPoints(snake), n = pts.length, flashRed = look.hurt && Math.floor(look.time * 10) % 2 === 1;
  const radiusAt = (i: number) => {
    const tail = n - 1 - i;
    return tail < 8 ? RADIUS * (0.45 + (0.55 * tail) / 8) : RADIUS;
  };
  // shadow on the floor, then the glow as a ring of pixels one step out
  ctx.fillStyle = "#07051a";
  for (let i = n - 1; i >= 0; i--) pixelDisc(ctx, pts[i].x + P, pts[i].y + 2 * P, radiusAt(i));
  if (look.glow) {
    ctx.fillStyle = darken(look.glow, 0.25);
    for (let i = n - 1; i >= 0; i--) pixelDisc(ctx, pts[i].x, pts[i].y, radiusAt(i) + P);
  }
  const { bands } = look.skin;
  const beads: Bead[] = [];
  for (let i = n - 1; i >= 1; i--) {
    beads.push({ x: pts[i].x, y: pts[i].y, r: radiusAt(i), color: flashRed ? GAME_COLORS.bad : bands[Math.floor(i / 3) % bands.length] });
  }
  beads.push({ x: snake.x, y: snake.y, r: RADIUS + 1.5, color: flashRed ? GAME_COLORS.bad : bands[0] });
  drawBeads(ctx, beads);
  if (look.skin.sparkle) {
    ctx.fillStyle = "#ffffff";
    for (let i = 2; i < n; i += 6) {
      if (Math.sin(look.time * 3 + i) > 0) ctx.fillRect(snap(pts[i].x + Math.sin(i) * 4), snap(pts[i].y + Math.cos(i) * 4), P, P);
    }
  }
  drawFace(ctx, snake, look);
}
