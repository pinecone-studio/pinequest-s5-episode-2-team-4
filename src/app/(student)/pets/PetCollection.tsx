"use client";

import { useRouter } from "next/navigation";
import { Fragment, type ReactNode, useState, useTransition } from "react";
import { ELEMENT_COLORS, ElementBadge } from "@/components/pet/ElementBadge";
import { PetSprite } from "@/components/pet/PetSprite";
import { Button } from "@/components/ui";
import { chooseBattlePet } from "@/lib/battle-actions";
import { cn } from "@/lib/cn";
import { ELEMENT_LABELS, STAGE_LEVEL_LABELS, stageIndex } from "@/lib/pets";
import type { OwnedPet, PetElement, PetLine } from "@/lib/types";
import { RARITY_LABELS, RARITY_STYLES } from "./battle/labels";

type PetCollectionProps = {
  lines: PetLine[];
  /** The student's pets; the active one fights in boss battles. */
  owned: OwnedPet[];
  /** Boss names that can drop each pet line's egg. */
  dropsFrom: Record<string, string[]>;
  /** The line of the student's own pet (picked at signup). */
  myLineId?: string;
  /** The pet in the detail card, also shown at the top of the page; null when the card is closed. */
  selectedId: string | null;
  onSelect: (lineId: string | null) => void;
};

type Filter = "all" | PetElement;

const FILTERS: Filter[] = ["all", "water", "fire", "wood", "ice", "sky", "metal", "earth", "shadow"];

/** Icon per type filter, drawn as a 24×24 stroke path. */
const FILTER_ICONS: Record<Filter, string> = {
  all: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  water: "M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z",
  fire: "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z",
  wood: "M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10ZM2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12",
  ice: "M2 12h20M12 2v20M20 16l-4-4 4-4M4 8l4 4-4 4M16 4l-4 4-4-4M8 20l4-4 4 4",
  sky: "M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2M9.6 4.6A2 2 0 1 1 11 8H2M12.6 19.4A2 2 0 1 0 14 16H2",
  metal: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
  earth: "M8 3l4 8 5-5 5 15H2L8 3z",
  shadow: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z",
};

const checkIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-3.5">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const lockIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-3">
    <rect width="16" height="11" x="4" y="11" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

/** A round badge pinned to a tile's top-right corner. */
function CornerBadge({ dark, children }: { dark?: boolean; children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full border-3 border-white text-white",
        dark ? "bg-primary-dark" : "bg-primary",
      )}
    >
      {children}
    </span>
  );
}

/**
 * All pet lines (design: Тэжээвэр · Цуглуулга): type filters, a grid of
 * tiles and a detail card with the line's forms. Pets the student doesn't
 * own stay silhouettes and say where their egg drops; forms an owned pet
 * hasn't reached yet stay locked.
 */
