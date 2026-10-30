// The lesson reel, drawn by Remotion from the script and the word timings:
// vertical for phones or horizontal for a classroom screen, over the plain
// purple or a looping background video. Played in the browser with
// <Player>, never rendered to a file.

import { Fragment } from "react";
import { AbsoluteFill, Html5Audio, Html5Video, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FormulaText } from "@/components/FormulaText";
import { cn } from "@/lib/cn";
import { reelBackground } from "@/lib/reel-frame";
import { sectionAt } from "@/lib/reel-timing";
import type { ReelLayout, ReelScript, ReelSectionKind, ReelTimings } from "@/lib/types";

export const REEL_FPS = 30;

/** The composition's size: 1080×1920 for a phone, 1920×1080 for a screen. */
export const reelSize = (layout: ReelLayout = "vertical") =>
  layout === "horizontal" ? { width: 1920, height: 1080 } : { width: 1080, height: 1920 };

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
function Subtitles({ timings, section, ms, wide }: { timings: ReelTimings; section: number; ms: number; wide: boolean }) {
  const { start, end } = timings.sections[section] ?? { start: 0, end: 0 };
  const words = timings.words.filter((w) => w.start >= start && w.start < end);
  const current = words.findLastIndex((w) => w.start <= ms);
  // A window of up to 9 words so the subtitle stays two or three lines.
  const from = Math.max(0, Math.min(current - 3, words.length - 9));
  return (
    <p className={cn("text-center leading-[1.3] font-bold text-white", wide ? "mx-48 text-[48px]" : "mx-16 text-[54px]")}>
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

export function Reel({ script, timings, audioUrl }: ReelProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wide = script.layout === "horizontal";
  const background = reelBackground(script.background);
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
      {background && (
        <>
          <Html5Video src={background.src} loop muted className="absolute inset-0 size-full object-cover" />
          {/* Darkened so the white text stays readable over any video. */}
          <div className="absolute inset-0 bg-linear-to-b from-primary-dark/70 via-primary-dark/45 to-primary-dark/80" />
        </>
      )}
      {audioUrl && <Html5Audio src={audioUrl} />}

      {/* Section progress */}
      <div className={cn("absolute flex gap-3", wide ? "inset-x-24 top-12" : "inset-x-16 top-16")}>
        {script.sections.map((_, i) => (
          <span key={i} className={cn("h-3 flex-1 rounded-full", i <= index ? "bg-white" : "bg-white/30")} />
        ))}
      </div>
      <p className={cn("absolute text-[40px] font-bold text-white/80", wide ? "inset-x-24 top-22" : "inset-x-16 top-28")}>{script.title}</p>

      {section && (
        <div
          className={cn("absolute flex flex-col items-start", wide ? "top-[190px] left-24 w-[1180px] gap-6" : "inset-x-16 top-[300px] gap-8")}
          style={{ opacity: enter, transform: `translateY(${interpolate(enter, [0, 1], [60, 0])}px)` }}
        >
          <span className="rounded-full bg-magenta px-8 py-3 text-[40px] font-bold text-white">
            {KIND_LABEL[section.kind]}
            {section.kind === "step" && ` ${step}`}
          </span>
          <h1 className={cn("leading-[1.08] font-bold tracking-[-0.02em] text-white", wide ? "text-[76px]" : "text-[92px]")}>{section.caption}</h1>
          {section.formula && (
            <div
              className={cn(
                "self-stretch rounded-[48px] bg-white text-center font-bold text-ink shadow-[0_14px_0_var(--color-line)]",
                wide ? "mt-2 px-10 py-8 text-[80px]" : "mt-6 px-12 py-14 text-[96px]",
              )}
            >
              <FormulaText text={section.formula} className="justify-center" />
            </div>
          )}
        </div>
      )}

      <div className={cn("absolute inset-x-0", wide ? "bottom-[110px]" : "bottom-[260px]")}>
        <Subtitles timings={timings} section={index} ms={ms} wide={wide} />
      </div>
    </AbsoluteFill>
  );
}
