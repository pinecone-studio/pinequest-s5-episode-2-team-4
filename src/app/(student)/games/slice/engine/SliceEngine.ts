import type { GameQuestion } from "@/lib/types";
import { fitCanvas, startLoop, type Stage } from "../../_lib/canvas";
import { RetryQueue } from "../../_lib/retry";
import { SessionScore } from "../../_lib/score";
import { ROUNDS } from "../../_lib/session";
import { bindBlade, firstHit } from "./blade";
import { CarefulMode } from "./careful";
import { SliceScene } from "./scene";
import { WORLD, type Piece, type SliceEvents, type Wave } from "./types";
import { planWave, stepWave } from "./waves";

/** The slice game's rules: waves, slicing, guessing, repeats and score. React owns the screens around the canvas. */
export class SliceEngine {
  private stage!: Stage;
  private scene = new SliceScene();
  private queue!: RetryQueue;
  private score = new SessionScore();
  private careful: CarefulMode;
  private wave: Wave | null = null;
  private pieces: Piece[] = [];
  private running = false;
  private paused = false;
  private between = 0;
  /** Stops the loop and removes the input listeners. */
  private stop: () => void;

  constructor(private canvas: HTMLCanvasElement, private events: SliceEvents) {
    this.resize();
    this.careful = new CarefulMode(events.onSlow);
    const unbind = bindBlade(canvas, () => this.stage.scale, () => this.running && !this.paused, {
      point: (p) => this.scene.addTrail(p.x, p.y),
      segment: (a, b) => {
        const hit = firstHit(a, b, this.pieces);
        if (hit) this.cut(hit.piece, hit.ang);
      },
      swish: () => events.onSwipe(),
    });
    const stopLoop = startLoop((dt) => this.frame(dt));
    this.stop = () => (stopLoop(), unbind());
  }

  resize() {
    this.stage = fitCanvas(this.canvas, WORLD.w);
    this.scene.resize(this.stage);
  }

  /** New session from these questions; the first task shows, and waves start with start(). */
  reset(questions: GameQuestion[]) {
    this.queue = new RetryQueue(questions);
    this.score = new SessionScore();
    this.between = 0;
    this.wave = null;
    this.pieces = [];
    this.running = this.paused = false;
    this.scene.clear();
    this.careful.reset();
    this.events.onRound(this.queue.peek()!, 0);
    this.events.onMarks([]);
  }

  start() {
    this.running = true;
    this.startWave();
  }

  /** Continue after the explanation of a wrong slice. */
  resume() {
    this.paused = false;
  }

  destroy() {
    this.stop();
  }

  private startWave() {
    const round = this.queue.next();
    if (!round) return this.finish();
    this.wave = { round, t: 0, plan: planWave(round.question), wrongCuts: 0, marks: [] };
    this.events.onRound(round, Math.min(this.queue.done, ROUNDS - 1));
    this.events.onMarks([]);
  }

  private cut(p: Piece, ang: number) {
    const w = this.wave, s = this.score;
    if (!w) return;
    p.alive = false;
    if (p.ok) {
      this.scene.cut(p, ang, s.right());
      w.marks.push(true);
    } else {
      s.wrong(w.round.question);
      w.wrongCuts++;
      this.scene.cut(p, ang, 0);
      const guess = this.careful.check(this.scene.time - p.born, w.wrongCuts);
      this.paused = true;
      this.events.onWrong(p.answer, w.round.question, guess);
    }
    this.events.onScore(s.score, s.combo);
    this.events.onMarks([...w.marks]);
  }

  /** A right answer fell unsliced: the streak ends and the task won't count as clean. */
  private miss(p: Piece, w: Wave) {
    this.score.miss(w.round.question);
    w.marks.push(false);
    this.scene.missed(p.x, p.answer);
    this.events.onMiss(p.answer);
    this.events.onScore(this.score.score, 0);
    this.events.onMarks([...w.marks]);
  }

  private endWave(w: Wave) {
    const clean = w.marks.filter(Boolean).length === 3 && w.wrongCuts === 0;
    this.queue.finish(w.round, clean);
    if (clean) {
      this.score.score += 25;
      this.scene.fx.confetti(WORLD.w / 2, WORLD.h * 0.45);
      this.events.onScore(this.score.score, this.score.combo);
    }
    this.events.onTaskDone(w.round.question, w.round.retry, clean);
    this.wave = null;
    this.between = 2.2;
  }

  private finish() {
    this.running = false;
    const { guesses } = this.careful;
    this.careful.reset();
    this.events.onFinish({ ...this.score.summary, retry: this.queue.stats, guesses });
  }

  private frame(dt: number) {
    this.scene.update(dt);
    if (this.running && !this.paused) this.play(dt);
    this.scene.draw(this.stage.ctx, { pieces: this.pieces, slow: this.careful.on, paused: this.paused });
  }

  private play(raw: number) {
    const dt = this.careful.tick(raw), w = this.wave;
    if (!w) {
      if (this.between > 0 && (this.between -= raw) <= 0) this.startWave();
      return;
    }
    const step = stepWave(w, this.pieces, dt, this.stage.ctx, this.scene.time, this.events.onToss);
    this.pieces = step.pieces;
    for (const p of step.missed) this.miss(p, w);
    if (step.done) this.endWave(w);
  }
}
