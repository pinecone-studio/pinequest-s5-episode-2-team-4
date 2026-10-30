import { GAME_COLORS } from "../../_lib/palette";
import { CX, FEET_Y, H, HORIZON, LANE, ROAD, W, scaleAt, yAt } from "./world";

// The scene as pixel art: everything is filled in rows of 4-unit art pixels,
// so the road's perspective comes out as stepped edges.

/** World units per art pixel. */
const P = 4;
const snap = (v: number) => Math.round(v / P) * P;
/** Perspective scale of a screen row on the road (1 at the hero's feet). */
const rowScale = (y: number) => (y - HORIZON) / (FEET_Y - HORIZON);

const SKY = ["#0d0a22", "#150e33", "#1d1245", "#261657", "#301a69", "#3b1d7a"];
const STARS = Array.from({ length: 30 }, (_, i) => ({ x: snap((i * 97) % W), y: snap((i * 53) % (HORIZON - 24)) }));
const SUN = [GAME_COLORS.gold, "#ffb85a", "#ff9a5a", "#ff6f7f", "#f0479c", GAME_COLORS.magenta];
const PEAKS = [0, 18, 40, 10, 70, 28, 110, 6, 150, 30, 250, 34, 290, 8, 330, 26, 370, 12, 400, 22];
const GROUND = ["#1a0f3d", "#1f1247", "#241451", "#2a1660"];

/** Height of the mountains at x, from the peak list. */
function peakAt(x: number) {
  for (let i = 0; i < PEAKS.length - 2; i += 2) {
    const [x0, h0, x1, h1] = PEAKS.slice(i, i + 4);
    if (x >= x0 && x <= x1) return h0 + ((h1 - h0) * (x - x0)) / (x1 - x0);
  }
  return 0;
}

/** Fills the road's rows between two distances. */
function roadRows(ctx: CanvasRenderingContext2D, d0: number, d1: number) {
  const top = snap(yAt(d1)), bottom = snap(yAt(d0));
  for (let y = top; y < bottom; y += P) {
    const half = snap(ROAD * rowScale(y + P / 2));
    ctx.fillRect(CX - half, y, half * 2, P);
  }
}

/** Night sky, a striped pixel sun, stepped mountains, and the road with scrolling lane marks and lamp posts. */
export function drawScene(ctx: CanvasRenderingContext2D, run: number, t: number) {
  ctx.imageSmoothingEnabled = false;
  // sky in bands, with twinkling stars
  const band = Math.ceil(HORIZON / SKY.length / P) * P;
  SKY.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(0, i * band, W, band);
  });
  STARS.forEach((s, i) => {
    ctx.fillStyle = Math.sin(t * 2 + i * 1.9) > 0.2 ? "#f6f3ff" : "#5a4a9a";
    ctx.fillRect(s.x, s.y, i % 5 ? 2 : P, i % 5 ? 2 : P);
  });

  // striped sun, built row by row from its circle
  const r = 56;
  for (let y = HORIZON - r; y < HORIZON; y += P) {
    const dy = HORIZON - (y + P / 2);
    const row = Math.floor(((y - (HORIZON - r)) / r) * SUN.length);
    if (row >= 3 && (y / P) % 3 === 0) continue;
    const half = snap(Math.sqrt(Math.max(0, r * r - dy * dy)));
    ctx.fillStyle = SUN[Math.min(SUN.length - 1, row)];
    ctx.fillRect(CX - half, y, half * 2, P);
  }

  // mountains as columns of art pixels
  ctx.fillStyle = "#26124f";
  for (let x = 0; x < W; x += P) {
    const h = snap(peakAt(x + P / 2));
    ctx.fillRect(x, HORIZON - h, P, h);
  }

  // ground in bands
  const ground = Math.ceil((H - HORIZON) / GROUND.length / P) * P;
  GROUND.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(0, HORIZON + i * ground, W, ground);
  });

  // road, then the stripes that scroll across it
  ctx.fillStyle = "#1d1647";
  roadRows(ctx, -60, 4000);
  ctx.fillStyle = "rgb(91 0 237 / 0.16)";
  for (let k = 0; k < 40; k += 2) {
    const d = k * 90 - (run % 90) - 40;
    roadRows(ctx, d, d + 45);
  }

  // lane marks: short dashes either side of the middle lane
  ctx.fillStyle = "rgb(246 243 255 / 0.6)";
  for (let k = 0; k < 30; k++) {
    const d = k * 70 - (run % 70) - 30;
    const top = snap(yAt(d + 34)), bottom = snap(yAt(d));
    for (let y = top; y < bottom; y += P) {
      const s = rowScale(y + P / 2);
      const w = Math.max(P, snap(3 * s));
      for (const side of [-0.5, 0.5]) ctx.fillRect(snap(CX + side * LANE * s - w / 2), y, w, P);
    }
  }

  // neon edges with a one-pixel glow outside
  for (const [side, color] of [
    [-1, GAME_COLORS.violetLight],
    [1, GAME_COLORS.magenta],
  ] as const) {
    for (let y = snap(yAt(4000)); y < H; y += P) {
      const x = snap(CX + side * ROAD * rowScale(y + P / 2));
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = color;
      ctx.fillRect(x + (side > 0 ? 0 : -P), y, P, P);
      ctx.globalAlpha = 1;
      ctx.fillRect(x + (side > 0 ? -P : 0), y, P, P);
    }
  }

  // lamp posts passing by: a pole and a square lamp with a halo
  for (let k = 12; k >= 0; k--) {
    const d = k * 200 - (run % 200) + 20;
    const p = scaleAt(d), y = snap(yAt(d));
    const pole = Math.max(2, snap(3 * p)), lamp = Math.max(P, snap(10 * p)), h = snap(90 * p);
    for (const side of [-1, 1]) {
      const x = snap(CX + side * (ROAD + 26) * p);
      ctx.fillStyle = "#4b3a8f";
      ctx.fillRect(x - pole / 2, y - h, pole, h);
      ctx.fillStyle = "rgb(255 207 90 / 0.25)";
      ctx.fillRect(x - lamp, y - h - lamp * 1.5, lamp * 2, lamp * 2);
      ctx.fillStyle = GAME_COLORS.gold;
      ctx.fillRect(x - lamp / 2, y - h - lamp, lamp, lamp);
    }
  }
}
