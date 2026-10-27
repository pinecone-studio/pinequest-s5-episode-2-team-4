import { GAME_COLORS } from "../../_lib/palette";
import { CX, H, HORIZON, LANE, ROAD, W, scaleAt, yAt } from "./world";

const STARS = Array.from({ length: 40 }, (_, i) => ({
  x: (i * 97) % W,
  y: (i * 53) % (HORIZON - 20),
  r: i % 5 === 0 ? 1.4 : 0.8,
}));

/** Night sky, a neon sun, mountains, and the road with scrolling lane marks and lamp posts. */
export function drawScene(ctx: CanvasRenderingContext2D, run: number, t: number) {
  // sky
  const sky = ctx.createLinearGradient(0, 0, 0, HORIZON);
  sky.addColorStop(0, "#0d0a22");
  sky.addColorStop(1, "#3b1d7a");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, HORIZON + 1);
  for (const s of STARS) {
    ctx.globalAlpha = 0.4 + 0.4 * Math.sin(t * 2 + s.x);
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // striped neon sun on the horizon
  const sun = ctx.createLinearGradient(0, HORIZON - 70, 0, HORIZON);
  sun.addColorStop(0, GAME_COLORS.gold);
  sun.addColorStop(1, GAME_COLORS.magenta);
  ctx.save();
  ctx.beginPath();
  ctx.arc(CX, HORIZON, 58, Math.PI, 0);
  ctx.clip();
  ctx.fillStyle = sun;
  ctx.fillRect(CX - 60, HORIZON - 60, 120, 60);
  ctx.fillStyle = "#3b1d7a";
  for (let i = 0; i < 5; i++) ctx.fillRect(CX - 60, HORIZON - 26 + i * 6, 120, 1.5 + i * 0.6);
  ctx.restore();

  // mountains
  ctx.fillStyle = "#26124f";
  ctx.beginPath();
  ctx.moveTo(0, HORIZON);
  const peaks = [0, 18, 40, 10, 70, 28, 110, 6, 150, 30, 250, 34, 290, 8, 330, 26, 370, 12, 400, 22];
  for (let i = 0; i < peaks.length; i += 2) ctx.lineTo(peaks[i], HORIZON - peaks[i + 1]);
  ctx.lineTo(W, HORIZON);
  ctx.fill();

  // ground on both sides of the road
  const ground = ctx.createLinearGradient(0, HORIZON, 0, H);
  ground.addColorStop(0, "#1a0f3d");
  ground.addColorStop(1, "#2a1660");
  ctx.fillStyle = ground;
  ctx.fillRect(0, HORIZON, W, H - HORIZON);

  // road
  const far = 4000;
  ctx.fillStyle = "#1d1647";
  ctx.beginPath();
  ctx.moveTo(CX - ROAD * scaleAt(far), yAt(far));
  ctx.lineTo(CX + ROAD * scaleAt(far), yAt(far));
  ctx.lineTo(CX + ROAD * scaleAt(-60), yAt(-60));
  ctx.lineTo(CX - ROAD * scaleAt(-60), yAt(-60));
  ctx.closePath();
  ctx.fill();

  // scrolling stripes across the road, for a sense of speed
  for (let k = 0; k < 40; k++) {
    const d = k * 90 - (run % 90) - 40;
    if (k % 2) continue;
    const y0 = yAt(d), y1 = yAt(d + 45);
    ctx.fillStyle = "rgb(91 0 237 / 0.12)";
    ctx.beginPath();
    ctx.moveTo(CX - ROAD * scaleAt(d), y0);
    ctx.lineTo(CX + ROAD * scaleAt(d), y0);
    ctx.lineTo(CX + ROAD * scaleAt(d + 45), y1);
    ctx.lineTo(CX - ROAD * scaleAt(d + 45), y1);
    ctx.fill();
  }

  // lane marks
  ctx.strokeStyle = "rgb(246 243 255 / 0.55)";
  ctx.lineCap = "round";
  for (const side of [-0.5, 0.5]) {
    for (let k = 0; k < 30; k++) {
      const d = k * 70 - (run % 70) - 30;
      const a = scaleAt(d), b = scaleAt(d + 34);
      ctx.lineWidth = 3 * a;
      ctx.beginPath();
      ctx.moveTo(CX + side * LANE * a, yAt(d));
      ctx.lineTo(CX + side * LANE * b, yAt(d + 34));
      ctx.stroke();
    }
  }

  // neon edges
  for (const [side, color] of [
    [-1, GAME_COLORS.violetLight],
    [1, GAME_COLORS.magenta],
  ] as const) {
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(CX + side * ROAD * scaleAt(far), yAt(far));
    ctx.lineTo(CX + side * ROAD * scaleAt(-60), yAt(-60));
    ctx.stroke();
  }
  ctx.shadowBlur = 0;

  // lamp posts passing by
  for (let k = 12; k >= 0; k--) {
    const d = k * 200 - (run % 200) + 20;
    const p = scaleAt(d), y = yAt(d);
    for (const side of [-1, 1]) {
      const x = CX + side * (ROAD + 26) * p;
      ctx.strokeStyle = "#4b3a8f";
      ctx.lineWidth = 3 * p;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - 90 * p);
      ctx.stroke();
      ctx.fillStyle = GAME_COLORS.gold;
      ctx.shadowColor = GAME_COLORS.gold;
      ctx.shadowBlur = 12 * p;
      ctx.beginPath();
      ctx.arc(x, y - 92 * p, 5 * p, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
}
