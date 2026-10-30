import { fitCanvas, startLoop, type Stage } from "../../_lib/canvas";
import { Effects } from "../../_lib/effects";
import { GAME_COLORS, gameFont } from "../../_lib/palette";
import { drawBoss, drawGate, drawHero, type GateLook } from "./drawActors";
import { drawScene } from "./drawScene";
import { BOSS_GAP, FEET_Y, FIGHT_GAP, FIRST_GATE, GATE_GAP, SPEED, W, heroScale, laneX, scaleAt, yAt } from "./world";

export type RunnerCallbacks = {
  /** The hero ran through gate `index` in `lane`; returns whether it was right and the new power. */
  onGate: (index: number, lane: number) => { ok: boolean; power: number };
  /** The next gate to answer changed; -1 once only the boss is left. */
  onNext: (index: number) => void;
  /** The fight with the boss is over. */
  onFinish: (won: boolean) => void;
};

type Phase = "idle" | "run" | "fight" | "done";

/** How long the fight plays, and when the blow lands. */
const FIGHT_TIME = 1.8;
const IMPACT = 0.7;

/** The lane runner: road, gates, hero and boss on a canvas, with lane switching by keys, taps and swipes. */
export class RunnerEngine {
  private stage: Stage;
  private stop: () => void;
  private fx = new Effects();
  private phase: Phase = "idle";
  private t = 0;
  /** Distance run so far. */
  private run = 0;
  private gates: GateLook[] = [];
  private next = 0;
  private lane = 1;
  private x = laneX(1);
  private power = 10;
  private shown = 10;
  private bossPower = 60;
  private hurt = 0;
  private fightT = 0;
  private won = false;
  private callbacks?: RunnerCallbacks;
  private swipeX: number | null = null;

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

  start(gates: Omit<GateLook, "hit">[], power: number, bossPower: number, callbacks: RunnerCallbacks) {
    this.gates = gates.map((g) => ({ ...g }));
    this.callbacks = callbacks;
    this.power = this.shown = power;
    this.bossPower = bossPower;
    this.run = 0;
    this.next = 0;
    this.lane = 1;
    this.x = laneX(1);
    this.hurt = 0;
    this.fightT = 0;
    this.fx.clear();
    this.phase = "run";
    callbacks.onNext(0);
  }

  /** Moves one lane left (−1) or right (+1). */
  move(dir: -1 | 1) {
    if (this.phase !== "run") return;
    this.lane = Math.max(0, Math.min(2, this.lane + dir));
  }

  private onDown = (e: PointerEvent) => {
    this.swipeX = e.clientX;
  };

  /** A swipe moves that way; a tap moves toward the tapped side of the hero. */
  private onUp = (e: PointerEvent) => {
    if (this.swipeX === null) return;
    const dx = e.clientX - this.swipeX;
    this.swipeX = null;
    if (Math.abs(dx) > 24) return this.move(dx > 0 ? 1 : -1);
    const rect = this.canvas.getBoundingClientRect();
    const tapX = ((e.clientX - rect.left) / rect.width) * W;
    if (Math.abs(tapX - this.x) > 20) this.move(tapX > this.x ? 1 : -1);
  };

  private gateAt = (i: number) => FIRST_GATE + i * GATE_GAP;
  private get bossAt() {
    return this.gateAt(this.gates.length - 1) + BOSS_GAP;
  }

  private frame(dt: number) {
    this.t += dt;
    this.x += (laneX(this.lane) - this.x) * Math.min(1, dt * 14);
    this.shown += (this.power - this.shown) * Math.min(1, dt * 6);
    this.hurt = Math.max(0, this.hurt - dt);

    // The road drifts slowly behind the start screen.
    if (this.phase === "idle") this.run += SPEED * 0.25 * dt;
    if (this.phase === "run") {
      this.run += SPEED * dt;
      // crossing the next gate
      if (this.next < this.gates.length && this.run >= this.gateAt(this.next)) {
        const lane = Math.round((this.x - laneX(0)) / (laneX(1) - laneX(0)));
        const { ok, power } = this.callbacks!.onGate(this.next, lane);
        this.gates[this.next].hit = { lane, ok };
        const gain = power - this.power;
        this.power = power;
        const hy = FEET_Y - 60 * heroScale(power);
        if (ok) {
          this.fx.burst(this.x, hy, GAME_COLORS.good, 26, 180);
          this.fx.ring(this.x, FEET_Y, GAME_COLORS.gold);
          this.fx.float(this.x, hy - 40, `+${gain}`, GAME_COLORS.gold, false, "lightning");
        } else {
          this.hurt = 0.5;
          this.fx.burst(this.x, hy, GAME_COLORS.bad, 18, 140);
          this.fx.float(this.x, hy - 40, `${gain}`, GAME_COLORS.bad, false, "lightning");
        }
        this.next++;
        this.callbacks!.onNext(this.next < this.gates.length ? this.next : -1);
      }
      if (this.run >= this.bossAt - FIGHT_GAP) {
        this.run = this.bossAt - FIGHT_GAP;
        this.phase = "fight";
        this.fightT = 0;
        this.won = this.power >= this.bossPower;
      }
    } else if (this.phase === "fight") {
      const before = this.fightT;
      this.fightT += dt;
      if (before < IMPACT && this.fightT >= IMPACT) {
        const bx = laneX(1, FIGHT_GAP), by = yAt(FIGHT_GAP) - 80 * scaleAt(FIGHT_GAP) * 3.2;
        this.fx.burst(bx, by, this.won ? GAME_COLORS.gold : GAME_COLORS.bad, 40, 240);
        this.fx.ring(bx, yAt(FIGHT_GAP), this.won ? GAME_COLORS.gold : GAME_COLORS.bad);
        if (this.won) this.fx.confetti(W / 2, 120);
        else this.hurt = 0.8;
      }
      if (this.fightT >= FIGHT_TIME) {
        this.phase = "done";
        this.callbacks!.onFinish(this.won);
      }
    }

    this.fx.update(dt);
    this.draw();
  }

  private draw() {
    const { ctx } = this.stage;
    const running = this.phase === "run" || this.phase === "idle";
    drawScene(ctx, this.run, this.t);

    // far things first: boss, then gates from far to near
    const bossD = this.bossAt - this.run;
    if (this.gates.length && bossD < 3000) {
      const after = Math.max(0, this.fightT - IMPACT);
      drawBoss(ctx, bossD, this.t, this.bossPower, {
        fall: this.won ? Math.min(1, after / 0.8) : 0,
        shake: this.fightT > IMPACT && this.fightT < IMPACT + 0.4 ? 1 : 0,
        laugh: this.phase === "done" && !this.won,
      });
    }
    for (let i = this.gates.length - 1; i >= 0; i--) {
      const d = this.gateAt(i) - this.run;
      if (d > -40 && d < 2600) drawGate(ctx, this.gates[i], d, this.t);
    }

    this.fx.drawRings(ctx);
    // the hero lunges at the boss during the fight
    const lunge = this.phase === "fight" ? Math.sin(Math.min(1, this.fightT / IMPACT) * Math.PI) * 60 : 0;
    const knock = !this.won && this.fightT > IMPACT ? Math.min(1, (this.fightT - IMPACT) / 0.3) * 30 : 0;
    drawHero(ctx, this.x, FEET_Y - lunge + knock, heroScale(this.shown), running ? this.t : this.t * 0.2, Math.round(this.power), {
      strong: this.gates.length > 0 && this.power >= this.bossPower,
      hurt: this.hurt,
    });
    this.fx.draw(ctx, gameFont);
  }
}
