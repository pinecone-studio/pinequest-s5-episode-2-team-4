import type { GameQuestion } from "@/lib/types";
import { fitCanvas, startLoop, type Stage } from "../../_lib/canvas";
import { SessionScore } from "../../_lib/score";
import { pickRounds } from "../../_lib/session";
import { approachGate, buildGates, lanes } from "./gates";
import { bindFlap } from "./input";
import { fly, hover, newFalcon } from "./movement";
import { FlightScene } from "./scene";
import { GATE_W, WORLD, type FlightEvents, type Gate } from "./types";

/** The flight game's rules: gates, score and streaks. React owns the screens around the canvas. */
export class FlightEngine {
  private stage!: Stage;
  private scene = new FlightScene();
  private rounds: GameQuestion[] = [];
  private gates: Gate[] = [];
  private falcon = newFalcon(96);
  private stats = new SessionScore();
  private running = false;
  private paused = false;
  private top = 96;
  private scroll = 0;
  private speed = 100;
  private shownRound = -1;
  /** Seconds until the banner moves on to the next task / until the session ends. */
  private taskIn = 0;
  private finishIn = 0;
  /** Stops the loop and removes the input listeners. */
  private stop: () => void;

  constructor(private canvas: HTMLCanvasElement, private events: FlightEvents) {
    this.resize();
    const unbind = bindFlap(canvas, () => this.running && !this.paused, () => this.flap());
    const stopLoop = startLoop((dt) => this.frame(dt));
    this.stop = () => (stopLoop(), unbind());
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
    this.stats = new SessionScore();
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
    this.stop();
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
    const lane = g.lane ?? 0, item = g.items[lane], question = this.rounds[g.round], s = this.stats;
    const at = { x: g.x + GATE_W / 2, y: lanes(this.top)[lane].c };
    Object.assign(g, { done: true, result: item.ok, pop: 0.001 });
    if (item.ok) {
      this.scene.hitGood(at, this.falcon.y, s.right());
      this.speed = Math.min(125, 100 + s.combo * 3);
    } else {
      s.wrong(question);
      this.speed = 100;
      this.falcon.dizzy = 1;
      this.scene.hitBad(at);
      // Freeze until the player has read why: no guessing through the explanation.
      this.paused = true;
      this.events.onWrong(item.answer, g.items.find((i) => i.ok)!.answer, question);
    }
    const mine = this.gates.filter((o) => o.round === g.round);
    if (mine.every((o) => o.done)) {
      if (mine.every((o) => o.result)) {
        s.score += 25;
        this.scene.fx.confetti(WORLD.w / 2, WORLD.h * 0.45);
        this.events.onClean(question);
      }
      if (!this.next() && !this.paused) this.finishIn = 0.9;
    }
    this.events.onScore(s.score, s.combo);
    this.events.onMarks(this.marks(g.round));
    this.taskIn = item.ok ? 0.25 : 0.001;
  }

  private frame(dt: number) {
    const idle = !this.running;
    if (idle) {
      hover(this.falcon, this.scene.time, this.top);
      this.scroll += 30 * dt;
    } else if (!this.paused) this.play(dt);
    if (this.taskIn > 0 && (this.taskIn -= dt) <= 0) this.showTask();
    if (this.finishIn > 0 && (this.finishIn -= dt) <= 0) {
      this.running = false;
      this.events.onFinish(this.stats.summary);
    }
    const view = { falcon: this.falcon, gates: this.gates, next: this.next(), scroll: this.scroll, top: this.top, combo: this.stats.combo, idle, paused: this.paused };
    this.scene.update(dt, view);
    this.scene.draw(this.stage.ctx, view);
  }

  private play(dt: number) {
    this.scroll += this.speed * dt;
    for (const g of this.gates) g.x -= this.speed * dt;
    if (fly(this.falcon, dt, this.top)) this.events.onBump();
    const g = this.next(), step = g && approachGate(g, this.falcon, lanes(this.top), dt);
    if (step?.bumped) this.events.onBump();
    if (g && step?.passed) this.judge(g);
  }
}
