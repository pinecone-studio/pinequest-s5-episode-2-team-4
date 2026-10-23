"use client";

import { useState } from "react";
import { PetSprite } from "@/components/pet/PetSprite";
import { cn } from "@/lib/cn";
import type { PetLine } from "@/lib/types";
import { PetLineCard } from "./PetLineCard";

type PetCollectionProps = {
  lines: PetLine[];
  /** The student's pet line, opened first. */
  myLineId?: string;
  /** Stage the student's pet is in. */
  myStage?: number;
};

/** All pet lines as small tiles; the tapped one shows its three stages. */
export function PetCollection({
  lines,
  myLineId,
  myStage,
}: PetCollectionProps) {
  const [selectedId, setSelectedId] = useState(myLineId ?? lines[0]?.id);
  const selectedIndex = Math.max(
    0,
    lines.findIndex((l) => l.id === selectedId),
  );
  const selected = lines[selectedIndex];

  return (
    <section
      aria-labelledby="collection-title"
      className="mt-6 rounded-[25px] bg-white p-4.5 shadow-card md:mt-8 md:rounded-panel md:px-8 md:pt-7 md:pb-8"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2
          id="collection-title"
          className="text-[22px] leading-[1.1] font-bold md:text-[32px]"
        >
          Цуглуулга
        </h2>
        <span className="text-sm font-bold text-ink-muted md:text-[15px]"></span>
      </div>

      <div
        role="group"
        aria-labelledby="collection-title"
        className="mt-4 grid grid-cols-4 gap-2 md:mt-6 md:grid-cols-6 md:gap-3"
      >
        {lines.map((line) => {
          const on = line.id === selected?.id;
          const mine = line.id === myLineId;
          return (
            <button
              key={line.id}
              type="button"
              aria-pressed={on}
              aria-label={`${line.stages[0].name}${mine ? ", чиний тэжээвэр" : ""}`}
              onClick={() => setSelectedId(line.id)}
              className={cn(
                "relative flex h-18 cursor-pointer items-center justify-center rounded-card border-3 transition-transform hover:-translate-y-0.75 active:translate-y-0.5 md:h-24",
                on
                  ? "border-primary bg-white shadow-[0_5px_0_var(--color-primary-dark)]"
                  : "border-surface bg-surface",
              )}
            >
              <PetSprite stage={line.stages[0]} size={56} />
              {mine && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white md:text-[11px]">
                  Чиний
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selected && (
        <div
          aria-live="polite"
          className="mt-5 border-t-2 border-dashed border-lavender pt-5 md:mt-7 md:pt-7"
        >
          <PetLineCard
            key={selected.id}
            line={selected}
            index={selectedIndex}
            myStage={selected.id === myLineId ? myStage : undefined}
            variant="flat"
          />
        </div>
      )}
    </section>
  );
}
