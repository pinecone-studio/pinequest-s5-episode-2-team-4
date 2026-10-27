import type { GameAnswer } from "@/lib/types";
import { fitCanvas, startLoop, toWorld, type Stage } from "../../_lib/canvas";
import { Effects } from "../../_lib/effects";
import { GAME_COLORS, gameFont } from "../../_lib/palette";
import { KITS, SPOT, W, ZONES, drawBall, drawGoal, drawKeeper, drawShooter, drawStadium, drawZones, zoneAt } from "./draw";

export type PenaltyCallbacks = {
  /** The player kicked at `zone`; returns the zone with the right answer. */
  onKick: (zone: number) => number;
  /** A kick (either side's) has finished playing. */
  onDone: () => void;
};

type Mode =
  | { kind: "idle" }
  | { kind: "aim"; choices: GameAnswer[]; pick: number | null }
  | { kind: "kick"; choices: GameAnswer[]; zone: number; right: number; t: number }
  | { kind: "runup"; t: number; seconds: number }
  | { kind: "shot"; zone: number; saved: boolean; t: number };

/** How long a kick flies, and how long it stays on screen after. */
const FLIGHT = 0.5;
const SHOW = 1.4;

/** Penalty shootout: the player kicks at a corner, or keeps goal against the bot's kick. */
export class PenaltyEngine {
  private stage: Stage;
  private stop: () => void;
  private fx = new Effects();
  private t = 0;
  private mode: Mode = { kind: "idle" };
  private swipe: { x: number; y: number } | null = null;
  private callbacks?: PenaltyCallbacks;

  constructor(private canvas: HTMLCanvasElement) {
    this.stage = fitCanvas(canvas, W);
    canvas.addEventListener("pointerdown", this.onDown);
    canvas.addEventListener("pointermove", this.onMove);
    canvas.addEventListener("pointerup", this.onUp);
    this.stop = startLoop((dt) => this.frame(dt));
  }

  resize() {
    this.stage = fitCanvas(this.canvas, W);
  }

  destroy() {
    this.stop();
    this.canvas.removeEventListener("pointerdown", this.onDown);
    this.canvas.removeEventListener("pointermove", this.onMove);
    this.canvas.removeEventListener("pointerup", this.onUp);
  }

  setCallbacks(callbacks: PenaltyCallbacks) {
    this.callbacks = callbacks;
  }

  /** The player's kick: corners show the answers; swipe or tap to kick. */
  attack(choices: GameAnswer[]) {
    this.mode = { kind: "aim", choices, pick: null };
  }

  /** The bot runs up for `seconds` while the player answers. */
  defend(seconds: number) {
    this.mode = { kind: "runup", t: 0, seconds };
  }

  /** The bot shoots now; the player's keeper saves it or not. */
  shoot(saved: boolean) {
    if (this.mode.kind !== "runup") return;
    this.mode = { kind: "shot", zone: Math.floor(Math.random() * 4), saved, t: 0 };
  }

  private point(e: PointerEvent) {
    return toWorld(this.canvas, this.stage.scale, e);
  }

  private onDown = (e: PointerEvent) => {
    if (this.mode.kind !== "aim") return;
    this.swipe = this.point(e);
    const zone = zoneAt(this.swipe.x, this.swipe.y);
    if (zone >= 0) this.mode.pick = zone;
  };

  private onMove = (e: PointerEvent) => {
    if (this.mode.kind !== "aim") return;
    const p = this.point(e);
    // Hovering (or dragging over) a corner lights it.
    const zone = zoneAt(p.x, p.y);
    this.mode.pick = zone >= 0 ? zone : null;
  };

  /** A tap on a corner kicks there; a swipe up from the ball kicks where it points. */
  private onUp = (e: PointerEvent) => {
    const start = this.swipe;
    this.swipe = null;
    if (this.mode.kind !== "aim" || !start) return;
    const p = this.point(e);
    let zone = zoneAt(p.x, p.y);
    if (zone < 0 && start.y - p.y > 30) {
      // Extend the swipe up to the goal and see which corner it reaches.
      const k = (start.y - ZONES[0].cy - 20) / Math.max(1, start.y - p.y);
      const x = start.x + (p.x - start.x) * k;
      const high = start.y - p.y > 140;
      zone = (high ? 0 : 2) + (x >= W / 2 ? 1 : 0);
    }
    if (zone < 0) return;
    this.kick(zone);
  };