export function PetCollection({ lines, owned, dropsFrom, myLineId, selectedId, onSelect }: PetCollectionProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState<Filter>("all");
  /** The form picked in the detail card; null shows the pet's current one. */
  const [pickedStage, setPickedStage] = useState<number | null>(null);

  const shown = lines.filter((l) => filter === "all" || l.element === filter);
  const selected = lines.find((l) => l.id === selectedId);
  const ownedPet = (lineId: string) => owned.find((p) => p.lineId === lineId);

  function select(lineId: string) {
    onSelect(lineId);
    setPickedStage(null);
  }

  function choose(lineId: string) {
    startTransition(async () => {
      await chooseBattlePet(lineId);
      router.refresh();
    });
  }

  return (
    <section aria-labelledby="collection-title" className="mt-8 md:mt-14">
      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-4">
        <h2 id="collection-title" className="flex items-baseline gap-3 type-section-title">
          Цуглуулга
          <span className="text-sm font-bold tracking-normal text-ink-muted md:text-base">
            {owned.length}/{lines.length}
          </span>
        </h2>
        <div
          role="group"
          aria-label="Төрөл"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pt-1 pb-2.5 md:mx-0 md:flex-wrap md:overflow-visible md:p-0"
        >
          {FILTERS.map((f) => {
            const on = f === filter;
            return (
              <button
                key={f}
                type="button"
                aria-pressed={on}
                onClick={() => setFilter(f)}
                className={cn(
                  "inline-flex min-h-12 shrink-0 cursor-pointer items-center gap-2 rounded-full border-2 pr-3.5 pl-1.5 text-sm font-bold transition-transform hover:-translate-y-0.5 active:translate-y-1 active:shadow-none md:min-h-13 md:pr-4.5 md:text-base",
                  on
                    ? "border-primary bg-primary text-white shadow-[0_4px_0_var(--color-primary-dark)]"
                    : "border-lavender bg-white text-ink shadow-[0_4px_0_var(--color-lavender)]",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border-2 md:size-9",
                    f === "all" ? (on ? "bg-white text-primary" : "bg-primary text-white") : ELEMENT_COLORS[f],
                    on ? "border-white" : f === "earth" ? "border-ink" : "border-transparent",
                  )}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="size-4 md:size-4.5">
                    <path d={FILTER_ICONS[f]} />
                  </svg>
                </span>
                {f === "all" ? "Бүгд" : ELEMENT_LABELS[f]}
                {on ? checkIcon : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3.5 flex flex-col gap-3.5 md:mt-6 xl:grid xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start xl:gap-7">
        <div className="grid grid-cols-3 gap-2.5 md:grid-cols-4 md:gap-3.5">
          {shown.map((line) => {
            const on = line.id === selectedId;
            const pet = ownedPet(line.id);
            const stage = line.stages[pet ? stageIndex(pet.level) : 0];
            const isMine = line.id === myLineId;
            return (
              <button
                key={line.id}
                type="button"
                aria-pressed={on}
                aria-label={
                  pet
                    ? `${stage.name}, түвшин ${pet.level}${isMine ? ", чиний тэжээвэр" : ""}${pet.active ? ", тулаанд орж байгаа" : ""}`
                    : `Олдоогүй тэжээвэр, ${ELEMENT_LABELS[line.element]}`
                }
                onClick={() => select(line.id)}
                className={cn(
                  "relative flex h-31 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-card border-3 px-1 py-2 text-ink transition-transform hover:-translate-y-0.75 active:translate-y-0.5 md:h-40 xl:h-49 xl:p-2",
                  on ? "border-primary bg-white shadow-[0_5px_0_var(--color-primary-dark)]" : "border-surface bg-surface",
                )}
              >
                <PetSprite
                  stage={stage}
                  size={128}
                  className={cn(
                    "max-h-16 max-w-16 md:max-h-24 md:max-w-24 xl:max-h-none xl:max-w-none",
                    !pet && "opacity-40 brightness-0",
                  )}
                />
                <span className="max-w-full truncate text-sm leading-tight font-bold xl:text-lg">
                  {pet ? stage.name : "???"}
                </span>
                <span className="text-xs leading-tight font-semibold text-ink-muted xl:text-sm">
                  {pet ? `Түв. ${pet.level}` : ELEMENT_LABELS[line.element]}
                </span>
                {pet?.active ? (
                  <span
                    aria-hidden="true"
                    className="absolute top-1.5 left-1.5 rounded-full bg-primary px-2 text-2xs font-bold text-white xl:top-2.5 xl:left-2.5 xl:px-2.5 xl:text-xs"
                  >
                    Тулаанд
                  </span>
                ) : null}
                {on ? <CornerBadge>{checkIcon}</CornerBadge> : null}
              </button>
            );
          })}
        </div>

        {selected ? (
          <PetDetail
            key={selected.id}
            line={selected}
            pet={ownedPet(selected.id)}
            pickedStage={pickedStage}
            onPickStage={setPickedStage}
            onClose={() => onSelect(null)}
            dropsFrom={dropsFrom[selected.id] ?? []}
            pending={pending}
            onChoose={() => choose(selected.id)}
          />
        ) : null}
      </div>
    </section>
  );
}

type PetDetailProps = {
  line: PetLine;
  pet: OwnedPet | undefined;
  pickedStage: number | null;
  onPickStage: (stage: number) => void;
  onClose: () => void;
  dropsFrom: string[];
  pending: boolean;
  onChoose: () => void;
};

/**
 * The selected line: big sprite, name and its three forms. Sits above the
 * grid on phones and tablets (× closes it), and beside it on wide screens.
 */
function PetDetail({ line, pet, pickedStage, onPickStage, onClose, dropsFrom, pending, onChoose }: PetDetailProps) {
  const current = pet ? stageIndex(pet.level) : 0;
  const stage = pet ? Math.min(pickedStage ?? current, current) : 0;

  return (
    <aside
      aria-labelledby="pet-detail-name"
      className="pets-detail-in relative order-first rounded-[25px] bg-white p-3.5 shadow-float xl:sticky xl:top-28 xl:order-last xl:rounded-panel xl:p-5"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Хаах"
        className="absolute top-1.5 right-1.5 flex size-12 cursor-pointer items-center justify-center rounded-full text-ink xl:hidden"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-5">
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>

      <div aria-live="polite" className="flex items-center gap-3.5 xl:block">
        <div className="pets-hero relative flex size-35 shrink-0 items-center justify-center overflow-hidden rounded-card xl:h-75 xl:w-full">
          <PetSprite
            stage={line.stages[stage]}
            size={256}
            className={cn("pets-bob max-h-32 max-w-32 xl:max-h-none xl:max-w-none", !pet && "opacity-40 brightness-0")}
          />
          <span className="absolute top-3.5 right-3.5 hidden xl:block">
            <ElementBadge element={line.element} />
          </span>
        </div>
        <div className="flex min-w-0 flex-col items-start gap-1.5 pr-9 xl:mt-4 xl:flex-row xl:items-baseline xl:justify-between xl:gap-2 xl:pr-0">
          <ElementBadge element={line.element} className="xl:hidden" />
          <h3 id="pet-detail-name" className="text-2xl leading-[1.1] font-bold xl:text-3xl">
            {pet ? line.stages[stage].name : "Олдоогүй тэжээвэр"}
          </h3>
          {pet ? (
            <span className="text-sm font-bold text-ink-muted xl:text-base">{STAGE_LEVEL_LABELS[stage]}</span>
          ) : null}
        </div>
      </div>

      <div role="group" aria-label="Хувьсал" className="mt-3 flex items-center gap-1 xl:mt-4 xl:gap-1.5">
        {line.stages.map((form, i) => {
          const open = pet !== undefined && i <= current;
          const on = open && i === stage;
          return (
            <Fragment key={form.name}>
              {i > 0 ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-4 shrink-0 text-primary xl:size-4.5">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              ) : null}
              {open ? (
                <button
                  type="button"
                  aria-pressed={on}
                  aria-label={`${form.name}, ${STAGE_LEVEL_LABELS[i]}`}
                  onClick={() => onPickStage(i)}
                  className={cn(
                    "relative flex h-19.5 min-w-0 flex-1 cursor-pointer items-center justify-center rounded-card border-3 transition-transform hover:-translate-y-0.75 active:translate-y-0.5 xl:h-24",
                    on ? "border-primary bg-white shadow-[0_4px_0_var(--color-primary-dark)]" : "border-surface bg-surface",
                  )}
                >
                  <PetSprite stage={form} size={64} />
                  {on ? <CornerBadge>{checkIcon}</CornerBadge> : null}
                </button>
              ) : (
                <span
                  role="img"
                  aria-label={`Нууц хувьсал, ${STAGE_LEVEL_LABELS[i]}`}
                  className="relative flex h-19.5 min-w-0 flex-1 items-center justify-center rounded-card border-3 border-dashed border-line bg-surface xl:h-24"
                >
                  <PetSprite stage={form} size={64} className="opacity-20 brightness-0" />
                  <CornerBadge dark>{lockIcon}</CornerBadge>
                </span>
              )}
            </Fragment>
          );
        })}
      </div>

      <div className="mt-4 border-t-2 border-dashed border-lavender pt-4">
        {pet ? (
          <div className="flex flex-col gap-3">
            <p className="font-bold">
              Түвшин {pet.level} · <span className="text-ink-muted">{pet.exp}/100 EXP</span>{" "}
              <span lang="en" className={cn("ml-1 rounded-full px-2 py-0.5 text-xs", RARITY_STYLES[line.rarity])}>
                {RARITY_LABELS[line.rarity]}
              </span>
            </p>
            {pet.active ? (
              <span className="rounded-full bg-primary px-3 py-1.5 text-center text-sm font-bold text-white">
                Тулаанд орж байгаа
              </span>
            ) : (
              <Button size="sm" disabled={pending} onClick={onChoose}>
                Тулаанд оруулах
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-start gap-2">
            <span lang="en" className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", RARITY_STYLES[line.rarity])}>
              {RARITY_LABELS[line.rarity]}
            </span>
            <p className="text-ink-muted">
              {dropsFrom.length ? `Өндөг нь олдох газар: ${dropsFrom.join(", ")}` : "Боссын өндөгнөөс олдоно."}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
