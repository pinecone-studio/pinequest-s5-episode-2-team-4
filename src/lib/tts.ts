// Narration for lesson reels with ElevenLabs (Mongolian needs eleven_v3 or
// newer; eleven_v4 is the best quality), plus when each word and section is spoken so the reel can
// highlight them. Server only. Without ELEVENLABS_API_KEY/VOICE_ID (or on an
// error) there is no audio and the timings are estimated from text length,
// so the reel still plays as timed captions.

import "server-only";
import { estimateTimings } from "./reel-timing";
import type { ReelScript, ReelTimings } from "./types";

const MODEL = process.env.ELEVENLABS_MODEL || "eleven_v4";
const TIMEOUT_MS = 90_000;
/** Characters per request: 5,000 on eleven_v3, 10,000 on eleven_v4. */
const MAX_CHARS = MODEL.startsWith("eleven_v3") ? 4_800 : 9_500;
/** Silence after the last word before the reel ends. */
const TAIL_MS = 600;

// Small numbers as words, so "3/4" is read "дөрөвний гурав".
const CARDINAL = ["тэг", "нэг", "хоёр", "гурав", "дөрөв", "тав", "зургаа", "долоо", "найм", "ес", "арав", "арван нэг", "арван хоёр"];
const GENITIVE = ["", "нэгийн", "хоёрын", "гурвын", "дөрөвний", "тавын", "зургаагийн", "долоогийн", "наймын", "есийн", "аравны", "арван нэгийн", "арван хоёрын"];

const fractionWords = (num: string, den: string) => {
  const n = Number(num);
  const d = Number(den);
  return GENITIVE[d] && CARDINAL[n] !== undefined ? `${GENITIVE[d]} ${CARDINAL[n]}` : `${den}-ийн ${num}`;
};

/** Reads formulas the way a teacher would say them. */
const speakable = (s: string) =>
  s
    .replace(/(\d+)\s*\/\s*(\d+)/g, (_, n, d) => fractionWords(n, d))
    .replace(/\s[×*]\s/g, " үржих нь ")
    .replace(/\s[÷:]\s/g, " хуваах нь ")
    // Only a spaced minus: "1/2-ийг" keeps its hyphen.
    .replace(/\s[−-]\s/g, " хасах нь ")
    .replace(/\s\+\s/g, " нэмэх нь ")
    .replace(/\s=\s/g, " тэнцүү ")
    .replace(/\s+/g, " ")
    .trim();

type Alignment = {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
};

/** Words and section starts from ElevenLabs' per-character times. */
function timingsFrom(alignment: Alignment, text: string, sectionOffsets: number[]): ReelTimings {
  const { characters: chars, character_start_times_seconds: starts, character_end_times_seconds: ends } = alignment;
  const ms = (s: number) => Math.round(s * 1000);
  const words: ReelTimings["words"] = [];
  let word = "";
  let wordStart = 0;
  chars.forEach((c, i) => {
    if (/\s/.test(c)) {
      if (word) words.push({ text: word, start: wordStart, end: ms(ends[i - 1]) });
      word = "";
      return;
    }
    if (!word) wordStart = ms(starts[i]);
    word += c;
  });
  if (word) words.push({ text: word, start: wordStart, end: ms(ends[chars.length - 1]) });

  const duration = ms(ends[chars.length - 1] ?? 0) + TAIL_MS;
  // The alignment follows the text sent; if its length differs, place sections proportionally.
  const ratio = chars.length / text.length;
  const sectionStarts = sectionOffsets.map((offset) => ms(starts[Math.min(chars.length - 1, Math.round(offset * ratio))] ?? 0));
  const sections = sectionStarts.map((start, i) => ({ start, end: sectionStarts[i + 1] ?? duration }));
  return { words, sections, duration };
}

/** mp3 narration and timings, or no audio with estimated timings. */
export async function synthesizeReel(script: ReelScript): Promise<{ audio?: Buffer; timings: ReelTimings }> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (!apiKey || !voiceId) return { timings: estimateTimings(script) };

  // One request for the whole reel; a blank line between sections gives a natural pause.
  const parts = script.sections.map((s) => speakable(s.say));
  const sectionOffsets: number[] = [];
  let text = "";
  for (const part of parts) {
    if (text) text += "\n\n";
    sectionOffsets.push(text.length);
    text += part;
  }
  if (!text || text.length > MAX_CHARS) return { timings: estimateTimings(script) };

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/with-timestamps?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ text, model_id: MODEL, language_code: "mn" }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );
    if (!response.ok) throw new Error(`ElevenLabs ${response.status}: ${(await response.text()).slice(0, 300)}`);
    const data = (await response.json()) as { audio_base64?: string; alignment?: Alignment | null };
    if (!data.audio_base64 || !data.alignment?.characters.length) throw new Error("ElevenLabs returned no audio or timings");
    return { audio: Buffer.from(data.audio_base64, "base64"), timings: timingsFrom(data.alignment, text, sectionOffsets) };
  } catch (error) {
    console.error("ElevenLabs TTS failed:", error);
    return { timings: estimateTimings(script) };
  }
}