  /** Kicks at a corner (also used by the keys 1–4). */
  kick(zone: number) {
    if (this.mode.kind !== "aim" || !this.callbacks) return;
    const right = this.callbacks.onKick(zone);
    this.mode = { kind: "kick", choices: this.mode.choices, zone, right, t: 0 };
  }

  private frame(dt: number) {
    this.t += dt;
    const m = this.mode;
    if (m.kind === "kick" || m.kind === "shot") {
      const before = m.t;
      m.t += dt;
      if (before < FLIGHT && m.t >= FLIGHT) this.landed();
      if (m.t >= FLIGHT + SHOW) {
        this.mode = { kind: "idle" };
        this.callbacks?.onDone();
      }
    } else if (m.kind === "runup") {
      m.t = Math.min(m.seconds, m.t + dt);
    }
    this.fx.update(dt);
    this.draw();
  }

  /** The ball arrives: goal or save, with its effects. */
  private landed() {
    const m = this.mode;
    if (m.kind !== "kick" && m.kind !== "shot") return;
    const z = ZONES[m.zone];
    const goal = m.kind === "kick" ? m.zone === m.right : !m.saved;
    if (goal) {
      this.fx.burst(z.cx, z.cy, GAME_COLORS.gold, 34, 220);
      this.fx.float(z.cx, z.cy - 20, "ГООЛ!", m.kind === "kick" ? GAME_COLORS.gold : GAME_COLORS.bad);
      if (m.kind === "kick") this.fx.confetti(W / 2, 40);
    } else {
      this.fx.ring(z.cx, z.cy, GAME_COLORS.ink);
      this.fx.float(z.cx, z.cy - 20, "Барьчихлаа!", m.kind === "shot" ? GAME_COLORS.good : GAME_COLORS.bad);
    }
  }

  private draw() {
    const { ctx } = this.stage;
    const m = this.mode;
    drawStadium(ctx, this.t);
    drawGoal(ctx);

    if (m.kind === "aim") drawZones(ctx, m.choices, this.t, m.pick);
    if (m.kind === "kick") drawZones(ctx, m.choices, this.t, null, { zone: m.zone, right: m.right });

    // keeper: the bot when the player kicks, the player when the bot kicks
    const kit = m.kind === "runup" || m.kind === "shot" ? KITS.you : KITS.bot;
    if (m.kind === "kick" || m.kind === "shot") {
      const z = ZONES[m.zone];
      const saves = m.kind === "kick" ? m.zone !== m.right : m.saved;
      // A saving keeper dives at the ball; otherwise the other way.
      const target = saves ? z : ZONES[(m.zone % 2 ? m.zone - 1 : m.zone + 1)];
      const dive = Math.min(1, m.t / (FLIGHT * (saves ? 0.9 : 1.1)));
      drawKeeper(ctx, kit, this.t, dive, target.cx, target.cy);
    } else drawKeeper(ctx, kit, this.t, 0, 0, 0);

    if (m.kind === "runup") drawShooter(ctx, m.t / m.seconds, this.t);

    // the ball: on the spot, or flying to its corner
    if (m.kind === "kick" || m.kind === "shot") {
      const z = ZONES[m.zone];
      const saves = m.kind === "kick" ? m.zone !== m.right : m.saved;
      const f = Math.min(1, m.t / FLIGHT);
      const e = 1 - (1 - f) * (1 - f);
      // A saved ball bounces back out a little.
      const back = saves && m.t > FLIGHT ? Math.min(1, (m.t - FLIGHT) / 0.4) : 0;
      const x = SPOT.x + (z.cx - SPOT.x) * e;
      const y = SPOT.y + (z.cy - SPOT.y) * e - Math.sin(f * Math.PI) * 40 + back * 70;
      drawBall(ctx, x, y, 1 - 0.45 * e + back * 0.2, this.t * 12 * (1 - f));
    } else drawBall(ctx, SPOT.x, SPOT.y, 1, 0);

    if (m.kind === "aim") {
      ctx.fillStyle = "rgb(246 243 255 / 0.85)";
      ctx.font = gameFont(700, 13);
      ctx.textAlign = "center";
      ctx.fillText("Зөв хариулттай булан руу өшиглө", W / 2, SPOT.y + 50);
    }
    this.fx.drawRings(ctx);
    this.fx.draw(ctx, gameFont);
  }
}
