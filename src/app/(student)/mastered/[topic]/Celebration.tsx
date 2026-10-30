import type { CSSProperties } from "react";
import { ButtonLink } from "@/components/ui";
import type { PetLevelUp } from "@/lib/types";
import { ArrowRightIcon, ArrowUpIcon, StarIcon } from "./icons";
import { ResponsiveSprite } from "./ResponsiveSprite";
import "./mastered.css";

type Confetto = {
  left: number;
  top: number;
  w: number;
  h: number;
  /** Tailwind classes for fill and optional border */
  tone: string;
  dx: number;
  dy: number;
  r: number;
};

// Positions are % of the panel; dx/dy are where each piece starts (px).
const CONFETTI: Confetto[] = [
  { left: 8, top: 10, w: 10, h: 10, tone: "bg-primary", dx: 336, dy: 204, r: 20 },
  { left: 16, top: 30, w: 8, h: 14, tone: "bg-magenta", dx: 272, dy: 68, r: -30 },
  { left: 22, top: 6, w: 12, h: 12, tone: "bg-sky border-2 border-primary", dx: 224, dy: 231, r: 45 },
  { left: 30, top: 18, w: 8, h: 8, tone: "bg-ink", dx: 160, dy: 150, r: 0 },
  { left: 40, top: 4, w: 10, h: 10, tone: "bg-magenta", dx: 80, dy: 245, r: 15 },
  { left: 58, top: 5, w: 8, h: 14, tone: "bg-primary", dx: -64, dy: 231, r: -20 },
  { left: 88, top: 6, w: 10, h: 10, tone: "bg-sky border-2 border-primary", dx: -304, dy: 231, r: 30 },
  { left: 76, top: 3, w: 10, h: 10, tone: "bg-ink", dx: -208, dy: 252, r: -45 },
  { left: 94, top: 22, w: 12, h: 12, tone: "bg-magenta", dx: -352, dy: 122, r: 10 },
  { left: 90, top: 44, w: 8, h: 14, tone: "bg-primary", dx: -320, dy: -27, r: 60 },
  { left: 5, top: 46, w: 10, h: 10, tone: "bg-magenta", dx: 360, dy: -41, r: 25 },
  { left: 12, top: 64, w: 8, h: 8, tone: "bg-primary", dx: 304, dy: -150, r: 0 },
  { left: 95, top: 66, w: 8, h: 8, tone: "bg-ink", dx: -360, dy: -163, r: 40 },
  { left: 49, top: 2, w: 8, h: 8, tone: "bg-sky border-2 border-ink", dx: 8, dy: 258, r: 0 },
  { left: 82, top: 30, w: 6, h: 12, tone: "bg-magenta", dx: -256, dy: 68, r: -35 },
  { left: 4, top: 22, w: 6, h: 6, tone: "bg-ink", dx: 368, dy: 122, r: 0 },
  { left: 68, top: 12, w: 6, h: 6, tone: "bg-magenta", dx: -144, dy: 190, r: 0 },
];

type CelebrationProps = {
  score: { correct: number; total: number };
  pet: PetLevelUp;
  /** Lesson title of the mastered subtopic */
  heading: string;
  /** Where "Үргэлжлүүлэх" leads */
  nextHref: string;
};

