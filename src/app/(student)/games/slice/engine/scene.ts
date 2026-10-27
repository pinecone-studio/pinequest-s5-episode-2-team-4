import type { GameAnswer } from "@/lib/types";
import { prefersReducedMotion, type Stage } from "../../_lib/canvas";
import { Effects } from "../../_lib/effects";
import { GAME_COLORS, gameFont } from "../../_lib/palette";
import { answerLabel } from "../../_lib/shapes";
import { buildDusk, drawFireflies } from "./drawBackdrop";
import { drawHalf, drawPiece, drawTrail } from "./drawPieces";
import { GRAVITY, WORLD, type Half, type Piece, type TrailPoint } from "./types";

/** Light blue of a khadag (ceremonial scarf), for the sparks of a right cut. */
const KHADAG = "#4fc3f7";

export type SliceView = { pieces: Piece[]; slow: boolean; paused: boolean };

/** Everything the player sees but the rules don't care about: backdrop, halves, the blade, flashes, effects. */
export class SliceScene {
  readonly fx = new Effects();
  readonly still = prefersReducedMotion();
  time = 0;
  private dusk?: HTMLCanvasElement;
  private halves: Half[] = [];
  private trail: TrailPoint[] = [];
  private flash = { color: "", t: 0 };
  private shake = 0;

  resize(stage: Stage) {
    this.dusk = buildDusk(stage);
  }

  clear() {
    this.halves = [];
    this.trail = [];
    this.fx.clear();
  }

  addTrail(x: number, y: number) {
    this.trail.push({ x, y, life: 0 });
  }

  /** Splits a piece along the swipe angle; a right one bursts green, a wrong one red with a shake. */
  cut(p: Piece, ang: number, points: number) {
    const nx = -Math.sin(ang), ny = Math.cos(ang);
    for (const s of [1, -1] as const) {
      this.halves.push({ piece: p, x: p.x, y: p.y, vx: p.vx * 0.6 + nx * s * 70, vy: Math.min(p.vy, 0) * 0.3 + ny * s * 70 - 40, rot: p.rot, vr: s * 2.5, ang, side: s, life: 0 });
    }
    if (p.ok) {
      this.fx.burst(p.x, p.y, GAME_COLORS.good, 20);
      this.fx.burst(p.x, p.y, KHADAG, 10, 100);
      this.fx.ring(p.x, p.y);
      this.fx.float(p.x, p.y, `+${points}`);
      this.flash = { color: GAME_COLORS.good, t: 0.25 };
    } else {
      this.fx.burst(p.x, p.y, GAME_COLORS.bad, 18);
      this.flash = { color: GAME_COLORS.bad, t: 0.45 };
      if (!this.still) this.shake = 0.25;
    }
  }

  /** A right answer fell unsliced: its name floats up from the bottom. */
  missed(x: number, answer: GameAnswer) {
    this.fx.float(Math.max(60, Math.min(WORLD.w - 60, x)), WORLD.h - 40, `Алгассан: ${answerLabel(answer)}`, GAME_COLORS.gold, true);
  }

  update(dt: number) {
    this.time += dt;
    this.shake = Math.max(0, this.shake - dt);
    this.flash.t = Math.max(0, this.flash.t - dt);
    this.fx.update(dt);
    for (const p of this.trail) p.life += dt;
    this.trail = this.trail.filter((p) => p.life < 0.18);
    for (const h of this.halves) {
      h.life += dt;
      h.x += h.vx * dt;
      h.y += h.vy * dt;
      h.vy += GRAVITY * 1.4 * dt;
      h.rot += h.vr * dt;
    }
    this.halves = this.halves.filter((h) => h.life < 1.2 && h.y < WORLD.h + 80);
  }

  draw(ctx: CanvasRenderingContext2D, view: SliceView) {
    const { w: W, h: H } = WORLD;
    ctx.save();
    if (this.shake) ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
    if (this.dusk?.width && this.dusk.height) ctx.drawImage(this.dusk, 0, 0, W, H);
    if (!this.still) drawFireflies(ctx, this.time);
    if (this.flash.t) {
      ctx.globalAlpha = this.flash.t * 0.22;
      ctx.fillStyle = this.flash.color;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
    this.fx.drawRings(ctx);
    for (const h of this.halves) drawHalf(ctx, h);
    for (const p of view.pieces) drawPiece(ctx, p);
    drawTrail(ctx, this.trail);
    this.fx.draw(ctx, gameFont);
    // Gold frame while the slow, careful mode is on.
    if (view.slow && !view.paused) {
      ctx.strokeStyle = "rgba(255,207,90,.35)";
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, W - 6, H - 6);
    }
    if (view.paused) {
      ctx.fillStyle = "rgba(13,10,34,.4)";
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  }
}
