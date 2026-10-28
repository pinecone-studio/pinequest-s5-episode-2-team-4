// Reel timing helpers shared by the server (TTS fallback) and the browser
// (preview before the narration exists).

import type { ReelScript, ReelTimings } from "./types";

/** Pause between sections, in the audio and the estimate. */
export const SECTION_PAUSE_MS = 400;

/** Timings when there is no audio: about 14 characters a second. */
export function estimateTimings(script: ReelScript): ReelTimings {
  const words: ReelTimings["words"] = [];
  const sections: ReelTimings["sections"] = [];
  let t = 300;
  for (const s of script.sections) {
    const start = t;
    for (const w of s.say.split(/\s+/).filter(Boolean)) {
      const d = Math.max(180, w.length * 70);
      words.push({ text: w, start: t, end: t + d });
      t += d + 40;
    }
    sections.push({ start, end: t });
    t += SECTION_PAUSE_MS;
  }
  return { words, sections, duration: t + 600 };
}

/** Index of the section playing at `ms` (the last one after the end). */
export function sectionAt(timings: ReelTimings, ms: number): number {
  const i = timings.sections.findIndex((s, j) => ms < (timings.sections[j + 1]?.start ?? Infinity) && ms >= s.start);
  return i === -1 ? 0 : i;
}
