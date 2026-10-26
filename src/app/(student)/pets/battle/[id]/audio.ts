"use client";

// Battle music and sound effects, synthesised with the Web Audio API: no
// audio files. Each arena has its own key, scale, tempo and lead sound.
// Browsers only allow sound after a tap or key press, so the screen calls
// start() from the first interaction.

import type { BossArena } from "@/lib/types";

type Theme = {
  bpm: number;
  /** MIDI note of the key's root. */
  root: number;
  /** Semitones from the root. */
  scale: number[];
  lead: OscillatorType;
  melody: string;
  /** Scale degree of each bar's bass note. */
  bass: number[];
  drums: "soft" | "normal" | "busy";
};

// 16 steps per bar, 4 bars. A digit is a scale degree (wrapping into the
// next octave), "." is a rest.
const HEROIC = "0.2.4.2.4.5.4.2.3.2.1.2.0...4...0.2.4.7.6.4.5.4.3.4.2.1.0.......";
const MYSTIC = "4...3.2.0...2...5...4.3.2.......0.2.3.4.5...4.3.2...1.2.0.......";

const THEMES: Record<BossArena, Theme> = {
  beach: { bpm: 132, root: 60, scale: [0, 2, 4, 5, 7, 9, 11], lead: "square", melody: HEROIC, bass: [0, 5, 3, 4], drums: "normal" },
  reef: { bpm: 96, root: 65, scale: [0, 2, 4, 6, 7, 9, 11], lead: "triangle", melody: MYSTIC, bass: [0, 3, 5, 4], drums: "soft" },
  volcano: { bpm: 152, root: 62, scale: [0, 2, 3, 5, 7, 8, 10], lead: "sawtooth", melody: HEROIC, bass: [0, 5, 3, 4], drums: "busy" },
  desert: { bpm: 116, root: 64, scale: [0, 1, 4, 5, 7, 8, 10], lead: "square", melody: MYSTIC, bass: [0, 1, 0, 5], drums: "normal" },
  bamboo: { bpm: 108, root: 57, scale: [0, 3, 5, 7, 10], lead: "triangle", melody: MYSTIC, bass: [0, 3, 2, 4], drums: "soft" },
  city: { bpm: 140, root: 59, scale: [0, 2, 3, 5, 7, 8, 10], lead: "square", melody: HEROIC, bass: [0, 5, 6, 4], drums: "busy" },
};

export type Sfx = "swing" | "hit" | "roar" | "impact" | "wrong" | "warn" | "victory" | "defeat";

const midiToHz = (m: number) => 440 * 2 ** ((m - 69) / 12);

export class BattleAudio {
  private ctx: AudioContext;
  private master: GainNode;
  private music: GainNode;
  private sfx: GainNode;
  private noise: AudioBuffer;
  private timer: ReturnType<typeof setInterval> | undefined;
  private step = 0;
  private nextTime = 0;

  constructor(private theme: Theme) {
    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.master.connect(this.ctx.destination);
    this.music = this.ctx.createGain();
    this.music.gain.value = 0.1;
    this.music.connect(this.master);
    this.sfx = this.ctx.createGain();
    this.sfx.gain.value = 0.28;
    this.sfx.connect(this.master);
    this.noise = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }

  static forArena(arena: BossArena) {
    return new BattleAudio(THEMES[arena]);
  }

