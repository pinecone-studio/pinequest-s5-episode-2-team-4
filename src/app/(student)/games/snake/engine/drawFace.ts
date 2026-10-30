import { GAME_COLORS } from "../../_lib/palette";
import { PIXEL as P, pixelLine, snap } from "../../_lib/pixel";
import { SNAKE_RADIUS as RADIUS, type Snake, type SnakeLook } from "./types";

/** Eyes that follow the target, blink and go dizzy; tongue or open mouth; crown on a streak. */
export function drawFace(ctx: CanvasRenderingContext2D, snake: Snake, look: SnakeLook) {
  const a = snake.angle, ex = Math.cos(a), ey = Math.sin(a), nx = -ey, ny = ex, hx = snake.x, hy = snake.y, R = RADIUS + 1.5;
  const t = look.target;
  if (t) {
    // open mouth: a dark block at the front of the head
    ctx.fillStyle = "#1a0b2e";
    ctx.fillRect(snap(hx + ex * 8) - P, snap(hy + ey * 8) - P, 2 * P, 2 * P);
  } else if (look.tongue && !look.paused) {
    const tx = hx + ex * R, ty = hy + ey * R, L = 6 + 3 * Math.sin(look.time * 30);
    ctx.fillStyle = GAME_COLORS.bad;
    pixelLine(ctx, tx, ty, tx + ex * L, ty + ey * L, P / 2);
    pixelLine(ctx, tx + ex * L, ty + ey * L, tx + ex * (L + 4) + nx * 3, ty + ey * (L + 4) + ny * 3, P / 2);
    pixelLine(ctx, tx + ex * L, ty + ey * L, tx + ex * (L + 4) - nx * 3, ty + ey * (L + 4) - ny * 3, P / 2);
  }
  const gaze = t ? Math.atan2(t.y - hy, t.x - hx) : a;
  for (const s of [1, -1]) {
    // each eye is 3 × 3 art pixels; the pupil is one of them
    const x = snap(hx + ex * 4.5 + nx * s * 6.3) - P, y = snap(hy + ey * 4.5 + ny * s * 6.3) - P;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x, y, 3 * P, 3 * P);
    if (look.paused) {
      // dizzy "×" eyes while the explanation is open
      ctx.fillStyle = "#120a24";
      for (const [cx, cy] of [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]]) ctx.fillRect(x + cx * P, y + cy * P, P, P);
    } else if (look.blinking) {
      ctx.fillStyle = look.skin.bands[0];
      ctx.fillRect(x, y, 3 * P, 2 * P);
    } else {
      const px = Math.round(Math.cos(gaze)) + 1, py = Math.round(Math.sin(gaze)) + 1;
      ctx.fillStyle = "#0b0820";
      ctx.fillRect(x + px * P, y + py * P, P, P);
    }
  }
  if (look.crown) drawCrown(ctx, hx, hy - 21 + Math.sin(look.time * 5) * 1.5);
}

function drawCrown(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.fillStyle = GAME_COLORS.gold;
  ctx.strokeStyle = "#7a4b00";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  [[-10, 5], [-11, -5], [-5, 0], [0, -8], [5, 0], [11, -5], [10, 5]].forEach(([x, y], i) =>
    i ? ctx.lineTo(cx + x, cy + y) : ctx.moveTo(cx + x, cy + y),
  );
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = GAME_COLORS.magenta;
  ctx.beginPath();
  ctx.arc(cx, cy + 1, 1.8, 0, Math.PI * 2);
  ctx.fill();
}
