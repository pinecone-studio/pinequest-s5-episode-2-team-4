import { cn } from "@/lib/cn";
import { ElementBadge } from "./ElementBadge";
import { STAGE_LEVELS, type PetLine } from "./pet-lines";
import { PetSprite, SleepyZz } from "./PetSprite";

type PetLineCardProps = {
  line: PetLine;
  /** Index in the list, used to stagger the idle animation. */
  index: number;
  /** Stage the student's pet is in, if this is their line. */
  myStage?: number;
};

/** One pet line with its three evolutions. */
export function PetLineCard({ line, index, myStage }: PetLineCardProps) {
  const isMine = myStage !== undefined;

  return (
    <article
      aria-labelledby={`line-${line.id}`}
      className={cn(
        "rounded-[25px] bg-white p-[18px] md:rounded-panel md:px-8 md:pt-7 md:pb-8",
        isMine
          ? "shadow-float outline-3 -outline-offset-3 outline-primary"
          : "shadow-card",
      )}
    >
      <div className="flex items-center justify-between gap-2 md:gap-3">
        <h2
          id={`line-${line.id}`}
          className="text-[22px] leading-[1.1] font-bold md:text-[32px]"
        >
          {line.stages[0]}
        </h2>
        <ElementBadge element={line.element} />
      </div>

      <div className="mt-3.5 flex gap-1 md:mt-6 md:gap-2">
        {line.stages.map((name, stage) => {
          const mine = stage === myStage;
          return (
            <div key={name} className="contents">
              {stage > 0 && (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="mt-[42px] size-4 shrink-0 text-primary md:mt-[74px] md:size-5"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              )}
              <div className="flex min-w-0 flex-1 flex-col items-center md:gap-1">
                <div
                  className={cn(
                    "relative flex h-[100px] w-full items-center justify-center rounded-card md:h-[168px]",
                    mine
                      ? "pets-mine shadow-[inset_0_0_0_3px_var(--color-primary)]"
                      : "bg-surface",
                  )}
                >
                  {mine && (
                    <span className="absolute top-2 left-2 rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-white md:top-2.5 md:left-2.5 md:px-2.5 md:py-[3px] md:text-xs">
                      Чиний
                    </span>
                  )}
                  <PetSprite
                    className="size-16 md:size-32"
                    delay={(index * 0.7 + stage * 0.6) % 2}
                  />
                  <SleepyZz className="top-2 right-2 text-[11px] md:top-3.5 md:right-3.5 md:text-[13px]" />
                </div>
                <p className="mt-1.5 max-w-full truncate text-sm font-bold md:mt-2 md:text-xl">
                  {name}
                </p>
                <p className="text-xs text-ink-muted md:text-[15px]">
                  <span className="md:hidden">Түв.</span>
                  <span className="hidden md:inline">Түвшин</span>{" "}
                  {STAGE_LEVELS[stage]}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
