import { Fragment, type ReactNode } from "react";
import { PetSprite } from "@/components/pet/PetSprite";
import { ProgressBar } from "@/components/ui";
import { cn } from "@/lib/cn";
import { EVOLVE_LEVELS, STAGE_LEVEL_LABELS, XP_PER_LEVEL, stageIndex } from "@/lib/pets";
import type { PetLine } from "@/lib/types";

type EvolutionPathProps = {
  line: PetLine;
  level: number;
  /** XP towards the next level, 0–100. */
  xp: number;
  /** False for a pet the student hasn't found yet: every form is locked. */
  discovered?: boolean;
  className?: string;
};

const checkIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-3.5 md:size-4.5">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const lockIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-3.25 md:size-4">
    <rect width="16" height="11" x="4" y="11" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

/** The circle a form sits in, with an optional badge on its bottom-right edge. */
function FormCircle({ className, badge, children }: { className: string; badge?: ReactNode; children: ReactNode }) {
  return (
    <span className={cn("relative flex size-22 shrink-0 items-center justify-center rounded-full md:size-35", className)}>
      {children}
      {badge}
    </span>
  );
}

function CircleBadge({ dark, children }: { dark?: boolean; children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "absolute -right-0.5 -bottom-0.5 flex size-7.5 items-center justify-center rounded-full border-3 border-white text-white md:size-9.5 md:border-4",
        dark ? "bg-primary-dark" : "bg-primary",
      )}
    >
      {children}
    </span>
  );
}

/**
 * «Хувьслын зам» (design: Тэжээвэр): the pet's three forms top to bottom.
 * Forms it has passed are ticked, «Чи энд» shows the XP to the next level,
 * and forms still ahead are locked silhouettes with the levels left.
 */
export function EvolutionPath({ line, level, xp, discovered = true, className }: EvolutionPathProps) {
  // An undiscovered pet has no current form, so all three are ahead.
  const current: number = discovered ? stageIndex(level) : -1;

  return (
    <section
      aria-labelledby="path-title"
      className={cn("md:rounded-panel md:bg-white md:p-8 md:shadow-card", className)}
    >
      <h2 id="path-title" className="text-2xl leading-[1.15] font-bold md:text-[32px] md:leading-[1.1]">
        Хувьслын зам
      </h2>
      <ol className="mt-4.5 flex flex-col md:mt-6">
        {line.stages.map((form, i) => (
          <Fragment key={form.name}>
            {i > 0 ? (
              <li
                aria-hidden="true"
                className={cn(
                  "ml-10.5 h-7.5 border-l-4 md:ml-17 md:h-7",
                  i <= current ? "border-primary" : "border-dashed border-line",
                )}
              />
            ) : null}
            <li className="flex items-center gap-4 md:gap-5">
              {i < current ? (
                <>
                  <FormCircle className="bg-sky" badge={<CircleBadge>{checkIcon}</CircleBadge>}>
                    <PetSprite stage={form} size={128} className="max-h-16 max-w-16 md:max-h-none md:max-w-none" />
                  </FormCircle>
                  <span className="flex flex-col items-start gap-0.5 md:gap-1">
                    <span className="text-lg font-bold md:text-2xl md:leading-[1.1]">{form.name}</span>
                    <span className="text-[13px] font-semibold text-ink-muted md:text-[15px]">
                      {STAGE_LEVEL_LABELS[i]} · Хувьссан
                    </span>
                  </span>
                </>
              ) : i === current ? (
                <>
                  <FormCircle className="pets-path-now border-4 border-primary bg-white md:border-5">
                    <PetSprite stage={form} size={128} className="pets-bob max-h-16 max-w-16 md:max-h-none md:max-w-none" />
                  </FormCircle>
                  <span className="flex min-w-0 flex-1 flex-col items-start gap-1.5 md:gap-2">
                    <span className="flex items-center gap-2 md:gap-2.5">
                      <span className="text-lg font-bold md:text-2xl md:leading-[1.1]">{form.name}</span>
                      <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-white md:px-3 md:text-[13px]">
                        Чи энд
                      </span>
                    </span>
                    <span className="text-[13px] font-semibold text-ink-muted md:text-[15px]">{STAGE_LEVEL_LABELS[i]}</span>
                    <ProgressBar value={(xp / XP_PER_LEVEL) * 100} label={`Түвшин ${level + 1} хүртэл`} size="sm" className="w-full" />
                    <span className="text-xs font-bold md:text-sm">
                      {xp} / {XP_PER_LEVEL} XP
                    </span>
                  </span>
                </>
              ) : (
                <>
                  <FormCircle
                    className="border-3 border-dashed border-line bg-surface md:border-4"
                    badge={<CircleBadge dark>{lockIcon}</CircleBadge>}
                  >
                    <PetSprite
                      stage={form}
                      size={128}
                      className="pets-path-locked max-h-16 max-w-16 opacity-20 brightness-0 md:max-h-none md:max-w-none"
                    />
                  </FormCircle>
                  <span className="flex flex-col items-start gap-1 md:gap-1.5">
                    <span className="text-lg font-bold md:text-2xl md:leading-[1.1]">
                      <span aria-hidden="true">???</span>
                      <span className="sr-only">Нууц хувьсал</span>
                    </span>
                    <span className="text-[13px] font-semibold text-ink-muted md:text-[15px]">{STAGE_LEVEL_LABELS[i]}</span>
                    {discovered ? (
                      <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-bold md:px-3 md:text-[13px]">
                        {EVOLVE_LEVELS[i - 1] - level} түвшин үлдсэн
                      </span>
                    ) : null}
                  </span>
                </>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </section>
  );
}
