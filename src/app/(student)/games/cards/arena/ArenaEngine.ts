import { fitCanvas, prefersReducedMotion, startLoop, type Stage } from "../../_lib/canvas";
import { Effects } from "../../_lib/effects";
import { GAME_COLORS, gameFont } from "../../_lib/palette";
import { ARENA, drawPlatform, drawSky, drawSnow, moveScenery } from "./scenery";
import { monsterSprites, type MonsterSprites } from "./sprites";

export type Power = "easy" | "medium" | "hard";

const SHOT: Record<Power, { color: string; size: number; dur: number }> = {
  easy: { color: "#34d399", size: 6, dur: 0.6 },
  medium: { color: "#ffcf5a", size: 8, dur: 0.6 },
  hard: { color: "#ff4d6d", size: 11, dur: 0.75 },
};

type Shot = { t: number; x: number; y: number; power: Power; ok: boolean; done: () => void };

/** The fight on the canvas: the pet throws a star at the monster, which reels, rages and falls. */
export class ArenaEngine {
  private stage: Stage;
  private fx = new Effects();
  private still = prefersReducedMotion();
  private sprites: MonsterSprites = monsterSprites();
  private pet = { x: 112, y: 236, jump: 0, image: null as HTMLImageElement | null };
  private mon = { bx: 388, by: 196, x: 388, y: 196, kick: 0, hit: 0, dead: 0, rage: false };
  private shots: Shot[] = [];
  private shake = 0;
  private time = 0;
  private stopLoop: () => void;

  constructor(private canvas: HTMLCanvasElement) {
    this.stage = fitCanvas(canvas, ARENA.w);
    this.stopLoop = startLoop((dt) => {
      this.step(dt);
      this.draw();
    });
  }

  resize() {
    this.stage = fitCanvas(this.canvas, ARENA.w);
  }

  setPet(src: string | undefined) {
    if (!src) return;
    const img = new Image();
    img.onload = () => (this.pet.image = img);
    img.src = src;
  }

  reset() {
    Object.assign(this.mon, { kick: 0, hit: 0, dead: 0, rage: false, y: this.mon.by });
    this.shots = [];
    this.fx.clear();
  }

  /** Throws a star; resolves when it lands (a wrong answer's star fizzles halfway). */
  throw(power: Power, ok: boolean) {
    this.pet.jump = 1;
    return new Promise<void>((done) => this.shots.push({ t: 0, x: 0, y: 0, power, ok, done }));
  }

  /** Monster reacts to `damage`; `rage` from half HP, `ko` at zero. */
  hit(power: Power, damage: number, combo: number, state: { rage: boolean; ko: boolean }) {
    const m = this.mon, hard = power === "hard";
    m.hit = 0.12;
    m.kick = hard ? 46 : 26;
    if (!this.still) this.shake = hard ? 14 : 7;
    this.fx.burst(m.x, m.y - 50, SHOT[power].color, hard ? 34 : 18, hard ? 200 : 130);
    this.fx.float(m.x, m.y - 70, `−${damage}`);
    if (combo >= 2) this.fx.float(this.pet.x, this.pet.y - 70, `КОМБО x${combo}`, GAME_COLORS.gold, true);
    if (state.rage && !m.rage) this.fx.float(ARENA.w / 2, 100, "Мангас уурлалаа!", GAME_COLORS.bad, true);
    m.rage = state.rage;
    if (state.ko) {
      m.dead = 0.001;
      this.fx.burst(m.x, m.y - 50, GAME_COLORS.gold, 50, 220);
    }
  }

  destroy() {
    this.stopLoop();
  }

  private step(dt: number) {
    const m = this.mon, p = this.pet;
    this.time += dt;
    const pace = m.rage ? 1.7 : 1;
    if (!m.dead) {
      m.x = m.bx + (this.still ? 0 : Math.sin(this.time * 0.9 * pace) * 34) + m.kick;
      m.y = m.by - (this.still ? 0 : Math.abs(Math.sin(this.time * 2.2 * pace)) * 10);
    } else {
      m.dead += dt;
      m.y += dt * 60;
    }
    m.kick *= Math.pow(0.02, dt);
    m.hit = Math.max(0, m.hit - dt);
    p.jump = Math.max(0, p.jump - dt * 2.4);
    this.shake = Math.max(0, this.shake - dt * 30);
    if (!this.still) moveScenery(dt, this.time);
    for (const s of this.shots) this.flyShot(s, dt);
    this.shots = this.shots.filter((s) => s.t < 1 && !(!s.ok && s.t >= 0.55));
    this.fx.update(dt);
  }

  private flyShot(s: Shot, dt: number) {
    const from = { x: this.pet.x + 30, y: this.pet.y - 40 }, to = { x: this.mon.x, y: this.mon.y - 50 };
    s.t += dt / SHOT[s.power].dur;
    const k = Math.min(1, s.t);
    s.x = from.x + (to.x - from.x) * k;
    s.y = from.y + (to.y - from.y) * k - Math.sin(Math.PI * k) * 70;
    if (!s.ok && s.t >= 0.55) {
      this.fx.burst(s.x, s.y, "#8c86a8", 14, 60);
      this.fx.float(s.x, s.y, "унтарлаа", "#c9c3e6", true);
      s.done();
    } else if (s.ok && s.t >= 1) s.done();
    else this.fx.spark({ x: s.x, y: s.y, vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 30, max: 0.35, color: SHOT[s.power].color, size: SHOT[s.power].size * 0.5 });
  }

  private draw() {
    const { ctx } = this.stage, m = this.mon, p = this.pet;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (this.shake) ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    drawSky(ctx, this.time, m.rage);
    drawPlatform(ctx, m.bx, m.by + 4, 70);
    drawPlatform(ctx, p.x, p.y + 4, 56);
    const sprite = m.hit > 0 ? this.sprites.hit : m.rage ? this.sprites.rage : this.sprites.calm;
    ctx.globalAlpha = m.dead ? Math.max(0, 1 - m.dead * 1.4) : 1;
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.scale(-1, 1);
    ctx.drawImage(sprite, -sprite.width / 2, -sprite.height);
    ctx.restore();
    ctx.globalAlpha = 1;
    const py = p.y - Math.sin(p.jump * Math.PI) * 22 - (this.still ? 0 : Math.abs(Math.sin(this.time * 2)) * 3);
    if (p.image) ctx.drawImage(p.image, p.x - 48, py - 92, 96, 96);
    for (const s of this.shots) {
      ctx.fillStyle = SHOT[s.power].color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, SHOT[s.power].size, 0, Math.PI * 2);
      ctx.fill();
    }
    this.fx.draw(ctx, gameFont);
    drawSnow(ctx);
    ctx.restore();
  }
}
