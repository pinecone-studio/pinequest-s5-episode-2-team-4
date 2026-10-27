// Looping background music for the games, made with the Web Audio API (no
// audio files). Each game has its own key, tempo, instruments and drum kit.
// Notes use instrument-like envelopes and filters instead of bare waves, go
// through a small reverb, and are nudged in time and volume so the loop
// feels played, not mechanical. Browsers only allow sound after a tap, so
// music starts from a click handler (see GameSound.startMusic).

export type Instrument = "marimba" | "pluck" | "keys" | "bell" | "brass" | "flute";
export type Kit = "soft" | "rock" | "hand" | "electro";

export type MusicTheme = {
  bpm: number;
  /** MIDI note of the key's root. */
  root: number;
  /** Semitones from the root. */
  scale: number[];
  lead: Instrument;
  /** 4 bars of 16 steps. A digit is a scale degree (wrapping into the next octave), "." a rest. */
  melody: string;
  /** Scale degree of each bar's bass note (also the root of the pad chord). */
  bass: [number, number, number, number];
  /** One bar of 16 steps each; "x" plays. */
  bassRhythm: string;
  kick: string;
  snare: string;
  hat: string;
  kit: Kit;
  /** 0–0.3: how far odd 16th notes are pushed late. */
  swing: number;
  /** Soft sustained chord under the bar. */
  pad: boolean;
  /** How much of the lead goes through the reverb, 0–1. */
  reverb: number;
};

export type GameMusicId =
  | "mole"
  | "hoops"
  | "race"
  | "runner"
  | "penalty"
  | "tug"
  | "cards"
  | "snake";

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 10];

export const MUSIC_THEMES: Record<GameMusicId, MusicTheme> = {
  // Bouncy marimba
  mole: {
    bpm: 132, root: 60, scale: [0, 2, 4, 7, 9], lead: "marimba",
    melody: "0.2.4.2.0.2.4.5.4.2.4.7.5.4.2.0.0.0.2.4.5.4.2.4.5.4.2.0.2.4.0...",
    bass: [0, 3, 1, 2], bassRhythm: "x...x...x..x....",
    kick: "x.......x.......", snare: "....x.......x...", hat: "x.x.x.x.x.x.x.x.",
    kit: "soft", swing: 0.14, pad: false, reverb: 0.2,
  },
  // Stadium brass
  hoops: {
    bpm: 118, root: 62, scale: MAJOR, lead: "brass",
    melody: "4...4.5.7...7.5.4...2.4.5...4.2.4...4.5.7...9.7.5.7.5.4.2.....0.",
    bass: [0, 3, 4, 0], bassRhythm: "x..x..x.x..x..x.",
    kick: "x..x..x.x..x..x.", snare: "....x.......x...", hat: ".x.x.x.x.x.x.x.x",
    kit: "rock", swing: 0.06, pad: true, reverb: 0.3,
  },
  // Galloping plucked strings and hand drums
  race: {
    bpm: 140, root: 57, scale: [0, 2, 4, 5, 7, 9, 10], lead: "pluck",
    melody: "0.00.2.0.4.44.2.4.44.5.4.7.77.5.0.00.2.0.4.44.2.5.55.4.2.0.00.2.",
    bass: [0, 3, 0, 4], bassRhythm: "x.xx.x.xx.xx.x.x",
    kick: "x.xx..xxx.xx..x.", snare: "....x.......x...", hat: "x.xx.x.xx.xx.x.x",
    kit: "hand", swing: 0.05, pad: false, reverb: 0.25,
  },
  // Polished electronic
  runner: {
    bpm: 150, root: 57, scale: MINOR, lead: "keys",
    melody: "0.4.7.4.0.4.7.4.5.7.9.7.5.7.9.7.3.5.7.5.3.5.7.5.4.7.9.7.8.7.4.2.",
    bass: [0, 5, 3, 4], bassRhythm: "x.x.x.x.x.x.x.x.",
    kick: "x...x...x...x.x.", snare: "....x.......x...", hat: "x.x.x.x.x.x.x.xx",
    kit: "electro", swing: 0, pad: true, reverb: 0.35,
  },
  // Tense, sparse flute over a pulse
  penalty: {
    bpm: 92, root: 52, scale: MINOR, lead: "flute",
    melody: "0.......2.......3.......2.......0.......4.......3...2...1.......",
    bass: [0, 0, 5, 4], bassRhythm: "x...............",
    kick: "x.x.............", snare: "................", hat: "....x.......x...",
    kit: "hand", swing: 0, pad: true, reverb: 0.5,
  },
  // Heavy march with brass
  tug: {
    bpm: 104, root: 48, scale: MINOR, lead: "brass",
    melody: "0...0...3...2...0...0...5...4...0...0...7...5...7...5...3...0...",
    bass: [0, 0, 3, 4], bassRhythm: "x...x...x...x...",
    kick: "x...x...x...x...", snare: "....x.......x...", hat: ".x...x...x...x..",
    kit: "hand", swing: 0, pad: true, reverb: 0.3,
  },
  // Mysterious bells
  cards: {
    bpm: 84, root: 62, scale: [0, 2, 3, 5, 7, 9, 10], lead: "bell",
    melody: "4...3...2...0...2...3...4...5...7...5...4...3...2...0.......0...",
    bass: [0, 3, 5, 4], bassRhythm: "x.......x.......",
    kick: "x.......x.......", snare: "........x.......", hat: "..x...x...x...x.",
    kit: "soft", swing: 0.05, pad: true, reverb: 0.55,
  },
  // Light kalimba-style melody
  snake: {
    bpm: 124, root: 64, scale: MINOR, lead: "bell",
    melody: "0.2.4.2.0.2.4.2.5.4.2.4.5.4.2.4.3.5.7.5.3.5.7.5.4.2.0.2.4.2.0...",
    bass: [0, 5, 3, 4], bassRhythm: "x..x..x.x..x..x.",
    kick: "x...x...x...x...", snare: "....x.......x...", hat: "x.x.x.x.x.x.x.x.",
    kit: "electro", swing: 0.08, pad: false, reverb: 0.3,
  },
};

