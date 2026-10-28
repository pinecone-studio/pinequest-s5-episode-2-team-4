// The vertical lesson reel, drawn by Remotion from the script and the word
// timings. Played in the browser with <Player>, never rendered to a file.

import { Fragment } from "react";
import { AbsoluteFill, Html5Audio, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FormulaText } from "@/components/FormulaText";
import { cn } from "@/lib/cn";
import { sectionAt } from "@/lib/reel-timing";
import type { ReelScript, ReelSectionKind, ReelTimings } from "@/lib/types";

export const REEL_WIDTH = 1080;
export const REEL_HEIGHT = 1920;
export const REEL_FPS = 30;

export type ReelProps = {
  script: ReelScript;
  timings: ReelTimings;
  audioUrl?: string;
};

export const reelFrames = (timings: ReelTimings) => Math.max(REEL_FPS, Math.ceil((timings.duration / 1000) * REEL_FPS));

const KIND_LABEL: Record<ReelSectionKind, string> = {
  hook: "Сонирхолтой нь",
  step: "Алхам",
  example: "Жишээ",
  question: "Асуулт",
};

/** Words around the one being spoken, with that word highlighted. */
function Subtitles({ timings, section, ms }: { timings: ReelTimings; section: number; ms: number }) {
  const { start, end } = timings.sections[section] ?? { start: 0, end: 0 };
  const words = timings.words.filter((w) => w.start >= start && w.start < end);
  const current = words.findLastIndex((w) => w.start <= ms);
  // A window of up to 9 words so the subtitle stays two or three lines.
  const from = Math.max(0, Math.min(current - 3, words.length - 9));
  return (
    <p className="mx-16 text-center text-[54px] leading-[1.3] font-bold text-white">
      {words.slice(from, from + 9).map((w, i) => (
        // The space between spans is where the line can wrap.
        <Fragment key={`${w.start}-${i}`}>
          {i > 0 && " "}
          <span
            className={cn("rounded-[0.2em] px-[0.12em]", from + i === current ? "bg-sky text-ink" : from + i < current ? "" : "opacity-60")}
          >
            {w.text}
          </span>
        </Fragment>
      ))}
    </p>
  );
}

/** A pet running and jumping over fraction blocks along the bottom. */
function Runner({ frame }: { frame: number }) {
  const PERIOD = 100;
  const SPEED = 12;
  const phase = frame % PERIOD;
  const blockX = 1200 - phase * SPEED;
  const jump = phase > 72 && phase < 94 ? Math.sin((Math.PI * (phase - 72)) / 22) * 230 : 0;
  const block = ["1/2", "3/4", "2/3", "5/6"][Math.floor(frame / PERIOD) % 4];
  const ground = -((frame * SPEED) % 120);
  return (
    <div className="absolute inset-x-0 bottom-0 h-[380px] overflow-hidden">
      <div
        className="absolute inset-x-0 bottom-[110px] h-2 opacity-70"
        style={{ backgroundImage: "repeating-linear-gradient(90deg, white 0 60px, transparent 60px 120px)", backgroundPositionX: ground }}
      />
      <div
        className="absolute bottom-[118px] flex h-[120px] w-[120px] items-center justify-center rounded-[28px] bg-white text-[52px] font-bold text-primary shadow-[0_8px_0_var(--color-line)]"
        style={{ left: blockX }}
      >
        <FormulaText text={block} />
      </div>
      <Img
        src="/pets/agnite.png"
        className="absolute bottom-[110px] left-[150px] h-[200px] w-[200px] [image-rendering:pixelated]"
        style={{ transform: `translateY(${-jump}px)` }}
      />
    </div>
  );
}

export function Reel({ script, timings, audioUrl }: ReelProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const index = sectionAt(timings, ms);
  const section = script.sections[index];
  const sectionStart = timings.sections[index]?.start ?? 0;
  // The first section is on screen from the first frame, so the paused player shows it.
  const enter =
    index === 0 ? 1 : spring({ frame: frame - Math.round((sectionStart / 1000) * fps), fps, config: { damping: 14 } });
  const step = script.sections.slice(0, index + 1).filter((s) => s.kind === "step").length;

  return (
    <AbsoluteFill className="bg-linear-to-b from-primary to-primary-dark font-sans">
      {audioUrl && <Html5Audio src={audioUrl} />}

      {/* Section progress */}
      <div className="absolute inset-x-16 top-16 flex gap-3">
        {script.sections.map((_, i) => (
          <span key={i} className={cn("h-3 flex-1 rounded-full", i <= index ? "bg-white" : "bg-white/30")} />
        ))}
      </div>
      <p className="absolute inset-x-16 top-28 text-[40px] font-bold text-white/80">{script.title}</p>

      {section && (
        <div
          className="absolute inset-x-16 top-[300px] flex flex-col items-start gap-8"
          style={{ opacity: enter, transform: `translateY(${interpolate(enter, [0, 1], [60, 0])}px)` }}
        >
          <span className="rounded-full bg-magenta px-8 py-3 text-[40px] font-bold text-white">
            {KIND_LABEL[section.kind]}
            {section.kind === "step" && ` ${step}`}
          </span>
          <h1 className="text-[92px] leading-[1.08] font-bold tracking-[-0.02em] text-white">{section.caption}</h1>
          {section.formula && (
            <div className="mt-6 self-stretch rounded-[48px] bg-white px-12 py-14 text-center text-[96px] font-bold text-ink shadow-[0_14px_0_var(--color-line)]">
              <FormulaText text={section.formula} className="justify-center" />
            </div>
          )}
        </div>
      )}

      <div className="absolute inset-x-0 bottom-[420px]">
        <Subtitles timings={timings} section={index} ms={ms} />
      </div>
      <Runner frame={frame} />
    </AbsoluteFill>
  );
}
