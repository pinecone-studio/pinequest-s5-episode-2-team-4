// Night-time hills behind the fight: twinkling stars, a moon, drifting
// clouds and snow, and a glow under each fighter.

export const ARENA = { w: 520, h: 290 } as const;

let seed = 11;
const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;

const stars = Array.from({ length: 70 }, () => ({ x: rnd() * ARENA.w, y: rnd() * ARENA.h * 0.55, s: rnd() < 0.12 ? 2 : 1, ph: rnd() * 6, sp: 0.6 + rnd() * 1.6 }));
const clouds = Array.from({ length: 4 }, (_, i) => ({ x: i * 150 + rnd() * 60, y: 30 + rnd() * 70, w: 70 + rnd() * 60, v: 4 + rnd() * 6 }));
const snow = Array.from({ length: 42 }, () => ({ x: rnd() * ARENA.w, y: rnd() * ARENA.h, r: 0.6 + rnd() * 1.6, v: 8 + rnd() * 16, ph: rnd() * 6 }));

export function moveScenery(dt: number, time: number) {
  for (const c of clouds) {
    c.x += c.v * dt;
    if (c.x - c.w > ARENA.w) c.x = -c.w;
  }
  for (const s of snow) {
    s.y += s.v * dt;
    s.x += Math.sin(time + s.ph) * 8 * dt;
    if (s.y > ARENA.h) {
      s.y = -4;
      s.x = Math.random() * ARENA.w;
    }
  }
}

export function drawSky(ctx: CanvasRenderingContext2D, time: number, rage: boolean) {
  const { w: W, h: H } = ARENA;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#140d33");
  g.addColorStop(0.75, "#3b2a7a");
  ctx.fillStyle = g;
  ctx.fillRect(-10, -10, W + 20, H + 20);
  if (rage) {
    ctx.fillStyle = "rgba(255,60,90,.10)";
    ctx.fillRect(-10, -10, W + 20, H + 20);
  }
  ctx.fillStyle = "#fff";
  for (const s of stars) {
    ctx.globalAlpha = 0.25 + 0.7 * Math.abs(Math.sin(time * s.sp + s.ph));
    ctx.fillRect(s.x, s.y, s.s, s.s);
  }
  ctx.fillStyle = "#fff4d6";
  ctx.globalAlpha = 0.12;
  ctx.beginPath();
  ctx.arc(250, 44, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.95;
  ctx.beginPath();
  ctx.arc(250, 44, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = "#fff";
  for (const c of clouds) {
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, c.w / 2, 10, 0, 0, Math.PI * 2);
    ctx.ellipse(c.x + c.w * 0.2, c.y - 7, c.w / 3, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#2a1d5c";
  ctx.beginPath();
  ctx.moveTo(0, 170);
  for (const [x, y] of [[60, 132], [110, 154], [170, 118], [240, 160], [300, 134], [360, 158], [430, 124], [520, 156], [520, 290], [0, 290]]) ctx.lineTo(x, y);
  ctx.fill();
  ctx.fillStyle = "#1f1548";
  ctx.beginPath();
  ctx.moveTo(0, 200);
  ctx.bezierCurveTo(140, 184, 300, 196, 520, 186);
  ctx.lineTo(520, 290);
  ctx.lineTo(0, 290);
  ctx.fill();
}

/** Soft violet glow on the ground under a fighter. */
export function drawPlatform(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  const g = ctx.createRadialGradient(x, y, 2, x, y, r);
  g.addColorStop(0, "rgba(155,135,255,.45)");
  g.addColorStop(1, "rgba(155,135,255,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function drawSnow(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#fff";
  ctx.globalAlpha = 0.55;
  for (const s of snow) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
