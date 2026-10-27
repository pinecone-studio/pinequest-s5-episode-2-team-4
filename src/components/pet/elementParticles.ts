import type { PetElement } from "@/lib/types";

/**
 * Particle effects for the element rings. Positions are in px relative to the
 * chip centre; `k` scales sizes to the chip (1 at an 80px chip, r = 40).
 */

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  max: number;
  size: number;
  rot: number;
  vr: number;
  seed: number;
  /** Variant within an effect (e.g. pebble 0, dust 1). */
  kind: number;
  hue: number;
};

type Effect = {
  /** Expected spawns per frame at 60fps. */
  rate: number;
  cap: number;
  blend?: GlobalCompositeOperation;
  spawn: (push: (p: Partial<Particle> & { max: number }) => void, r: number, k: number) => void;
  step: (p: Particle, dt: number, k: number) => void;
  draw: (ctx: CanvasRenderingContext2D, p: Particle, k: number, r: number) => void;
};

const TAU = Math.PI * 2;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
/** 1 → 0 over the particle's life. */
const left = (p: Particle) => 1 - p.age / p.max;
/** Fades in at birth and out at death. */
const fade = (p: Particle) => Math.min(1, (p.age / p.max) * 6, left(p) * 2.5);

const fire: Effect = {
  rate: 0.65,
  cap: 40,
  blend: "lighter",
  spawn(push, r, k) {
    const a = rnd(0.12, 0.88) * Math.PI;
    push({
      x: Math.cos(a) * r * 0.95,
      y: Math.sin(a) * r * 0.9,
      vx: rnd(-0.2, 0.2) * k,
      vy: -rnd(0.6, 1.3) * k,
      max: rnd(34, 62),
      size: rnd(1.8, 3.8) * k,
    });
  },
  step(p, dt) {
    p.x += (p.vx + Math.sin(p.age * 0.22 + p.seed) * 0.18) * dt;
    p.y += p.vy * dt;
  },
  draw(ctx, p) {
    const t = left(p);
    const rad = p.size * (0.35 + t);
    // Hot yellow at birth, deep red as it dies
    ctx.fillStyle = `hsla(${6 + t * 46}, 100%, 55%, ${0.16 * t})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, rad * 2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = `hsla(${14 + t * 44}, 100%, ${55 + t * 20}%, ${0.9 * t})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, rad, 0, TAU);
    ctx.fill();
  },
};

const water: Effect = {
  rate: 0.07,
  cap: 14,
  spawn(push, r, k) {
    const x = rnd(-r * 0.8, r * 0.8);
    push({
      x,
      y: Math.sqrt(Math.max(0, r * r - x * x)) * rnd(0.55, 1),
      vy: -rnd(0.25, 0.6) * k,
      max: rnd(70, 120),
      size: rnd(1.8, 4.4) * k,
    });
  },
  step(p, dt) {
    p.y += p.vy * dt;
    p.x += Math.sin(p.age * 0.1 + p.seed) * 0.3 * dt;
  },
  draw(ctx, p) {
    const a = fade(p);
    ctx.fillStyle = `rgba(110,200,255,${0.2 * a})`;
    ctx.strokeStyle = `rgba(190,235,255,${0.9 * a})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = `rgba(255,255,255,${0.95 * a})`;
    ctx.beginPath();
    ctx.arc(p.x - p.size * 0.35, p.y - p.size * 0.35, p.size * 0.28, 0, TAU);
    ctx.fill();
  },
};

const wood: Effect = {
  rate: 0.05,
  cap: 10,
  spawn(push, r, k) {
    push({
      x: rnd(-r * 1.1, r * 1.1),
      y: -r * rnd(0.9, 1.25),
      vx: rnd(-0.05, 0.2) * k,
      vy: rnd(0.25, 0.5) * k,
      rot: rnd(0, TAU),
      vr: rnd(-0.05, 0.05),
      max: rnd(110, 170),
      size: rnd(3.5, 6) * k,
      hue: rnd(78, 130),
    });
  },
  step(p, dt) {
    p.x += (p.vx + Math.sin(p.age * 0.06 + p.seed) * 0.45) * dt;
    p.y += p.vy * dt;
    p.rot += (p.vr + Math.sin(p.age * 0.08 + p.seed) * 0.03) * dt;
  },
  draw(ctx, p) {
    const a = fade(p);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = a;
    ctx.fillStyle = `hsl(${p.hue},62%,42%)`;
    ctx.beginPath();
    ctx.ellipse(0, 0, p.size, p.size * 0.46, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = `hsl(${p.hue},60%,70%)`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-p.size, 0);
    ctx.lineTo(p.size, 0);
    ctx.stroke();
    ctx.restore();
  },
};

const ice: Effect = {
  rate: 0.3,
  cap: 26,
  blend: "lighter",
  spawn(push, r, k) {
    const a = rnd(0, TAU);
    const d = r * rnd(0.55, 1.35);
    push({
      x: Math.cos(a) * d,
      y: Math.sin(a) * d,
      vx: rnd(-0.08, 0.08) * k,
      vy: rnd(0.1, 0.35) * k,
      max: rnd(60, 120),
      size: rnd(1, 2.8) * k,
    });
  },
  step(p, dt) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  },
  draw(ctx, p) {
    const a = Math.sin(Math.min(1, p.age / p.max) * Math.PI) * (0.65 + 0.35 * Math.sin(p.age * 0.3 + p.seed));
    ctx.fillStyle = `rgba(190,235,255,${a})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 0.7, 0, TAU);
    ctx.fill();
    if (p.size > 1.9) {
      // Four-point glint on the bigger flakes
      ctx.strokeStyle = `rgba(255,255,255,${a})`;
      ctx.lineWidth = 0.8;
      const s = p.size * 2.4;
      ctx.beginPath();
      ctx.moveTo(p.x - s, p.y);
      ctx.lineTo(p.x + s, p.y);
      ctx.moveTo(p.x, p.y - s);
      ctx.lineTo(p.x, p.y + s);
      ctx.stroke();
    }
  },
};

