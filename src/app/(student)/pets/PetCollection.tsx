"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PetSprite } from "@/components/pet/PetSprite";
import { Button, ProgressBar } from "@/components/ui";
import { chooseBattlePet } from "@/lib/battle-actions";
import { cn } from "@/lib/cn";
import { stageIndex } from "@/lib/pets";
import type { OwnedPet, PetLine } from "@/lib/types";
import { RARITY_LABELS, RARITY_STYLES } from "./battle/labels";
import { PetLineCard } from "./PetLineCard";

type PetCollectionProps = {
  lines: PetLine[];
  /** The student's pets; the active one fights in boss battles. */
  owned: OwnedPet[];
  /** Boss names that can drop each pet line's egg. */
  dropsFrom: Record<string, string[]>;
};

/**
 * All pet lines as small tiles: owned ones in colour, the rest as
 * silhouettes. The tapped one shows its stages, or where to find it.
 */
export function PetCollection({ lines, owned, dropsFrom }: PetCollectionProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const active = owned.find((p) => p.active);
  const [selectedId, setSelectedId] = useState(active?.lineId ?? lines[0]?.id);
  const selectedIndex = Math.max(0, lines.findIndex((l) => l.id === selectedId));
  const selected = lines[selectedIndex];
  const mine = owned.find((p) => p.lineId === selected?.id);

  function choose(lineId: string) {
    startTransition(async () => {
      await chooseBattlePet(lineId);
      router.refresh();
    });
  }

  return (
    <section
      aria-labelledby="collection-title"
      className="mt-6 rounded-[25px] bg-white p-4.5 shadow-card md:mt-8 md:rounded-panel md:px-8 md:pt-7 md:pb-8"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="collection-title" className="text-[22px] leading-[1.1] font-bold md:text-[32px]">
          Цуглуулга
        </h2>
        <span className="text-sm font-bold text-ink-muted md:text-[15px]">
          {owned.length}/{lines.length}
        </span>
      </div>
      <ProgressBar
        value={(owned.length / lines.length) * 100}
        label="Цуглуулгын явц"
        size="sm"
        className="mt-3"
      />

      <div
        role="group"
        aria-labelledby="collection-title"
        className="mt-4 grid grid-cols-4 gap-2 md:mt-6 md:grid-cols-6 md:gap-3"
      >
        {lines.map((line) => {
          const on = line.id === selected?.id;
          const pet = owned.find((p) => p.lineId === line.id);
          return (
            <button
              key={line.id}
              type="button"
              aria-pressed={on}
              aria-label={
                pet
                  ? `${line.stages[0].name}, түвшин ${pet.level}${pet.active ? ", тулаанд орж байгаа" : ""}`
                  : "Олдоогүй тэжээвэр"
              }
              onClick={() => setSelectedId(line.id)}
              className={cn(
                "relative flex h-18 cursor-pointer items-center justify-center rounded-card border-3 transition-transform hover:-translate-y-0.75 active:translate-y-0.5 md:h-24",
                on ? "border-primary bg-white shadow-[0_5px_0_var(--color-primary-dark)]" : "border-surface bg-surface",
              )}
            >
              <PetSprite
                stage={line.stages[pet ? stageIndex(pet.level) : 0]}
                size={56}
                className={pet ? undefined : "opacity-40 brightness-0"}
              />
              {pet?.active ? (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold whitespace-nowrap text-white md:text-[11px]">
                  Тулаанд
                </span>
              ) : null}
              {pet ? (
                <span className="absolute right-1 bottom-1 rounded-full bg-white/90 px-1.5 text-[10px] font-bold md:text-xs">
                  {pet.level}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {selected ? (
        <div aria-live="polite" className="mt-5 border-t-2 border-dashed border-lavender pt-5 md:mt-7 md:pt-7">
          {mine ? (
            <>
              <PetLineCard
                key={selected.id}
                line={selected}
                index={selectedIndex}
                myStage={stageIndex(mine.level)}
                variant="flat"
              />
              <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="font-bold">
                  Түвшин {mine.level} · <span className="text-ink-muted">{mine.exp}/100 EXP</span>{" "}
                  <span className={cn("ml-1 rounded-full px-2 py-0.5 text-xs", RARITY_STYLES[selected.rarity])}>
                    {RARITY_LABELS[selected.rarity]}
                  </span>
                </p>
                {mine.active ? (
                  <span className="rounded-full bg-primary px-3 py-1.5 text-center text-sm font-bold text-white">
                    Тулаанд орж байгаа
                  </span>
                ) : (
                  <Button size="sm" disabled={pending} onClick={() => choose(selected.id)}>
                    Тулаанд оруулах
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <PetSprite stage={selected.stages[0]} size={96} className="opacity-40 brightness-0" />
              <p className="text-xl font-bold">Олдоогүй тэжээвэр</p>
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", RARITY_STYLES[selected.rarity])}>
                {RARITY_LABELS[selected.rarity]}
              </span>
              <p className="text-ink-muted">
                {dropsFrom[selected.id]?.length
                  ? `Өндөг нь олдох газар: ${dropsFrom[selected.id].join(", ")}`
                  : "Боссын өндөгнөөс олдоно."}
              </p>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