/** Win panel: score, pet evolution, title and next actions. */
export function Celebration({ score, pet, heading, nextHref }: CelebrationProps) {
  const percent = Math.round((score.correct / score.total) * 100);
  const evolved = pet.from.stage.name !== pet.to.stage.name;

  return (
    <section
      aria-labelledby="mastered-title"
      className="mastered-panel relative flex min-w-0 flex-col items-center overflow-hidden rounded-[25px] px-5 pt-6 pb-7 shadow-float md:flex-[999_1_640px] md:rounded-panel md:px-12 md:pt-8 md:pb-12"
    >
      <div aria-hidden="true">
        {CONFETTI.map((c, i) => (
          <span
            key={i}
            className={`mastered-confetti absolute rounded-[2px] ${c.tone}`}
            style={
              {
                left: `${c.left}%`,
                top: `${c.top}%`,
                width: c.w,
                height: c.h,
                "--dx": `${c.dx}px`,
                "--dy": `${c.dy}px`,
                "--r": `${c.r}deg`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <p className="relative inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-base font-bold shadow-card md:gap-2 md:px-[18px] md:py-2">
        <StarIcon className="size-4 md:size-[18px]" />
        <span className="sr-only">
          Давтан тестийн дүн: {score.correct}/{score.total} зөв, {percent} хувь
        </span>
        <span aria-hidden="true">
          {score.correct}/{score.total} · {percent}%
        </span>
      </p>

      <div
        role="img"
        aria-label={
          evolved
            ? `${pet.from.stage.name} (түв. ${pet.from.level}) хувьсаж ${pet.to.stage.name} (түв. ${pet.to.level}) боллоо.`
            : `${pet.to.stage.name} ахилаа: түв. ${pet.from.level} → ${pet.to.level}.`
        }
        className="relative mt-5 flex items-center justify-center gap-1.5 md:mt-6 md:flex-wrap md:gap-6"
      >
        <div className="flex flex-col items-center gap-1.5 md:gap-2">
          <div className="flex size-20 items-center justify-center rounded-card bg-white/70 md:size-[150px] md:rounded-[25px]">
            <ResponsiveSprite
              stage={pet.from.stage}
              mobile={64}
              desktop={128}
              className="mastered-blink opacity-85"
            />
          </div>
          <span className="text-xs font-bold text-ink-muted md:text-sm">
            Түв. {pet.from.level}
          </span>
        </div>

        <svg
          viewBox="0 0 22 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="h-4 w-[22px] shrink-0 text-primary md:hidden"
        >
          <path d="M2 8h16" />
          <path d="m13 3 5 5-5 5" />
        </svg>
        <svg
          viewBox="0 0 56 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="hidden h-5 w-14 shrink-0 text-primary md:block"
        >
          <path d="M2 10h48" />
          <path d="m42 3 8 7-8 7" />
        </svg>

        <div className="relative size-[196px] shrink-0 md:size-80">
          <div aria-hidden="true" className="absolute inset-0 overflow-hidden rounded-full">
            <div className="mastered-ring absolute -inset-6 md:-inset-10" />
          </div>
          <div
            aria-hidden="true"
            className="mastered-ring-inner absolute inset-2 rounded-full md:inset-3"
          />
          <div
            aria-hidden="true"
            className="mastered-flash absolute -inset-[30px] rounded-full md:-inset-10"
          />
          <div className="mastered-cheer absolute top-[-4px] left-0.5 size-48 md:top-6 md:left-8 md:size-64">
            <ResponsiveSprite
              stage={pet.to.stage}
              mobile={192}
              desktop={256}
              className="mastered-evolve"
            />
          </div>
          <span className="mastered-pop absolute top-[-6px] left-28 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-[7px] text-sm font-bold whitespace-nowrap text-white shadow-3d md:top-2 md:left-[212px] md:gap-1.5 md:px-4 md:py-2.5 md:text-base">
            <ArrowUpIcon className="size-[13px] md:size-4" />
            Түв. {pet.to.level}
          </span>
          <span className="absolute top-[178px] left-1/2 -translate-x-1/2 rounded-full bg-white px-3.5 py-1 text-sm font-bold whitespace-nowrap shadow-card md:top-[292px] md:px-4 md:py-1.5 md:text-base">
            {pet.to.stage.name}
          </span>
        </div>
      </div>

      <h1
        id="mastered-title"
        className="relative mt-8 text-center text-4xl leading-none font-bold tracking-[-0.03em] md:mt-10 md:text-6xl"
      >
        Эзэмшсэн!
      </h1>
      <p className="relative mt-2 text-center text-base font-bold text-primary md:mt-3 md:text-xl">
        {heading}
      </p>

      {/* Primary action first for keyboard order; shown second on desktop */}
      <div className="relative mt-5 flex flex-col gap-3 self-stretch md:mt-7 md:flex-row-reverse md:flex-wrap md:justify-center md:gap-4 md:self-auto">
        <ButtonLink href={nextHref}>
          Үргэлжлүүлэх
          <ArrowRightIcon className="size-[18px] md:size-5" />
        </ButtonLink>
        <ButtonLink href="/pets" variant="white">
          Тэжээвэр
        </ButtonLink>
      </div>
    </section>
  );
}