const midiToHz = (m: number) => 440 * 2 ** ((m - 69) / 12);
const jitter = (amount: number) => (Math.random() * 2 - 1) * amount;

export class GameMusic {
  private ctx: AudioContext;
  private dry: GainNode;
  private reverb: ConvolverNode;
  private noise: AudioBuffer;
  private timer: ReturnType<typeof setInterval> | undefined;
  private step = 0;
  private nextTime = 0;
  private master: GainNode;
  private level: number;

  constructor(private theme: MusicTheme, volume = 0.5) {
    this.ctx = new AudioContext();
    this.level = volume;
    this.master = this.ctx.createGain();
    this.master.gain.value = volume;
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.ratio.value = 4;
    this.master.connect(comp).connect(this.ctx.destination);
    this.dry = this.ctx.createGain();
    this.dry.connect(this.master);

    // Small room: decaying noise as the reverb impulse
    const len = Math.floor(this.ctx.sampleRate * 1.8);
    const ir = this.ctx.createBuffer(2, len, this.ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2.6;
    }
    this.reverb = this.ctx.createConvolver();
    this.reverb.buffer = ir;
    const wet = this.ctx.createGain();
    wet.gain.value = 0.7;
    this.reverb.connect(wet).connect(this.master);

    this.noise = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }

  static forGame(id: GameMusicId, volume?: number) {
    return new GameMusic(MUSIC_THEMES[id], volume);
  }

  /** Starts (or resumes) the loop. */
  async start() {
    await this.ctx.resume();
    if (this.timer) return;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.1;
    // Schedule a little ahead on a short timer so timing stays tight.
    this.timer = setInterval(() => this.schedule(), 25);
  }

  stop() {
    clearInterval(this.timer);
    this.timer = undefined;
  }

  /** Stops the loop and releases the audio context. */
  close() {
    this.stop();
    void this.ctx.close();
  }

  /** Softer music for a while, e.g. under a spoken question. */
  duck(seconds: number, level = 0.08) {
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(level, t, 0.05);
    this.master.gain.setTargetAtTime(this.level, t + seconds, 0.3);
  }

  private schedule() {
    const { bpm, melody, bass, bassRhythm, kick, snare, hat, swing, pad, lead, reverb } = this.theme;
    const stepLen = 60 / bpm / 4;
    while (this.nextTime < this.ctx.currentTime + 0.15) {
      const s = this.step % 64;
      const beat = s % 16;
      // Odd 16ths land late (swing); everything drifts a few ms (human feel)
      const t = this.nextTime + (beat % 2 ? swing * stepLen : 0) + jitter(0.006);
      const vel = 0.85 + Math.random() * 0.3;
      const accent = beat % 4 === 0 ? 1.1 : 1;

      if (beat === 0 && pad) this.padChord(bass[Math.floor(s / 16)], t, stepLen * 16);
      const note = melody[s];
      if (note && note !== ".") {
        this.voice(lead, this.noteHz(Number(note), 12), t, stepLen * 2.2, vel * accent, reverb);
      }
      if (bassRhythm[beat] === "x") {
        this.bassNote(this.noteHz(bass[Math.floor(s / 16)], -12), t, stepLen * 1.8, vel);
      }
      this.drums(kick[beat] === "x", snare[beat] === "x", hat[beat] === "x", t, vel, beat);
      this.nextTime += stepLen;
      this.step++;
    }
  }

