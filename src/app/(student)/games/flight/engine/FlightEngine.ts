import type { GameQuestion } from "@/lib/types";
import { fitCanvas, startLoop, type Stage } from "../../_lib/canvas";
import { GAME_COLORS } from "../../_lib/palette";
import { pickRounds, pointsFor } from "../../_lib/session";
import { buildGates, lanes, nearestLane, steerIntoLane } from "./gates";
import { bindFlap } from "./input";
import { fly, hover, newFalcon } from "./movement";
import { FlightScene } from "./scene";
import { FALCON_R, FALCON_X, GATE_W, WORLD, type FlightEvents, type Gate } from "./types";

/** The flight game's rules: gates, score and streaks. React owns the screens around the canvas. */
export class FlightEngine {
  private stage: Stage;
  private scene = new FlightScene();
  private rounds: GameQuestion[] = [];
  private gates: Gate[] = [];
  private falcon = newFalcon(96);
  private stats = { score: 0, combo: 0, bestCombo: 0, mistakes: 0, missed: [] as GameQuestion[] };
  private running = false;
  private paused = false;
  private top = 96;
  private scroll = 0;
  private speed = 100;
  private shownRound = -1;
  /** Seconds until the banner moves on to the next task / until the session ends. */
  private taskIn = 0;
  private finishIn = 0;
  private stopLoop: () => void;
  private unbind: () => void;

  constructor(private canvas: HTMLCanvasElement, private events: FlightEvents) {
    this.stage = fitCanvas(canvas, WORLD.w);
    this.scene.resize(this.stage);
    this.unbind = bindFlap(canvas, () => this.running && !this.paused, () => this.flap());
    this.stopLoop = startLoop((dt) => this.frame(dt));
  }

  resize() {
    this.stage = fitCanvas(this.canvas, WORLD.w);
    this.scene.resize(this.stage);
  }

  /** Top of the flying area in world units, below the task banner. */
  setTop(top: number) {
    this.top = Math.max(80, top);
  }

  /** New session from these questions; the falcon waits until start(). */
  reset(questions: GameQuestion[]) {
    this.rounds = pickRounds(questions);
    this.gates = buildGates(this.stage.ctx, this.rounds);
    this.falcon = newFalcon(this.top);
    this.stats = { score: 0, combo: 0, bestCombo: 0, mistakes: 0, missed: [] };
    this.running = this.paused = false;
    this.scroll = this.taskIn = this.finishIn = 0;
    this.speed = 100;
    this.shownRound = -1;
    this.scene.fx.clear();
    this.showTask();
  }

  start() {
    this.running = true;
    this.falcon.vy = -200;
  }

  /** Continue after the explanation of a wrong gap. */
  resume() {
    if (!this.paused) return;
    this.paused = false;
    this.falcon.vy = -120;
    if (!this.next()) this.finishIn = 0.7;
  }

  destroy() {
    this.stopLoop();
    this.unbind();
  }

  private flap() {
    if (!this.running || this.paused) return;
    this.falcon.vy = -255;
    this.scene.flap();
    this.events.onFlap();
  }

  private next = () => this.gates.find((g) => !g.done);
  private marks = (round: number) => this.gates.filter((g) => g.round === round).map((g) => g.result ?? undefined);

  private showTask() {
    const round = this.next()?.round ?? this.rounds.length - 1;
    if (round !== this.shownRound) this.events.onTask((this.shownRound = round), this.rounds[round]);
    this.events.onMarks(this.marks(round));
  }

  private judge(g: Gate) {
    const lane = g.lane ?? 0, item = g.items[lane], question = this.rounds[g.round], s = this.stats, fx = this.scene.fx;
    const x = g.x + GATE_W / 2, y = lanes(this.top)[lane].c;
    Object.assign(g, { done: true, result: item.ok, pop: 0.001 });
    if (item.ok) {
      s.bestCombo = Math.max(s.bestCombo, ++s.combo);
      const points = pointsFor(s.combo);
      s.score += points;
      this.speed = Math.min(125, 100 + s.combo * 3);
      fx.burst(x, y, GAME_COLORS.good, 22);
      fx.ring(x, y);
      fx.float(FALCON_X + 10, this.falcon.y, `+${points}`);
      this.scene.hitGood();
    } else {
      s.combo = 0;
      s.mistakes++;
      if (!s.missed.includes(question)) s.missed.push(question);
      this.speed = 100;
      this.falcon.dizzy = 1;
      fx.burst(x, y, GAME_COLORS.bad, 18);
      this.scene.hitBad();
      // Freeze until the player has read why: no guessing through the explanation.
      this.paused = true;
      this.events.onWrong(item.answer, g.items.find((i) => i.ok)!.answer, question);
    }
    const mine = this.gates.filter((o) => o.round === g.round);
    if (mine.every((o) => o.done)) {
      if (mine.every((o) => o.result)) {
        s.score += 25;
        fx.confetti(WORLD.w / 2, WORLD.h * 0.45);
        this.events.onClean(question);
      }
      if (!this.next() && !this.paused) this.finishIn = 0.9;
    }
    this.events.onScore(s.score, s.combo);
    this.events.onMarks(this.marks(g.round));
    this.taskIn = item.ok ? 0.25 : 0.001;
  }

  private frame(dt: number) {
    for (const g of this.gates) if (g.pop) g.pop += dt;
    this.falcon.dizzy = Math.max(0, this.falcon.dizzy - dt * 0.5);
    const idle = !this.running;
    if (idle) {
      hover(this.falcon, this.scene.time, this.top);
      this.scroll += 30 * dt;
    } else if (!this.paused) this.play(dt);
    if (this.taskIn > 0 && (this.taskIn -= dt) <= 0) this.showTask();
    if (this.finishIn > 0 && (this.finishIn -= dt) <= 0) {
      this.running = false;
      const { score, mistakes, bestCombo, missed } = this.stats;
      this.events.onFinish({ score, mistakes, bestCombo, missed });
    }
    const view = { falcon: this.falcon, gates: this.gates, next: this.next(), scroll: this.scroll, top: this.top, combo: this.stats.combo, idle, paused: this.paused };
    this.scene.update(dt, view);
    this.scene.draw(this.stage.ctx, view);
  }

  private play(dt: number) {
    this.scroll += this.speed * dt;
    for (const g of this.gates) g.x -= this.speed * dt;
    if (fly(this.falcon, dt, this.top)) this.events.onBump();
    // Close to a gate the falcon commits to the nearest gap; the pillars steer it in.
    const g = this.next();
    if (!g) return;
    const all = lanes(this.top);
    if (g.lane === null && g.x - (FALCON_X + FALCON_R) < 26) g.lane = nearestLane(all, this.falcon.y);
    if (g.lane === null) return;
    if (steerIntoLane(this.falcon, all[g.lane], dt)) this.events.onBump();
    if (g.x + GATE_W < FALCON_X - FALCON_R) this.judge(g);
  }
}
