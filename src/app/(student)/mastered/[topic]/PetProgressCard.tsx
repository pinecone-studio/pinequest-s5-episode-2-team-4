import type { PetLevelUp } from "./data";
import { PetPlaceholder, SmileIcon } from "./icons";
import "./mastered.css";

/** The pet after leveling up: XP bar and a silhouette of its next form. */
export function PetProgressCard({ pet }: { pet: PetLevelUp }) {
  const xpPercent = Math.round((pet.xp / pet.xpMax) * 100);

  return (
    <div className="flex flex-col gap-3.5 rounded-[25px] bg-white p-5 shadow-card md:gap-[18px] md:rounded-panel md:p-6">
      <div className="flex items-center gap-3.5 md:gap-4">
        <div className="flex size-20 shrink-0 items-center justify-center rounded-card bg-surface md:size-32">
          <PetPlaceholder className="size-16 md:size-32" />
        </div>
        <div className="flex min-w-0 flex-col items-start gap-1.5 md:gap-2">
          <h2 className="text-[22px] leading-[1.15] font-bold md:text-2xl">
            {pet.to.name}
          </h2>
          <div className="flex flex-wrap gap-1.5 md:flex-col md:items-start md:gap-2">
            <span className="rounded-full bg-primary px-2.5 py-[3px] text-xs font-bold text-white md:px-3 md:py-1 md:text-[13px]">
              Түв. {pet.to.level}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky px-2.5 py-[3px] text-xs font-bold md:px-3 md:py-1 md:text-[13px]">
              <SmileIcon className="hidden size-3.5 md:block" />
              {pet.mood}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 text-[13px] font-bold md:text-sm">
          <span>
            {pet.xp} / {pet.xpMax} XP
          </span>
          <span className="rounded-full bg-surface px-2.5 py-0.5 text-primary">
            +{pet.xpGained}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Туршлагын оноо"
          aria-valuemin={0}
          aria-valuemax={pet.xpMax}
          aria-valuenow={pet.xp}
          className="h-3 overflow-hidden rounded-full bg-surface md:h-3.5"
        >
          <div
            className="mastered-grow h-full rounded-full bg-primary"
            style={{ width: `${xpPercent}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-card bg-surface p-2 md:p-2.5">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-tile bg-white">
          <PetPlaceholder className="size-16 opacity-20 brightness-0" />
        </div>
        <span className="text-sm font-bold md:text-[15px]">
          <span className="sr-only">Дараагийн хувьсал: </span>? · Түв.{" "}
          {pet.nextEvolutionLevel}
        </span>
      </div>
    </div>
  );
}