  private noteHz(degree: number, shift: number) {
    const { scale, root } = this.theme;
    const octave = Math.floor(degree / scale.length);
    return midiToHz(root + shift + octave * 12 + scale[degree % scale.length]);
  }

  /** Sends a node to the dry mix and, by `send`, into the reverb. */
  private route(node: AudioNode, send = 0) {
    node.connect(this.dry);
    if (send > 0) {
      const g = this.ctx.createGain();
      g.gain.value = send;
      node.connect(g).connect(this.reverb);
    }
  }

  /** One oscillator with a pluck envelope: quick attack, exponential decay. */
  private partial(type: OscillatorType, hz: number, t: number, amp: number, decay: number, out: AudioNode, attack = 0.004) {
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(hz, t);
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(amp, t + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    osc.connect(env).connect(out);
    osc.start(t);
    osc.stop(t + attack + decay + 0.05);
    return osc;
  }

  private voice(kind: Instrument, hz: number, t: number, dur: number, v: number, send: number) {
    const bus = this.ctx.createGain();
    bus.gain.value = 0.32 * v;
    this.route(bus, send);
    switch (kind) {
      case "marimba":
        // Woody: fundamental plus a fast-dying overtone two octaves up
        this.partial("sine", hz, t, 1, 0.45, bus);
        this.partial("sine", hz * 4, t, 0.28, 0.09, bus);
        this.partial("sine", hz * 9.8, t, 0.07, 0.04, bus);
        break;
      case "pluck": {
        // Plucked string: detuned saws through a filter that closes quickly
        const f = this.ctx.createBiquadFilter();
        f.type = "lowpass";
        f.Q.value = 1.5;
        f.frequency.setValueAtTime(hz * 9, t);
        f.frequency.exponentialRampToValueAtTime(hz * 1.6, t + 0.22);
        f.connect(bus);
        for (const cents of [-7, 7]) {
          const o = this.partial("sawtooth", hz, t, 0.6, 0.32, f);
          o.detune.value = cents;
        }
        break;
      }
      case "keys": {
        // Electric piano: FM bell on top of a soft sine
        const mod = this.ctx.createOscillator();
        const modAmp = this.ctx.createGain();
        const car = this.ctx.createOscillator();
        const env = this.ctx.createGain();
        mod.frequency.value = hz * 2;
        modAmp.gain.setValueAtTime(hz * 1.6, t);
        modAmp.gain.exponentialRampToValueAtTime(hz * 0.05, t + 0.35);
        car.frequency.value = hz;
        env.gain.setValueAtTime(0.0001, t);
        env.gain.exponentialRampToValueAtTime(0.9, t + 0.006);
        env.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
        mod.connect(modAmp).connect(car.frequency);
        car.connect(env).connect(bus);
        mod.start(t); car.start(t);
        mod.stop(t + 1); car.stop(t + 1);
        break;
      }
      case "bell":
        // Inharmonic partials, long ring
        this.partial("sine", hz, t, 1, 1.3, bus);
        this.partial("sine", hz * 2.76, t, 0.4, 0.7, bus);
        this.partial("sine", hz * 5.4, t, 0.15, 0.3, bus);
        break;
      case "brass": {
        // Swelling, slightly detuned saws; the filter opens as the note speaks
        const f = this.ctx.createBiquadFilter();
        f.type = "lowpass";
        f.frequency.setValueAtTime(500, t);
        f.frequency.exponentialRampToValueAtTime(2200, t + 0.09);
        f.frequency.exponentialRampToValueAtTime(1300, t + dur);
        const env = this.ctx.createGain();
        env.gain.setValueAtTime(0.0001, t);
        env.gain.exponentialRampToValueAtTime(0.7, t + 0.05);
        env.gain.setValueAtTime(0.7, t + dur * 0.8);
        env.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.12);
        f.connect(env).connect(bus);
        for (const cents of [-9, 0, 9]) {
          const o = this.ctx.createOscillator();
          o.type = "sawtooth";
          o.frequency.value = hz;
          o.detune.value = cents;
          o.connect(f);
          o.start(t);
          o.stop(t + dur + 0.2);
        }
        break;
      }
      case "flute": {
        // Breathy sine with a slow vibrato that fades in
        const o = this.ctx.createOscillator();
        const o2 = this.ctx.createOscillator();
        const env = this.ctx.createGain();
        const vib = this.ctx.createOscillator();
        const vibAmp = this.ctx.createGain();
        o.frequency.value = hz;
        o2.frequency.value = hz * 2;
        const h = this.ctx.createGain();
        h.gain.value = 0.15;
        vib.frequency.value = 5.2;
        vibAmp.gain.setValueAtTime(0, t);
        vibAmp.gain.linearRampToValueAtTime(hz * 0.012, t + 0.4);
        vib.connect(vibAmp);
        vibAmp.connect(o.frequency);
        vibAmp.connect(o2.frequency);
        env.gain.setValueAtTime(0.0001, t);
        env.gain.exponentialRampToValueAtTime(0.8, t + 0.07);
        env.gain.setValueAtTime(0.8, t + dur * 1.4);
        env.gain.exponentialRampToValueAtTime(0.0001, t + dur * 1.4 + 0.25);
        o.connect(env);
        o2.connect(h).connect(env);
        env.connect(bus);
        [o, o2, vib].forEach((n) => { n.start(t); n.stop(t + dur * 1.4 + 0.3); });
        // A touch of breath noise
        this.noiseHit(t, 0.12, 0.06, "bandpass", hz * 3, bus);
        break;
      }
    }
  }

