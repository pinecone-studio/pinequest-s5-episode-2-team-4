import type { GameQuestion } from "@/lib/types";
import { fitCanvas, startLoop, type Stage } from "../../_lib/canvas";
import { GAME_COLORS } from "../../_lib/palette";
import { pickRounds, pointsFor } from "../../_lib/session";
import { placeFoods } from "./foods";
import { moveSnake, newSnake } from "./movement";
import { SnakeScene } from "./scene";
import { SKINS } from "./skins";
import { Steering } from "./steering";
import { WORLD, type Food, type SnakeEvents, type SnakeSkin } from "./types";

/** The snake game's rules: rounds, eating, score and streaks. React owns the screens around the canvas. */
export class SnakeEngine {
  skin: SnakeSkin = SKINS[0];
  private stage: Stage;
  private scene = new SnakeScene();
  private steering = new Steering();
  private snake = newSnake();
  private foods: Food[] = [];
  private rounds: GameQuestion[] = [];
  private round = 0;
  private found = 0;
  private slipsThisRound = 0;
  private stats = { score: 0, combo: 0, bestCombo: 0, mistakes: 0, missed: [] as GameQuestion[] };
  private running = false;
  private paused = false;
  private top = 90;
  private nextRoundIn = 0;
  private stopLoop: () => void;
  private unbind: () => void;

  constructor(private canvas: HTMLCanvasElement, private events: SnakeEvents) {
    this.stage = fitCanvas(canvas, WORLD.w);
    this.scene.resize(this.stage);
    this.unbind = this.steering.bind(canvas, () => this.stage.scale, () => this.running && !this.paused);
    this.stopLoop = startLoop((dt) => this.frame(dt));
  }

  resize() {
    this.stage = fitCanvas(this.canvas, WORLD.w);
    this.scene.resize(this.stage);
  }

  /** Top of the playable area in world units, below the task banner. */
  setTop(top: number) {
    this.top = Math.max(70, top);
  }

  /** New session from these questions; the snake waits until start(). */
  reset(questions: GameQuestion[]) {
    this.rounds = pickRounds(questions);
    this.round = 0;
    this.stats = { score: 0, combo: 0, bestCombo: 0, mistakes: 0, missed: [] };
    this.running = this.paused = false;
    this.nextRoundIn = 0;
    this.scene.fx.clear();
    this.snake = newSnake();
    this.beginRound();
  }

  start() {
    this.running = true;
  }

  /** Continue after the explanation of a wrong answer. */
  resume() {
    this.paused = false;
  }

  destroy() {
    this.stopLoop();
    this.unbind();
  }

  private beginRound() {
    this.found = this.slipsThisRound = 0;
    const question = this.rounds[this.round];
    this.events.onRound(this.round, question);
    this.events.onFound(0);
    this.foods = placeFoods(this.stage.ctx, question, this.snake, this.top, this.scene.time);
  }

  private eat(f: Food) {
    f.dying = 0.001;
    const s = this.stats, question = this.rounds[this.round], fx = this.scene.fx;
    if (f.ok) {
      this.found++;
      s.combo++;
      s.bestCombo = Math.max(s.bestCombo, s.combo);
      const points = pointsFor(s.combo);
      s.score += points;
      this.snake.length += 8;
      fx.burst(f.x, f.y, GAME_COLORS.good, 20);
      fx.ring(f.x, f.y);
      fx.float(f.x, f.y, `+${points}`);
      this.scene.hitGood();
      if (this.found === 3) this.finishRound(question);
    } else {
      s.combo = 0;
      s.mistakes++;
      this.slipsThisRound++;
      if (!s.missed.includes(question)) s.missed.push(question);
      this.snake.length = Math.max(16, this.snake.length - 8);
      fx.burst(f.x, f.y, GAME_COLORS.bad, 16);
      fx.float(f.x, f.y, "−5", GAME_COLORS.bad);
      this.scene.hitBad();
      // Freeze until the player has read why: no guessing through the explanation.
      this.paused = true;
      this.steering.release();
      this.events.onWrong(f.answer, question);
    }
    this.events.onScore(s.score, s.combo);
    this.events.onFound(this.found);
  }

  private finishRound(question: GameQuestion) {
    const clean = this.slipsThisRound === 0, bonus = clean ? 25 : 10;
    this.stats.score += bonus;
    for (const o of this.foods) if (!o.ok && !o.dying) o.dying = 0.001;
    this.scene.fx.confetti(WORLD.w / 2, WORLD.h * 0.45);
    this.events.onRoundDone(question, bonus, clean);
    this.nextRoundIn = 2.3;
  }

  private advance() {
    this.round++;
    if (this.round < this.rounds.length) return this.beginRound();
    this.running = false;
    const { score, mistakes, bestCombo, missed } = this.stats;
    this.events.onFinish({ score, mistakes, bestCombo, missed });
  }

  private frame(dt: number) {
    const moving = this.running && !this.paused;
    const view = {
      snake: this.snake, foods: this.foods, skin: this.skin, combo: this.stats.combo,
      showFoods: this.running, paused: this.paused,
    };
    this.scene.update(dt, view, moving);
    for (const f of this.foods) if (f.dying) f.dying += dt;
    this.foods = this.foods.filter((f) => !f.dying || f.dying < 0.3);
    if (moving) this.play(dt);
    this.scene.draw(this.stage.ctx, { ...view, foods: this.foods });
  }

  private play(dt: number) {
    if (this.nextRoundIn > 0) {
      this.nextRoundIn -= dt;
      if (this.nextRoundIn <= 0) this.advance();
    }
    const sn = this.snake;
    moveSnake(sn, this.steering.wanted(sn), dt, this.top);
    for (const f of this.foods) {
      if (f.dying || this.scene.time < f.born + 0.35) continue;
      f.near = Math.max(0, 1 - Math.hypot(sn.x - f.x, sn.y - f.y) / 90);
      if (Math.abs(sn.x - f.x) < f.w / 2 + 8 && Math.abs(sn.y - f.y) < f.h / 2 + 8) {
        this.eat(f);
        break;
      }
    }
  }
}
