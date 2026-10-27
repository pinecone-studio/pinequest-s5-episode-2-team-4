import { GAME_COLORS } from "./palette";

type Particle = {
  x: number; y: number; vx: number; vy: number;
  life: number; max: number; color: string; size: number;
  /** Falls with gravity (confetti) instead of slowing down (sparks). */
  gravity?: number;
  spin?: number;
};
type FloatText = { x: number; y: number; text: string; color: string; life: number; small?: boolean };
type Ring = { x: number; y: number; t: number; color: string };

/** Sparks, confetti, "+10" texts and shock rings, drawn on top of a game scene. */
export class Effects {
  private parts: Particle[] = [];
  private texts: FloatText[] = [];
  private rings: Ring[] = [];

  burst(x: number, y: number, color: string, count: number, speed = 150) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2, v = speed * (0.35 + Math.random());
      this.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 0.45 + Math.random() * 0.4, color, size: 2 + Math.random() * 3.5 });
    }
  }

  /** One spark, e.g. for a trail. */
  spark(p: Omit<Particle, "life">) {
    this.parts.push({ ...p, life: 0 });
  }

  confetti(x: number, y: number) {
    const colors = [GAME_COLORS.violet, GAME_COLORS.violetLight, GAME_COLORS.magenta, GAME_COLORS.gold, GAME_COLORS.good];
    for (let i = 0; i < 70; i++) {
      this.parts.push({
        x: x + (Math.random() - 0.5) * 120, y,
        vx: (Math.random() - 0.5) * 380, vy: -120 - Math.random() * 260,
        life: 0, max: 1.4 + Math.random() * 0.6, color: colors[i % colors.length],
        size: 3 + Math.random() * 4, gravity: 420, spin: Math.random() * 6,
      });
    }
  }

  float(x: number, y: number, text: string, color: string = GAME_COLORS.gold, small = false) {
    this.texts.push({ x, y, text, color, life: 0, small });
  }

  ring(x: number, y: number, color: string = GAME_COLORS.good) {
    this.rings.push({ x, y, t: 0, color });
  }

  clear() {
    this.parts = [];
    this.texts = [];
    this.rings = [];
  }

  update(dt: number) {
    for (const p of this.parts) {
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.gravity) p.vy += p.gravity * dt;
      else {
        p.vx *= 0.95;
        p.vy *= 0.95;
      }
    }
    this.parts = this.parts.filter((p) => p.life < p.max);
    for (const t of this.texts) {
      t.life += dt;
      t.y -= 40 * dt;
    }
    this.texts = this.texts.filter((t) => t.life < 1.1);
    for (const r of this.rings) r.t += dt;
    this.rings = this.rings.filter((r) => r.t < 0.5);
  }

  /** Rings go under the scene's actors; call drawRings before them. */
  drawRings(ctx: CanvasRenderingContext2D) {
    ctx.lineWidth = 3;
    for (const r of this.rings) {
      ctx.globalAlpha = 1 - r.t / 0.5;
      ctx.strokeStyle = r.color;
      ctx.beginPath();
      ctx.arc(r.x, r.y, 10 + r.t * 90, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  draw(ctx: CanvasRenderingContext2D, font: (weight: number, size: number) => string) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const p of this.parts) {
      ctx.globalAlpha = Math.max(0, 1 - p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.save();
      ctx.translate(p.x, p.y);
      if (p.spin !== undefined) ctx.rotate(p.spin + p.life * 8);
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * (p.spin !== undefined ? 1.6 : 1));
      ctx.restore();
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.textAlign = "center";
    ctx.lineWidth = 5;
    ctx.strokeStyle = GAME_COLORS.night;
    for (const t of this.texts) {
      ctx.globalAlpha = Math.max(0, 1 - t.life / 1.1);
      ctx.font = font(800, t.small ? 14 : 22);
      ctx.strokeText(t.text, t.x, t.y - 22);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y - 22);
    }
    ctx.restore();
  }
}
