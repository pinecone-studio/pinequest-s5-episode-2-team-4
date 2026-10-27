// Short game sounds made with the Web Audio API (no audio files). Browsers
// allow sound only after a tap, so sound stays off until the player turns it on.
// Background music comes from ./music and follows the same on/off switch.

import { GameMusic, type GameMusicId } from "./music";

/** Game-specific effects played by `fx`. */
export type GameFx =
  | "whack"
  | "swish"
  | "bounce"
  | "kick"
  | "cheer"
  | "thud"
  | "hoof"
  | "jump"
  | "crash"
  | "pull"
  | "card"
  | "hit"
  | "eat";

export type GameSound = {
  enabled: boolean;
  good: (combo?: number) => void;
  bad: () => void;
  round: () => void;
  tick: () => void;
  /** A soft rising blip, e.g. for a jump or a launch. */
  blip: () => void;
  /** A sound effect for one game event, e.g. a hammer whack or a kick. */
  fx: (name: GameFx) => void;
  /** Starts the game's music loop; does nothing while sound is off. */
  startMusic: (id: GameMusicId) => void;
  /** Stops the music; turning sound off stops it too. */
  stopMusic: () => void;
  /**
   * One tone for a game's own sounds (a splash, a pop...): frequency in Hz,
   * length in seconds, starting `when` seconds from now; `slide` multiplies
   * the frequency by the end. Silent while sound is off.
   */
  tone: (freq: number, dur: number, type?: OscillatorType, gain?: number, when?: number, slide?: number) => void;
};

export function createSound(): GameSound {
  let audio: AudioContext | undefined;
  let music: GameMusic | undefined;
  let musicId: GameMusicId | undefined;
  let on = false;

  function tone(freq: number, dur: number, type: OscillatorType = "sine", gain = 0.07, when = 0, slide = 0) {
    if (!sound.enabled) return;
    audio ??= new AudioContext();
    const t = audio.currentTime + when;
    const osc = audio.createOscillator();
    const amp = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
    amp.gain.setValueAtTime(gain, t);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(amp).connect(audio.destination);
    osc.start(t);
    osc.stop(t + dur);
  }

  let noiseBuf: AudioBuffer | undefined;

  /** A burst of filtered noise; `to` slides the filter frequency over the burst. */
  function burst(dur: number, filter: BiquadFilterType, freq: number, gain = 0.1, when = 0, to?: number) {
    if (!sound.enabled) return;
    audio ??= new AudioContext();
    if (!noiseBuf) {
      noiseBuf = audio.createBuffer(1, audio.sampleRate, audio.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const t = audio.currentTime + when;
    const src = audio.createBufferSource();
    src.buffer = noiseBuf;
    const f = audio.createBiquadFilter();
    f.type = filter;
    f.frequency.setValueAtTime(freq, t);
    if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
    const amp = audio.createGain();
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.01, dur / 3));
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(amp).connect(audio.destination);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  }

  const sound: GameSound = {
    get enabled() {
      return on;
    },
    set enabled(value: boolean) {
      on = value;
      // Turning sound off silences the music; turning it on resumes the game's music
      if (!value) music?.stop();
      else if (musicId) void (music ??= GameMusic.forGame(musicId)).start();
    },
    good(combo = 0) {
      const base = 620 * Math.pow(1.06, Math.min(combo, 10));
      tone(base, 0.12, "triangle");
      tone(base * 1.5, 0.16, "triangle", 0.07, 0.08);
    },
    bad() {
      tone(220, 0.25, "sawtooth", 0.04);
      tone(165, 0.3, "sawtooth", 0.035, 0.1);
    },
    round() {
      [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, "triangle", 0.06, i * 0.09));
    },
    tick() {
      tone(880, 0.08, "square", 0.03);
    },
    blip() {
      tone(380, 0.09, "sine", 0.035, 0, 1.8);
    },
    fx(name) {
      switch (name) {
        case "whack": // hammer on a mole
          tone(220, 0.14, "sine", 0.12, 0, 0.35);
          burst(0.08, "lowpass", 900, 0.18);
          break;
        case "swish": // ball through the net
          burst(0.32, "bandpass", 3800, 0.1, 0, 900);
          tone(1040, 0.2, "sine", 0.03, 0.05);
          break;
        case "bounce": // ball off the rim
          tone(190, 0.1, "sine", 0.1, 0, 0.5);
          tone(150, 0.1, "sine", 0.07, 0.11, 0.5);
          tone(120, 0.09, "sine", 0.04, 0.2, 0.5);
          break;
        case "kick":
          tone(150, 0.14, "sine", 0.14, 0, 0.3);
          burst(0.07, "highpass", 2500, 0.1);
          break;
        case "cheer": // crowd swell
          burst(0.8, "bandpass", 900, 0.09, 0.05, 1900);
          tone(784, 0.18, "triangle", 0.04, 0.05);
          tone(1046, 0.3, "triangle", 0.04, 0.2);
          break;
        case "thud":
          tone(120, 0.2, "sine", 0.14, 0, 0.4);
          burst(0.12, "lowpass", 500, 0.12);
          break;
        case "hoof": // two quick hoof beats
          for (const w of [0, 0.09, 0.2, 0.29]) {
            tone(w % 0.2 ? 150 : 190, 0.07, "sine", 0.1, w, 0.5);
            burst(0.04, "bandpass", 1200, 0.05, w);
          }
          break;
        case "jump":
          tone(300, 0.16, "sine", 0.06, 0, 2.2);
          burst(0.12, "bandpass", 1500, 0.03, 0, 3500);
          break;
        case "crash":
          burst(0.5, "lowpass", 2400, 0.18, 0, 200);
          tone(200, 0.4, "sawtooth", 0.05, 0, 0.3);
          break;
        case "pull": // rope creak and a heave
          burst(0.35, "bandpass", 600, 0.07, 0, 280);
          tone(90, 0.25, "sine", 0.1, 0.05, 0.6);
          break;
        case "card": // card flick
          burst(0.09, "highpass", 3500, 0.1);
          tone(1200, 0.05, "triangle", 0.025, 0.04);
          break;
        case "hit": // strike lands
          burst(0.18, "lowpass", 1400, 0.2, 0, 300);
          tone(260, 0.2, "square", 0.05, 0, 0.3);
          break;
        case "eat": // quick bubble pop
          tone(520, 0.07, "sine", 0.07, 0, 2);
          tone(900, 0.06, "sine", 0.04, 0.05, 1.5);
          break;
      }
    },
    startMusic(id) {
      if (musicId !== id) {
        music?.close();
        music = undefined;
      }
      musicId = id;
      if (!on) return;
      void (music ??= GameMusic.forGame(id)).start();
    },
    stopMusic() {
      musicId = undefined;
      music?.close();
      music = undefined;
    },
    tone,
  };
  return sound;
}