  private bassNote(hz: number, t: number, dur: number, v: number) {
    const f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 520;
    const bus = this.ctx.createGain();
    bus.gain.value = 0.5 * v;
    f.connect(bus);
    this.route(bus);
    this.partial("triangle", hz, t, 1, dur + 0.12, f);
    this.partial("sine", hz / 2, t, 0.6, dur + 0.2, f);
  }

  /** A soft three-note chord that fills the bar. */
  private padChord(degree: number, t: number, dur: number) {
    const bus = this.ctx.createGain();
    bus.gain.value = 0.09;
    this.route(bus, 0.5);
    const f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 900;
    f.connect(bus);
    for (const d of [degree, degree + 2, degree + 4]) {
      for (const cents of [-6, 6]) {
        const o = this.ctx.createOscillator();
        const env = this.ctx.createGain();
        o.type = "sawtooth";
        o.frequency.value = this.noteHz(d, 0);
        o.detune.value = cents;
        env.gain.setValueAtTime(0.0001, t);
        env.gain.linearRampToValueAtTime(0.5, t + 0.5);
        env.gain.setValueAtTime(0.5, t + dur - 0.4);
        env.gain.linearRampToValueAtTime(0.0001, t + dur + 0.3);
        o.connect(env).connect(f);
        o.start(t);
        o.stop(t + dur + 0.4);
      }
    }
  }

  private noiseHit(t: number, dur: number, volume: number, filter: BiquadFilterType, hz: number, out: AudioNode, q = 1) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const f = this.ctx.createBiquadFilter();
    f.type = filter;
    f.frequency.value = hz;
    f.Q.value = q;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(volume, t + 0.003);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(env).connect(out);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  }

  private drums(kick: boolean, snare: boolean, hat: boolean, t: number, v: number, beat: number) {
    const bus = this.ctx.createGain();
    bus.gain.value = 0.55 * v;
    this.route(bus, 0.08);
    const kit = this.theme.kit;
    if (kick) {
      if (kit === "hand") {
        // Low floor tom
        const o = this.partial("sine", 120, t, 1, 0.28, bus);
        o.frequency.exponentialRampToValueAtTime(58, t + 0.2);
        this.noiseHit(t, 0.05, 0.25, "lowpass", 600, bus);
      } else {
        const o = this.partial("sine", kit === "soft" ? 110 : 150, t, 1, kit === "soft" ? 0.22 : 0.3, bus);
        o.frequency.exponentialRampToValueAtTime(46, t + 0.14);
        this.noiseHit(t, 0.012, kit === "electro" ? 0.5 : 0.25, "highpass", 2500, bus);
      }
    }
    if (snare) {
      if (kit === "soft") {
        // Rim click
        this.partial("triangle", 820, t, 0.5, 0.04, bus);
        this.noiseHit(t, 0.05, 0.25, "bandpass", 3000, bus, 3);
      } else if (kit === "hand") {
        // Hand drum slap
        const o = this.partial("sine", 330, t, 0.8, 0.16, bus);
        o.frequency.exponentialRampToValueAtTime(190, t + 0.1);
        this.noiseHit(t, 0.09, 0.4, "bandpass", 2200, bus, 1.5);
      } else {
        this.partial("triangle", 190, t, 0.5, 0.11, bus).frequency.exponentialRampToValueAtTime(120, t + 0.1);
        this.noiseHit(t, kit === "electro" ? 0.14 : 0.2, 0.55, "bandpass", 1900, bus);
        if (kit === "rock") {
          // Clap layered on the snare
          for (const d of [0, 0.012, 0.024]) this.noiseHit(t + d, 0.06, 0.25, "bandpass", 1300, bus, 2);
        }
      }
    }
    if (hat) {
      const open = beat % 8 === 6 && kit !== "soft";
      if (kit === "soft" || kit === "hand") this.noiseHit(t, 0.07, 0.16, "bandpass", 5600, bus, 2);
      else this.noiseHit(t, open ? 0.22 : 0.045, open ? 0.2 : 0.16, "highpass", 8000, bus);
    }
  }
}
