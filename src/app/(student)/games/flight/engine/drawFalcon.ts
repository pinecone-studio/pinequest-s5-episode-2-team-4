import { GAME_COLORS } from "../../_lib/palette";
import { FALCON_R, FALCON_X, GROUND, type Falcon } from "./types";

export type FalconLook = {
  time: number;
  /** 1 right after a flap, easing to 0. */
  wing: number;
  blinking: boolean;
  /** Red flashing after a wrong gap. */
  hurt: boolean;
  /** Green glow after a right gap. */
  glow: boolean;
  /** Crossed-out eyes while the explanation is open or the falcon is dizzy. */
  stunned: boolean;
  /** Crown on a streak of 3+. */
  crown: boolean;
  still: boolean;
};

function ellipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, 7);
  ctx.fill();
}

function drawEye(ctx: CanvasRenderingContext2D, f: Falcon, look: FalconLook) {
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(6, -5, 5.4, 0, 7);
  ctx.fill();
  if (look.stunned) {
    ctx.strokeStyle = "#1a0b2e";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(4, -7);
    ctx.lineTo(8.5, -2.5);
    ctx.moveTo(8.5, -7);
    ctx.lineTo(4, -2.5);
    ctx.stroke();
  } else if (look.blinking) {
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.arc(6, -5, 5.6, Math.PI, 0);
    ctx.fill();
  } else {
    // The pupil follows the vertical speed: up when climbing, down when falling.
    const py = Math.max(-1.5, Math.min(1.5, f.vy / 150));
    ctx.fillStyle = "#1a0b2e";
    ctx.beginPath();
    ctx.arc(7.6, -5 + py, 3, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(6.7, -6.2 + py, 1.1, 0, 7);
    ctx.fill();
  }
}

function drawBody(ctx: CanvasRenderingContext2D, f: Falcon, look: FalconLook) {
  ctx.fillStyle = "#8a3b0c";
  ctx.beginPath();
  for (const [x, y] of [[-11, -3], [-22, -7], [-20, 0], [-23, 5], [-11, 4]]) ctx.lineTo(x, y);
  ctx.fill();
  const hurt = look.hurt && Math.floor(look.time * 12) % 2 === 1, body = ctx.createRadialGradient(-4, -6, 2, 0, 0, FALCON_R + 2);
  body.addColorStop(0, hurt ? "#ffb3c0" : "#ffe29a");
  body.addColorStop(0.55, hurt ? GAME_COLORS.bad : "#f59e0b");
  body.addColorStop(1, hurt ? "#a3203a" : "#9a4a0b");
  ctx.fillStyle = body;
  ellipse(ctx, 0, 0, FALCON_R + 1.5, FALCON_R);
  ctx.fillStyle = "#fff3d6";
  ellipse(ctx, 3, 5, 9, 7, -0.2);
  ctx.fillStyle = "rgba(124,45,18,.75)";
  ellipse(ctx, 6, 3, 1.4, 2.6);
  drawEye(ctx, f, look);
  ctx.fillStyle = "rgba(255,120,150,.55)";
  ellipse(ctx, 9, 2, 2.6, 1.6);
  ctx.fillStyle = "#ffd36b";
  ctx.beginPath();
  ctx.moveTo(11, -5);
  ctx.quadraticCurveTo(19, -4, 18, 1);
  ctx.quadraticCurveTo(15, -1, 11, 0);
  ctx.fill();
  // Wing: flaps hard right after a tap, then rests.
  ctx.save();
  ctx.translate(-3, -1);
  ctx.rotate(-0.9 + (1 - look.wing) * 0.2 + Math.sin(look.wing * Math.PI * 3) * 0.9 * look.wing);
  const wing = ctx.createLinearGradient(0, -4, 0, 10);
  wing.addColorStop(0, "#c2410c");
  wing.addColorStop(1, "#7c2d12");
  ctx.fillStyle = wing;
  ellipse(ctx, -2, 3, 11, 6.5, 0.35);
  ctx.restore();
}

function drawCrown(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = GAME_COLORS.gold;
  ctx.strokeStyle = "#7a4b00";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (const [dx, dy] of [[-9, 5], [-10, -4], [-4.5, 0], [0, -7], [4.5, 0], [10, -4], [9, 5]]) ctx.lineTo(x + dx, y + dy);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

/** The falcon at its fixed x with its shadow on the ground, glow, crown and dizzy stars. */
export function drawFalcon(ctx: CanvasRenderingContext2D, f: Falcon, look: FalconLook) {
  const x = FALCON_X, y = f.y, height = Math.max(0, Math.min(1, (GROUND - y) / 300));
  ctx.fillStyle = `rgba(0,0,0,${0.35 - height * 0.25})`;
  ellipse(ctx, x, GROUND + 3, 14 - height * 6, 3.5 - height * 1.5);
  if (look.glow) {
    const g = ctx.createRadialGradient(x, y, 4, x, y, 40);
    g.addColorStop(0, "rgba(52,211,153,.5)");
    g.addColorStop(1, "rgba(52,211,153,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - 40, y - 40, 80, 80);
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(f.rot);
  ctx.scale(1.15, 1.15);
  drawBody(ctx, f, look);
  ctx.restore();
  if (look.crown) drawCrown(ctx, x + 2, y - 27 + (look.still ? 0 : Math.sin(look.time * 5) * 1.5));
  if (f.dizzy > 0 && !look.still) {
    ctx.fillStyle = GAME_COLORS.gold;
    ctx.globalAlpha = f.dizzy;
    for (let i = 0; i < 3; i++) {
      const a = look.time * 5 + i * 2.1;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * 14, y - 20 + Math.sin(a) * 4, 2, 0, 7);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
