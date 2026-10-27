import type { GameAnswer } from "@/lib/types";
import { fitCanvas, startLoop, toWorld, type Stage } from "../../_lib/canvas";
import { Effects } from "../../_lib/effects";
import { GAME_COLORS, gameFont } from "../../_lib/palette";
import { BALL_R, BALL_REST, BOARD, FAR, H, RIM_HALF, RIM_Y, W, drawBall, drawBoard, drawCourt, drawRimBack, drawRimFront } from "./draw";

export type HoopsCallbacks = {
  /** A shot is over: in the basket or not. */
  onShot: (scored: boolean) => void;
  /** The ball was thrown away instead of shot. */
  onDiscard: () => void;
};

type Ball = {
  answer: GameAnswer;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** 0 at rest, 1 at the hoop's plane. */
  z: number;
  t: number;
  spin: number;
  state: "rolling-in" | "ready" | "flying" | "discarded";
  scored: boolean;
  /** Reached the hoop's plane (board and rim collide from then on). */
  atPlane: boolean;
};

const GRAVITY = 1500;
/** Seconds of flight to reach the hoop's plane. */
const TO_PLANE = 0.55;
const RIM_DOT = 4;
const BOUNCE = 0.5;
/** Share of the way the throw is nudged toward the hoop, to be kind to small hands. */
const AIM_HELP = 0.5;

/** Swipe basketball: swipe the ball up to shoot it at the hoop, or down to throw it away. */
export class HoopsEngine {
  private stage: Stage;
  private stop: () => void;
  private fx = new Effects();
  private t = 0;
  private ball: Ball | null = null;
  private hoopX = W / 2;
  private moving = false;
  private swish = 0;
  private drag: { x: number; y: number; t: number } | null = null;
  private callbacks?: HoopsCallbacks;

  constructor(private canvas: HTMLCanvasElement) {
    this.stage = fitCanvas(canvas, W);
    canvas.addEventListener("pointerdown", this.onDown);
    canvas.addEventListener("pointerup", this.onUp);
    this.stop = startLoop((dt) => this.frame(dt));
  }

  resize() {
    this.stage = fitCanvas(this.canvas, W);
  }

  destroy() {
    this.stop();
    this.canvas.removeEventListener("pointerdown", this.onDown);
    this.canvas.removeEventListener("pointerup", this.onUp);
  }

  setCallbacks(callbacks: HoopsCallbacks) {
    this.callbacks = callbacks;
  }

  /** The hoop slides from side to side once this is on. */
  setMoving(on: boolean) {
    this.moving = on;
  }

  /** Rolls in the next ball, or clears it with null. */
  serve(answer: GameAnswer | null) {
    this.ball = answer
      ? { answer, x: W + BALL_R * 2, y: BALL_REST.y, vx: 0, vy: 0, z: 0, t: 0, spin: 0, state: "rolling-in", scored: false, atPlane: false }
      : null;
  }

  /** Throws the ready ball away (the «Хаях» button). */
  discard() {
    const b = this.ball;
    if (!b || b.state !== "ready") return;
    b.state = "discarded";
    b.vx = -900;
    this.callbacks?.onDiscard();
  }

  private onDown = (e: PointerEvent) => {
    const b = this.ball;
    if (!b || b.state !== "ready") return;
    const p = toWorld(this.canvas, this.stage.scale, e);
    this.drag = { ...p, t: performance.now() };
  };

  private onUp = (e: PointerEvent) => {
    const b = this.ball, start = this.drag;
    this.drag = null;
    if (!b || !start || b.state !== "ready") return;
    const p = toWorld(this.canvas, this.stage.scale, e);
    const dt = Math.max(0.06, (performance.now() - start.t) / 1000);
    const dx = p.x - start.x, dy = p.y - start.y;
    if (dy > 40 && Math.abs(dy) > Math.abs(dx)) return this.discard();
    if (dy > -30) return;
    this.shoot(dx / dt, dy / dt);
  };

  private shoot(svx: number, svy: number) {
    const b = this.ball!;
    // A longer, faster swipe throws higher; the range keeps every throw above the rim.
    const vy = -Math.max(980, Math.min(1300, -svy * 0.55));
    // Time to come back down through the rim with this vy (y0 + vy·t + g/2·t² = rim),
    // then nudge vx toward the hoop.
    const a = GRAVITY / 2, c = b.y - RIM_Y;
    const tDown = (-vy + Math.sqrt(Math.max(0, vy * vy - 4 * a * c))) / (2 * a);
    const aim = (this.hoopX - b.x) / tDown;
    const vx = Math.max(-520, Math.min(520, svx * 0.45));
    b.vx = vx + (aim - vx) * AIM_HELP;
    b.vy = vy;
    b.state = "flying";
    b.t = 0;
  }

