import { PetSprite } from "@/components/pet/PetSprite";
import type { PetLevelUp, PetStage } from "@/lib/types";
import { SmileIcon } from "./icons";
import { ResponsiveSprite } from "./ResponsiveSprite";
import "./mastered.css";

type PetProgressCardProps = {
  pet: PetLevelUp;
  /** Shown as a silhouette; omitted at the last evolution. */
  nextStage?: PetStage;
};

/** The pet after leveling up: XP bar and a silhouette of its next form. */
export function PetProgressCard({ pet, nextStage }: PetProgressCardProps) {
  return (
    <div className="flex flex-col gap-3.5 rounded-[25px] bg-white p-5 shadow-card md:gap-[18px] md:rounded-panel md:p-6">
      <div className="flex items-center gap-3.5 md:gap-4">
        <div className="flex size-20 shrink-0 items-center justify-center rounded-card bg-surface md:size-32">
          <ResponsiveSprite stage={pet.to.stage} mobile={64} desktop={128} />
        </div>
        <div className="flex min-w-0 flex-col items-start gap-1.5 md:gap-2">
          <h2 className="type-section-title">
            {pet.to.stage.name}
          </h2>
          <div className="flex flex-wrap gap-1.5 md:flex-col md:items-start md:gap-2">
            <span className="rounded-full bg-primary px-2.5 py-[3px] text-xs font-bold text-white md:px-3 md:py-1 md:text-sm">
              Түв. {pet.to.level}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky px-2.5 py-[3px] text-xs font-bold md:px-3 md:py-1 md:text-sm">
              <SmileIcon className="hidden size-3.5 md:block" />
              {pet.mood}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 text-sm font-bold">
          <span>{pet.xp} / 100 XP</span>
          <span className="rounded-full bg-surface px-2.5 py-0.5 text-primary">
            +{pet.xpGained}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Туршлагын оноо"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pet.xp}
          className="h-3 overflow-hidden rounded-full bg-surface md:h-3.5"
        >
          <div
            className="mastered-grow h-full rounded-full bg-primary"
            style={{ width: `${pet.xp}%` }}
          />
        </div>
      </div>

      {nextStage && pet.nextEvolutionLevel && (
        <div className="flex items-center gap-3 rounded-card bg-surface p-2 md:p-2.5">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-tile bg-white">
            <PetSprite
              stage={nextStage}
              size={64}
              className="opacity-20 brightness-0"
            />
          </div>
          <span className="text-sm font-bold md:text-base">
            <span className="sr-only">Дараагийн хувьсал: </span>? · Түв.{" "}
            {pet.nextEvolutionLevel}
          </span>
        </div>
      )}
    </div>
  );
}
