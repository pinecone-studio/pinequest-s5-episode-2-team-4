import { prefersReducedMotion, type Stage } from "../../_lib/canvas";
import { Effects } from "../../_lib/effects";
import { GAME_COLORS, gameFont } from "../../_lib/palette";
import { buildFloor, drawFood, drawLights, makeOrbs, moveOrbs } from "./drawScene";
import { clearShadeCache, drawSnake, SPACING } from "./drawSnake";
import { WORLD, type Food, type Snake, type SnakeSkin } from "./types";

export type SceneView = {
  snake: Snake;
  foods: Food[];
  skin: SnakeSkin;
  combo: number;
  showFoods: boolean;
  paused: boolean;
};

/** Everything the player sees but the rules don't care about: floor, lights, flashes, blinking, effects. */
export class SnakeScene {
  readonly fx = new Effects();
  readonly still = prefersReducedMotion();
  time = 0;
  private floor?: HTMLCanvasElement;
  private orbs = makeOrbs();
  private flash = { color: "", t: 0 };
  private shake = 0;
  private blink = 3;
  private tongue = 1.5;

  resize(stage: Stage) {
    clearShadeCache();
    this.floor = buildFloor(stage);
  }

  hitGood() {
    this.flash = { color: GAME_COLORS.good, t: 0.35 };
  }

  hitBad() {
    this.flash = { color: GAME_COLORS.bad, t: 0.5 };
    if (!this.still) this.shake = 0.3;
  }

  update(dt: number, view: SceneView, moving: boolean) {
    this.time += dt;
    this.shake = Math.max(0, this.shake - dt);
    this.flash.t = Math.max(0, this.flash.t - dt);
    this.blink = this.blink < -0.14 ? 2.5 + Math.random() * 2.5 : this.blink - dt;
    this.tongue = this.tongue < -0.3 ? 1.4 + Math.random() * 2 : this.tongue - dt;
    this.fx.update(dt);
    if (this.still) return;
    moveOrbs(this.orbs, dt);
    // Sparks from the tail while on a streak.
    if (moving && view.combo >= 3 && Math.random() < 0.5) {
      const { trail, length } = view.snake;
      const tail = trail[Math.min(trail.length - 1, Math.round(length * SPACING * 0.95))];
      const color = Math.random() < 0.5 ? GAME_COLORS.gold : view.skin.bands[0];
      this.fx.spark({ x: tail.x, y: tail.y, vx: (Math.random() - 0.5) * 20, vy: -30, max: 0.6, color, size: 3 });
    }
  }

  draw(ctx: CanvasRenderingContext2D, view: SceneView) {
    const { snake, foods, skin } = view;
    ctx.save();
    if (this.shake) ctx.translate((Math.random() - 0.5) * 9, (Math.random() - 0.5) * 9);
    if (this.floor) ctx.drawImage(this.floor, 0, 0, WORLD.w, WORLD.h);
    drawLights(ctx, this.orbs, [skin.bands[0], skin.bands[skin.bands.length - 1]], this.time);
    if (this.flash.t) {
      ctx.globalAlpha = this.flash.t * 0.25;
      ctx.fillStyle = this.flash.color;
      ctx.fillRect(0, 0, WORLD.w, WORLD.h);
      ctx.globalAlpha = 1;
    }
    this.fx.drawRings(ctx);
    if (view.showFoods) for (const f of foods) drawFood(ctx, f, this.time, this.still);
    const good = this.flash.color === GAME_COLORS.good && this.flash.t > 0;
    drawSnake(ctx, snake, {
      skin,
      time: this.time,
      paused: view.paused,
      hurt: this.flash.color === GAME_COLORS.bad && this.flash.t > 0,
      glow: this.still ? null : good ? GAME_COLORS.good : view.combo >= 3 ? skin.bands[0] : null,
      blinking: this.blink < 0,
      tongue: this.tongue < 0,
      crown: view.combo >= 3,
      target: foods.find((f) => !f.dying && f.near > 0.55),
    });
    this.fx.draw(ctx, gameFont);
    if (view.paused) {
      ctx.fillStyle = "rgba(13,10,34,.45)";
      ctx.fillRect(0, 0, WORLD.w, WORLD.h);
    }
    ctx.restore();
  }
}
