import { ElementBadge } from "@/components/pet/ElementBadge";
import { cn } from "@/lib/cn";
import type { PetElement, PetStage } from "@/lib/types";
import { AnimatedSprite, HappyStars, SleepyZz } from "./AnimatedSprite";

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  className: "size-[18px]",
} as const;

const MOODS = [
  {
    id: "awake",
    label: "Сэргэлэн",
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2m-7.07-17.07 1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
    ),
  },
  {
    id: "happy",
    label: "Баяртай",
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
      </svg>
    ),
  },
  {
    id: "sleepy",
    label: "Нойрмог",
    icon: (
      <svg {...iconProps}>
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>
    ),
  },
];

type MyPetCardProps = {
  stage: PetStage;
  level: number;
  element: PetElement;
  className?: string;
};

/** The student's pet with the mood picker that drives every sprite on the page. */
export function MyPetCard({ stage, level, element, className }: MyPetCardProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-3.5 rounded-[25px] bg-white p-4 shadow-float md:flex-row md:flex-wrap md:items-center md:gap-6 md:rounded-panel md:p-6",
        className,
      )}
    >
      <div className="pets-hero relative flex h-[216px] items-center justify-center overflow-hidden rounded-card md:h-60 md:flex-[0_0_240px]">
        <AnimatedSprite stage={stage} mobile={192} desktop={192} />
        <SleepyZz className="top-7 right-12 text-base md:top-[30px] md:right-7 md:text-lg" />
        <HappyStars size="lg" />
      </div>

      <div className="flex min-w-0 flex-col gap-3.5 md:flex-[1_1_240px] md:gap-4">
        <div className="flex flex-wrap items-center gap-2 md:gap-2.5">
          <h2 className="text-2xl leading-[1.15] font-bold md:text-[32px] md:leading-[1.1]">
            {stage.name}
            <span className="sr-only">, чиний тэжээвэр</span>
          </h2>
          <span className="rounded-full bg-primary px-2.5 py-[3px] text-xs font-bold text-white md:px-3 md:py-1 md:text-[13px]">
            Түв. {level}
          </span>
          <ElementBadge element={element} />
        </div>

        {/* Three columns at every width: in a row the labels wrap on desktop */}
        <fieldset className="grid min-w-0 grid-cols-3 gap-1.5 rounded-[25px] bg-surface p-1.5">
          <legend className="sr-only">Сэтгэл санаа</legend>
          {MOODS.map((mood) => (
            <label
              key={mood.id}
              className="flex min-h-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-card px-1 py-1.5 text-[13px] font-bold has-checked:bg-primary has-checked:text-white has-focus-visible:outline-3 has-focus-visible:outline-offset-3 has-focus-visible:outline-primary md:text-[15px]"
            >
              <input
                type="radio"
                name="mood"
                id={`mood-${mood.id}`}
                value={mood.id}
                defaultChecked={mood.id === "awake"}
                className="sr-only"
              />
              {mood.icon}
              {mood.label}
            </label>
          ))}
        </fieldset>
      </div>
    </div>
  );
}
