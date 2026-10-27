// Short game sounds made with the Web Audio API (no audio files). Browsers
// allow sound only after a tap, so sound stays off until the player turns it on.
// Background music comes from ./music and follows the same on/off switch.

import { GameMusic, type GameMusicId } from "./music";

export type GameSound = {
  enabled: boolean;
  good: (combo?: number) => void;
  bad: () => void;
  round: () => void;
  tick: () => void;
  /** A soft rising blip, e.g. for a jump or a launch. */
  blip: () => void;
  /** Starts the game's music loop; does nothing while sound is off. */
  startMusic: (id: GameMusicId) => void;
  /** Stops the music; turning sound off stops it too. */
  stopMusic: () => void;
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
  };
  return sound;
}