  private frame(dt: number) {
    this.t += dt;
    if (this.moving) this.hoopX = W / 2 + Math.sin(this.t * 1.1) * 92;
    else this.hoopX += (W / 2 - this.hoopX) * Math.min(1, dt * 3);
    this.swish = Math.max(0, this.swish - dt * 2.5);
    const b = this.ball;
    if (b) this.move(b, dt);
    this.fx.update(dt);
    this.draw();
  }

  private move(b: Ball, dt: number) {
    if (b.state === "rolling-in") {
      b.x += (BALL_REST.x - b.x) * Math.min(1, dt * 9);
      b.spin -= dt * 8;
      if (Math.abs(b.x - BALL_REST.x) < 1) {
        b.x = BALL_REST.x;
        b.state = "ready";
      }
      return;
    }
    if (b.state === "ready") {
      b.y = BALL_REST.y + Math.sin(this.t * 4) * 3;
      return;
    }
    if (b.state === "discarded") {
      b.x += b.vx * dt;
      b.spin -= dt * 14;
      if (b.x < -BALL_R * 2) this.ball = null;
      return;
    }

    // flying
    b.t += dt;
    b.z = Math.min(1, b.t / TO_PLANE);
    const prevY = b.y;
    b.vy += GRAVITY * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.spin += dt * 9;
    const r = BALL_R * (1 - (1 - FAR) * b.z);

    if (b.z >= 1) {
      // Arriving at the hoop's plane over the board: it banks off the glass.
      if (!b.atPlane) {
        b.atPlane = true;
        if (Math.abs(b.x - this.hoopX) < BOARD.halfW && b.y > BOARD.top && b.y < BOARD.bottom) {
          b.vx *= 0.4;
          b.vy = Math.max(b.vy, 0) * 0.4;
          this.fx.ring(b.x, b.y, GAME_COLORS.ink);
        }
      }
      // rim edges
      for (const rx of [this.hoopX - RIM_HALF, this.hoopX + RIM_HALF]) {
        const dx = b.x - rx, dy = b.y - RIM_Y, d = Math.hypot(dx, dy);
        if (d < r + RIM_DOT && d > 0) {
          const nx = dx / d, ny = dy / d, dot = b.vx * nx + b.vy * ny;
          if (dot < 0) {
            b.vx -= (1 + BOUNCE) * dot * nx;
            b.vy -= (1 + BOUNCE) * dot * ny;
          }
          b.x = rx + nx * (r + RIM_DOT);
          b.y = RIM_Y + ny * (r + RIM_DOT);
        }
      }
      // through the hoop, going down
      if (!b.scored && prevY < RIM_Y && b.y >= RIM_Y && b.vy > 0 && Math.abs(b.x - this.hoopX) < RIM_HALF - r * 0.35) {
        b.scored = true;
        b.vx *= 0.3;
        this.swish = 1;
        this.fx.burst(this.hoopX, RIM_Y + 30, GAME_COLORS.gold, 30, 200);
        this.fx.float(this.hoopX, RIM_Y - 30, "SWISH!", GAME_COLORS.gold);
      }
    }

    if (b.y > H + BALL_R || b.t > 3) {
      this.ball = null;
      this.callbacks?.onShot(b.scored);
    }
  }

  private draw() {
    const { ctx } = this.stage;
    drawCourt(ctx, this.t);
    drawBoard(ctx, this.hoopX);
    drawRimBack(ctx, this.hoopX);
    this.fx.drawRings(ctx);
    const b = this.ball;
    // A ball still in front of the hoop goes over it; at the hoop it goes behind the net.
    const behind = b && b.state === "flying" && b.z >= 1;
    if (b && behind) this.drawTheBall(b);
    drawRimFront(ctx, this.hoopX, this.swish);
    if (b && !behind) this.drawTheBall(b);
    if (b?.state === "ready") {
      ctx.fillStyle = "rgb(246 243 255 / 0.7)";
      ctx.font = gameFont(700, 12);
      ctx.textAlign = "center";
      ctx.fillText("↑ шид · ↓ хая", BALL_REST.x, BALL_REST.y + BALL_R + 26);
    }
    this.fx.draw(ctx, gameFont);
  }

  private drawTheBall(b: Ball) {
    drawBall(this.stage.ctx, b.x, b.y, 1 - (1 - FAR) * b.z, b.spin, b.answer);
  }
}
