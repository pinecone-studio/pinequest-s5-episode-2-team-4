import { GAME_COLORS } from "../../_lib/palette";
import { SNAKE_RADIUS as RADIUS, type Snake, type SnakeLook } from "./types";

/** Eyes that follow the target, blink and go dizzy; tongue or open mouth; crown on a streak. */
export function drawFace(ctx: CanvasRenderingContext2D, snake: Snake, look: SnakeLook) {
  const a = snake.angle, ex = Math.cos(a), ey = Math.sin(a), nx = -ey, ny = ex, hx = snake.x, hy = snake.y, R = RADIUS + 1.5;
  const t = look.target;
  if (t) {
    ctx.fillStyle = "#1a0b2e";
    ctx.beginPath();
    ctx.ellipse(hx + ex * 8, hy + ey * 8, 4, 2.8, a, 0, Math.PI * 2);
    ctx.fill();
  } else if (look.tongue && !look.paused) {
    const tx = hx + ex * R, ty = hy + ey * R, L = 6 + 3 * Math.sin(look.time * 30);
    ctx.strokeStyle = GAME_COLORS.bad;
    ctx.lineWidth = 1.8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx + ex * L, ty + ey * L);
    ctx.lineTo(tx + ex * (L + 4) + nx * 3, ty + ey * (L + 4) + ny * 3);
    ctx.moveTo(tx + ex * L, ty + ey * L);
    ctx.lineTo(tx + ex * (L + 4) - nx * 3, ty + ey * (L + 4) - ny * 3);
    ctx.stroke();
  }
  const look2 = t ? Math.atan2(t.y - hy, t.x - hx) : a;
  for (const s of [1, -1]) {
    const x = hx + ex * 4.5 + nx * s * 6.3, y = hy + ey * 4.5 + ny * s * 6.3;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(x, y, 5.2, 0, Math.PI * 2);
    ctx.fill();
    if (look.paused) {
      // Dizzy "×" eyes while the explanation is open.
      ctx.strokeStyle = "#120a24";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(x - 2.5, y - 2.5);
      ctx.lineTo(x + 2.5, y + 2.5);
      ctx.moveTo(x + 2.5, y - 2.5);
      ctx.lineTo(x - 2.5, y + 2.5);
      ctx.stroke();
    } else if (look.blinking) {
      ctx.fillStyle = look.skin.bands[0];
      ctx.beginPath();
      ctx.arc(x, y, 5.4, Math.PI, 0);
      ctx.fill();
    } else {
      const px = x + Math.cos(look2) * 2.1, py = y + Math.sin(look2) * 2.1;
      ctx.fillStyle = "#0b0820";
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(px - 1, py - 1.1, 1.1, 0, Math.PI * 2);
      ctx.fill();
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