  setMuted(muted: boolean) {
    this.master.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.05);
  }

  /** Starts (or resumes) the music loop. */
  async startMusic() {
    await this.ctx.resume();
    if (this.timer) return;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.1;
    // Schedule a little ahead on a short timer so timing stays tight.
    this.timer = setInterval(() => this.schedule(), 25);
  }

  stopMusic() {
    clearInterval(this.timer);
    this.timer = undefined;
  }

  /** Quieter music for a while, e.g. while a listening question plays. */
  duck(seconds: number) {
    const t = this.ctx.currentTime;
    this.music.gain.setTargetAtTime(0.02, t, 0.05);
    this.music.gain.setTargetAtTime(0.1, t + seconds, 0.3);
  }

  close() {
    this.stopMusic();
    void this.ctx.close();
  }

  private schedule() {
    const { bpm, melody, bass, drums } = this.theme;
    const stepLen = 60 / bpm / 4;
    while (this.nextTime < this.ctx.currentTime + 0.12) {
      const s = this.step % 64;
      const t = this.nextTime;
      const ch = melody[s];
      if (ch !== ".") this.tone(this.noteHz(Number(ch), 12), t, stepLen * 1.8, this.theme.lead, 0.5, this.music);
      if (s % 2 === 0) {
        const degree = bass[Math.floor(s / 16)];
        this.tone(this.noteHz(degree, s % 4 === 0 ? -12 : 0), t, stepLen * 1.6, "triangle", 0.7, this.music);
      }
      const beat = s % 16;
      if (beat === 0 || beat === 8 || (drums === "busy" && beat === 10)) this.kick(t);
      if (drums !== "soft" && (beat === 4 || beat === 12)) this.snare(t, 0.35);
      if (drums !== "soft" ? s % 2 === 0 : beat % 4 === 2) this.hat(t);
      this.nextTime += stepLen;
      this.step++;
    }
  }

  private noteHz(degree: number, shift: number) {
    const { scale, root } = this.theme;
    const octave = Math.floor(degree / scale.length);
    return midiToHz(root + shift + octave * 12 + scale[degree % scale.length]);
  }

  private tone(
    hz: number,
    t: number,
    dur: number,
    type: OscillatorType,
    volume: number,
    out: AudioNode,
    endHz?: number,
  ) {
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(hz, t);
    if (endHz) osc.frequency.exponentialRampToValueAtTime(endHz, t + dur);
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(volume, t + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(env).connect(out);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private burst(t: number, dur: number, volume: number, filter: BiquadFilterType, hz: number, out: AudioNode) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const f = this.ctx.createBiquadFilter();
    f.type = filter;
    f.frequency.value = hz;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(volume, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(env).connect(out);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  private kick(t: number) {
    this.tone(140, t, 0.18, "sine", 0.9, this.music, 45);
  }

  private snare(t: number, volume: number) {
    this.burst(t, 0.12, volume, "bandpass", 1800, this.music);
  }

  private hat(t: number) {
    this.burst(t, 0.04, 0.12, "highpass", 7000, this.music);
  }

  play(name: Sfx) {
    void this.ctx.resume();
    const t = this.ctx.currentTime + 0.01;
    const out = this.sfx;
    switch (name) {
      case "swing":
        this.burst(t, 0.15, 0.4, "bandpass", 2400, out);
        break;
      case "hit":
        this.tone(320, t, 0.22, "square", 0.5, out, 70);
        this.burst(t, 0.18, 0.6, "lowpass", 1200, out);
        break;
      case "roar":
        this.tone(110, t, 0.5, "sawtooth", 0.5, out, 40);
        this.burst(t, 0.4, 0.35, "lowpass", 500, out);
        break;
      case "impact":
        this.tone(180, t, 0.25, "square", 0.5, out, 50);
        this.burst(t, 0.25, 0.5, "lowpass", 900, out);
        break;
      case "wrong":
        this.tone(220, t, 0.15, "square", 0.35, out);
        this.tone(160, t + 0.15, 0.25, "square", 0.35, out);
        break;
      case "warn":
        this.tone(880, t, 0.08, "triangle", 0.4, out);
        this.tone(880, t + 0.14, 0.08, "triangle", 0.4, out);
        break;
      case "victory":
        this.stopMusic();
        [72, 76, 79, 84].forEach((m, i) => this.tone(midiToHz(m), t + i * 0.13, i === 3 ? 0.7 : 0.16, "square", 0.45, out));
        break;
      case "defeat":
        this.stopMusic();
        [67, 64, 60, 55].forEach((m, i) => this.tone(midiToHz(m), t + i * 0.22, 0.3, "triangle", 0.45, out));
        break;
    }
  }
}
