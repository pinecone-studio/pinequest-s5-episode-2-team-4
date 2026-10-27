import { prefersReducedMotion, type Stage } from "../../_lib/canvas";
import { Effects } from "../../_lib/effects";
import { GAME_COLORS, gameFont } from "../../_lib/palette";
import { buildBackdrop, drawBackdrop, type Backdrop } from "./drawBackground";
import { drawFalcon } from "./drawFalcon";
import { drawGate, drawGround } from "./drawTrack";
import { lanes, nearestLane } from "./gates";
import { FALCON_X, WORLD, type Falcon, type Gate } from "./types";

export type FlightView = {
  falcon: Falcon;
  gates: Gate[];
  /** The next gate to fly through, if any. */
  next?: Gate;
  scroll: number;
  top: number;
  combo: number;
  /** Before the start: the falcon bobs in place and flaps slowly. */
  idle: boolean;
  paused: boolean;
};

/** Everything the player sees but the rules don't care about: backdrop, flashes, wing and blink, effects. */
export class FlightScene {
  readonly fx = new Effects();
  readonly still = prefersReducedMotion();
  time = 0;
  private backdrop?: Backdrop;
  private flash = { color: "", t: 0 };
  private shake = 0;
  private wing = 0;
  private blink = 2;

  resize(stage: Stage) {
    this.backdrop = buildBackdrop(stage);
  }

  flap() {
    this.wing = 1;
  }

  /** Right gap at `at`: green burst and ring, and the points over the falcon. */
  hitGood(at: { x: number; y: number }, falconY: number, points: number) {
    this.fx.burst(at.x, at.y, GAME_COLORS.good, 22);
    this.fx.ring(at.x, at.y);
    this.fx.float(FALCON_X + 10, falconY, `+${points}`);
    this.flash = { color: GAME_COLORS.good, t: 0.3 };
  }

  hitBad(at: { x: number; y: number }) {
    this.fx.burst(at.x, at.y, GAME_COLORS.bad, 18);
    this.flash = { color: GAME_COLORS.bad, t: 0.5 };
    if (!this.still) this.shake = 0.3;
  }

  update(dt: number, view: FlightView) {
    this.time += dt;
    for (const g of view.gates) if (g.pop) g.pop += dt;
    view.falcon.dizzy = Math.max(0, view.falcon.dizzy - dt * 0.5);
    this.shake = Math.max(0, this.shake - dt);
    this.flash.t = Math.max(0, this.flash.t - dt);
    this.wing = view.idle ? (Math.sin(this.time * 9) + 1) / 2 : Math.max(0, this.wing - dt * 3.5);
    this.blink = this.blink < -0.13 ? 2 + Math.random() * 3 : this.blink - dt;
    this.fx.update(dt);
    // Gold and magenta sparks behind the falcon while on a streak.
    if (!view.idle && !view.paused && view.combo >= 3 && !this.still && Math.random() < 0.6) {
      const color = Math.random() < 0.5 ? GAME_COLORS.gold : GAME_COLORS.magenta;
      this.fx.spark({ x: FALCON_X - 14, y: view.falcon.y + (Math.random() - 0.5) * 8, vx: -60 - Math.random() * 40, vy: (Math.random() - 0.5) * 20, max: 0.5, color, size: 2 + Math.random() * 2 });
    }
  }

  draw(ctx: CanvasRenderingContext2D, view: FlightView) {
    const { falcon, next } = view, all = lanes(view.top);
    ctx.save();
    if (this.shake) ctx.translate((Math.random() - 0.5) * 9, (Math.random() - 0.5) * 9);
    if (this.backdrop) drawBackdrop(ctx, this.backdrop, view.scroll, this.time, this.still);
    if (this.flash.t) {
      ctx.globalAlpha = this.flash.t * 0.22;
      ctx.fillStyle = this.flash.color;
      ctx.fillRect(0, 0, WORLD.w, WORLD.h);
      ctx.globalAlpha = 1;
    }
    // The gap the falcon is heading for lights up as the next gate comes close.
    const hot = next && next.x - FALCON_X < 190 ? (next.lane ?? nearestLane(all, falcon.y)) : -1;
    for (const g of view.gates) drawGate(ctx, g, all, view.top, g === next ? hot : -1);
    drawGround(ctx, view.scroll);
    this.fx.drawRings(ctx);
    const bad = this.flash.color === GAME_COLORS.bad && this.flash.t > 0;
    drawFalcon(ctx, falcon, {
      time: this.time, wing: this.wing, blinking: this.blink < 0, still: this.still,
      hurt: bad, glow: this.flash.color === GAME_COLORS.good && this.flash.t > 0,
      stunned: view.paused || falcon.dizzy > 0.6, crown: view.combo >= 3,
    });
    this.fx.draw(ctx, gameFont);
    if (view.paused) {
      ctx.fillStyle = "rgba(13,10,34,.4)";
      ctx.fillRect(0, 0, WORLD.w, WORLD.h);
    }
    ctx.restore();
  }
}
