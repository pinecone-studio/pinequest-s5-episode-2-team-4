import { roundRect } from "../../_lib/canvas";
import { GAME_COLORS } from "../../_lib/palette";
import { drawAnswer } from "../../_lib/shapes";
import type { Half, Piece, TrailPoint } from "./types";

/** Every answer looks the same, so the player has to read it before slicing. */
function drawPill(ctx: CanvasRenderingContext2D, p: Piece) {
  const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, p.w * 0.75);
  glow.addColorStop(0, "rgba(139,92,255,.35)");
  glow.addColorStop(1, "rgba(139,92,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(-p.w, -p.w, p.w * 2, p.w * 2);
  const g = ctx.createLinearGradient(0, -p.h / 2, 0, p.h / 2);
  g.addColorStop(0, "#3a2a8a");
  g.addColorStop(1, "#1d1550");
  ctx.shadowColor = "rgba(0,0,0,.45)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  roundRect(ctx, -p.w / 2, -p.h / 2, p.w, p.h, Math.min(19, p.h / 2));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.shadowBlur = ctx.shadowOffsetY = 0;
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(167,139,250,.9)";
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,.14)";
  roundRect(ctx, -p.w / 2 + 5, -p.h / 2 + 3, p.w - 10, p.h * 0.35, 10);
  ctx.fill();
  drawAnswer(ctx, p.answer);
}

export function drawPiece(ctx: CanvasRenderingContext2D, p: Piece) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  drawPill(ctx, p);
  ctx.restore();
}

/** One half of a cut answer: clipped along the cut, with a green or red edge, fading out. */
export function drawHalf(ctx: CanvasRenderingContext2D, h: Half) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, 1 - h.life / 1.2);
  ctx.translate(h.x, h.y);
  ctx.rotate(h.rot);
  ctx.save();
  ctx.rotate(h.ang);
  ctx.beginPath();
  ctx.rect(-200, h.side > 0 ? 0 : -200, 400, 200);
  ctx.restore();
  ctx.clip();
  drawPill(ctx, h.piece);
  ctx.rotate(h.ang);
  ctx.fillStyle = h.piece.ok ? GAME_COLORS.good : GAME_COLORS.bad;
  ctx.fillRect(-h.piece.w, -1.5, h.piece.w * 2, 3);
  ctx.restore();
}

/** The blade: a glowing line along the finger's recent path, thicker towards the tip. */
export function drawTrail(ctx: CanvasRenderingContext2D, trail: TrailPoint[]) {
  if (trail.length < 2) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = ctx.lineJoin = "round";
  for (let i = 1; i < trail.length; i++) {
    const a = trail[i - 1], b = trail[i], f = i / trail.length, alpha = Math.max(0, 1 - b.life / 0.18);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = `rgba(79,195,247,${0.55 * alpha})`;
    ctx.lineWidth = 3 + 11 * f;
    ctx.stroke();
    ctx.strokeStyle = `rgba(255,255,255,${0.9 * alpha})`;
    ctx.lineWidth = 1 + 3 * f;
    ctx.stroke();
  }
  ctx.restore();
}