const sky: Effect = {
  rate: 0.12,
  cap: 10,
  spawn(push, r, k) {
    const vx = rnd(0.9, 1.7) * k;
    push({
      x: -r * 1.55,
      y: rnd(-r * 1.1, r * 1.1),
      vx,
      max: (r * 3.2) / vx,
      size: rnd(9, 20) * k,
    });
  },
  step(p, dt) {
    p.x += p.vx * dt;
    p.y += Math.sin(p.age * 0.08 + p.seed) * 0.25 * dt;
  },
  draw(ctx, p) {
    const a = fade(p) * 0.75;
    const bend = Math.sin(p.age * 0.1 + p.seed) * 3;
    ctx.strokeStyle = `rgba(150,205,255,${a})`;
    ctx.lineWidth = 1.4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(p.x - p.size, p.y);
    ctx.quadraticCurveTo(p.x - p.size / 2, p.y + bend, p.x, p.y);
    ctx.stroke();
    // A small curl at the head, like a gust
    ctx.beginPath();
    ctx.arc(p.x, p.y - 2, 2, Math.PI * 0.5, Math.PI * 1.9);
    ctx.stroke();
  },
};

const metal: Effect = {
  rate: 0.05,
  cap: 40,
  blend: "lighter",
  spawn(push, r, k) {
    const a = rnd(0, TAU);
    for (let i = 0; i < 7; i++) {
      const dir = a + rnd(-0.7, 0.7);
      const sp = rnd(1, 2.7) * k;
      push({
        x: Math.cos(a) * r,
        y: Math.sin(a) * r,
        vx: Math.cos(dir) * sp,
        vy: Math.sin(dir) * sp,
        max: rnd(14, 30),
        size: k,
        hue: rnd(38, 55),
      });
    }
  },
  step(p, dt, k) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 0.08 * k * dt;
  },
  draw(ctx, p) {
    const t = left(p);
    ctx.strokeStyle = `hsla(${p.hue},100%,${68 + (1 - t) * 0}%,${t})`;
    ctx.lineWidth = 1.3 * p.size;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x - p.vx * 2.2, p.y - p.vy * 2.2);
    ctx.stroke();
  },
};

const earth: Effect = {
  rate: 0.07,
  cap: 24,
  spawn(push, r, k) {
    const x = rnd(-r * 0.7, r * 0.7);
    const y = r * 0.88;
    push({
      x, y,
      vx: rnd(-0.5, 0.5) * k,
      vy: -rnd(1.2, 2.2) * k,
      rot: rnd(0, TAU),
      vr: rnd(-0.2, 0.2),
      max: rnd(40, 60),
      size: rnd(1.6, 3.4) * k,
      kind: 0,
    });
    for (let i = 0; i < 2; i++) {
      push({
        x: x + rnd(-4, 4), y,
        vx: rnd(-0.3, 0.3) * k,
        vy: -rnd(0.1, 0.3) * k,
        max: rnd(36, 56),
        size: rnd(3, 6) * k,
        kind: 1,
      });
    }
  },
  step(p, dt, k) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.kind === 0) {
      p.vy += 0.09 * k * dt;
      p.rot += p.vr * dt;
    }
  },
  draw(ctx, p) {
    if (p.kind === 1) {
      ctx.fillStyle = `rgba(190,150,95,${0.32 * left(p)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1 + p.age / p.max), 0, TAU);
      ctx.fill();
      return;
    }
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = Math.min(1, left(p) * 3);
    ctx.fillStyle = "hsl(28,38%,38%)";
    ctx.strokeStyle = "hsl(28,40%,22%)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-p.size, -p.size * 0.6);
    ctx.lineTo(p.size * 0.8, -p.size);
    ctx.lineTo(p.size, p.size * 0.5);
    ctx.lineTo(-p.size * 0.5, p.size);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  },
};

const shadow: Effect = {
  rate: 0.45,
  cap: 30,
  spawn(push, r, k) {
    const a = rnd(0, TAU);
    const out = rnd(0.12, 0.3) * k;
    const swirl = 0.4 * k;
    push({
      x: Math.cos(a) * r * 0.95,
      y: Math.sin(a) * r * 0.95,
      vx: Math.cos(a) * out - Math.sin(a) * swirl,
      vy: Math.sin(a) * out + Math.cos(a) * swirl,
      max: rnd(55, 100),
      size: rnd(4, 8) * k,
      kind: Math.random() < 0.3 ? 1 : 0,
    });
  },
  step(p, dt) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  },
  draw(ctx, p) {
    const a = fade(p);
    if (p.kind === 1) {
      // Small violet motes caught in the smoke
      ctx.fillStyle = `rgba(190,110,255,${0.9 * a})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.2, 0, TAU);
      ctx.fill();
      return;
    }
    const rad = p.size * (1 + (p.age / p.max) * 0.9);
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
    g.addColorStop(0, `rgba(70,10,130,${0.55 * a})`);
    g.addColorStop(1, "rgba(70,10,130,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, rad, 0, TAU);
    ctx.fill();
  },
};

export const EFFECTS: Record<PetElement, Effect> = {
  fire,
  water,
  wood,
  ice,
  sky,
  metal,
  earth,
  shadow,
};

export function newParticle(init: Partial<Particle> & { max: number }): Particle {
  return {
    x: 0, y: 0, vx: 0, vy: 0, age: 0, size: 2, rot: 0, vr: 0, kind: 0, hue: 0,
    seed: Math.random() * TAU,
    ...init,
  };
}
