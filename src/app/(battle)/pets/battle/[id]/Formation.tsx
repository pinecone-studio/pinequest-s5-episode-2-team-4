"use client";

import { useCallback, useEffect, useState } from "react";
import { PetSprite } from "@/components/pet/PetSprite";
import { cn } from "@/lib/cn";
import type { PetStage } from "@/lib/types";
import { HpBar } from "./HpBar";

/** One player's pet in the arena. */
export type FormationPet = {
  username: string;
  /** null when the pet's line is unknown (very old battles). */
  stage: PetStage | null;
  level: number | null;
  petHp: number;
  petMaxHp: number;
  damage: number;
  correct: number;
  left: boolean;
  host: boolean;
  me: boolean;
};

export type PetAnim = { name: "dash" | "hurt" | null; id: number };

/** A damage number over one pet. */
export type PetFloater = { id: number; username: string; text: string };

type FormationProps = {
  pets: FormationPet[];
  /** The animation each pet is playing, by username; a new id replays it. */
  anims?: Record<string, PetAnim>;
  floaters?: PetFloater[];
  /** Boss defeated: the pets still standing cheer. */
  celebrate?: boolean;
  /** My answer streak, shown on my pet from ×2. */
  combo?: number;
  /** Called with each pet's sprite box, so shots can fly from it. */
  registerSlot?: (username: string, el: HTMLElement | null) => void;
  /** Cap on the sprite size, e.g. for the small team row on the result card. */
  maxSize?: number;
  /** Drawn on a white card instead of the arena scene. */
  onCard?: boolean;
  className?: string;
};

// Sprite sizes to try, biggest first. A few pets get big sprites; a whole
// class gets small ones, in several rows, so nobody is left off the screen.
const SIZES = [112, 96, 80, 64, 56, 48, 40, 32, 28];
// Big slots show a name, an HP bar and the HP numbers; small ones a short
// name and the bar (the full details are a tap away).
const gapFor = (size: number) => (size >= 56 ? 8 : 4);
const slotWidth = (size: number) => (size >= 56 ? Math.max(size + 12, 76) : Math.max(size + 10, 38));
const slotHeight = (size: number) => size + (size >= 56 ? 56 : 34);

function largestFor(count: number, narrow: boolean) {
  if (count <= 4) return narrow ? 80 : 112;
  if (count <= 8) return 80;
  if (count <= 16) return 56;
  return 48;
}

/**
 * Sprite size and pets per row for `count` pets in a box `width` wide, using
 * at most `maxHeight` when it can. 1–4 pets always stand in one row.
 */
export function formationLayout(count: number, width: number, maxHeight: number, cap = Infinity) {
  const n = Math.max(1, count);
  const largest = Math.min(largestFor(n, width < 480), cap);
  const sizes = SIZES.filter((s) => s <= largest);
  const fit = (size: number) => {
    const gap = gapFor(size);
    const perRow = Math.max(1, Math.floor((width + gap) / (slotWidth(size) + gap)));
    const rows = Math.ceil(n / perRow);
    // Even rows: 10 pets with room for 8 per row stand 5 + 5, not 8 + 2.
    return { size, rows, perRow: Math.ceil(n / rows) };
  };
  for (const size of sizes) {
    const layout = fit(size);
    if (n <= 4 && layout.rows > 1) continue;
    if (layout.rows * slotHeight(size) + (layout.rows - 1) * gapFor(size) <= maxHeight) return layout;
  }
  // More pets than fit comfortably: the smallest size, in as many rows as it takes.
  return fit(sizes.at(-1) ?? SIZES.at(-1)!);
}

/**
 * Every player's pet, standing in rows at the bottom of the arena and facing
 * the boss. Pets keep their place in join order; fainted pets and players who
 * left stay in the formation, greyed out. Tap a pet for its details.
 */
export function Formation({
  pets,
  anims = {},
  floaters = [],
  celebrate = false,
  combo = 0,
  registerSlot,
  maxSize,
  onCard = false,
  className,
}: FormationProps) {
  const [box, setBox] = useState<{ width: number; height: number } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  // Measure the space we have; until then lay out for a phone and stay hidden.
  const measure = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setBox({ width: entry.contentRect.width, height: window.innerHeight });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!selected) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [selected]);

  const width = box?.width ?? 358;
  // The formation gets about a third of the screen height; a big class gets more rows anyway.
  const maxHeight = Math.max(140, Math.round((box?.height ?? 800) * 0.33));
  const { size, perRow } = formationLayout(pets.length, width, maxHeight, maxSize);
  const big = size >= 56;
  const gap = gapFor(size);
  const rowWidth = perRow * slotWidth(size) + (perRow - 1) * gap;
  const details = pets.find((p) => p.username === selected);

  return (
    <div className={cn("relative z-20", className)}>
      {details ? <PetDetails pet={details} onClose={() => setSelected(null)} /> : null}
      <div ref={measure} className={cn("flex w-full justify-center", !box && "invisible")}>
        <ul
          aria-label="Баг"
          className="flex flex-wrap justify-center"
          style={{ width: Math.min(rowWidth, width), gap }}
        >
            {pets.map((pet, i) => {
              const fainted = !pet.left && pet.petHp === 0;
              const out = fainted || pet.left;
              const anim = anims[pet.username] ?? { name: null, id: 0 };
              const percent = pet.petMaxHp > 0 ? (pet.petHp / pet.petMaxHp) * 100 : 0;
              return (
                <li
                  key={pet.username}
                  className="arena-enter relative"
                  style={{ width: slotWidth(size), animationDelay: `${Math.min(i, 24) * 40}ms` }}
                >
                  <button
                    type="button"
                    onClick={() => setSelected((s) => (s === pet.username ? null : pet.username))}
                    aria-expanded={selected === pet.username}
                    aria-controls="pet-details"
                    aria-label={`${pet.username}${pet.me ? " (чи)" : ""}, ${pet.stage?.name ?? "тэжээвэр"}, HP ${pet.petHp} / ${pet.petMaxHp}${pet.left ? ", гарсан" : fainted ? ", ухаан алдсан" : ""}`}
                    className={cn(
                      "flex w-full cursor-pointer flex-col items-center rounded-tile transition-colors",
                      big ? "pt-1 pb-1.5" : "pt-0.5 pb-1",
                      selected === pet.username ? "bg-white/30" : "hover:bg-white/15",
                    )}
                  >
                    <span
                      ref={(el) => registerSlot?.(pet.username, el)}
                      className="relative block"
                      style={{ width: size, height: size }}
                    >
                      {/* Shadow on the ground; mine glows */}
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute -bottom-0.5 left-1/2 h-[22%] w-[86%] -translate-x-1/2 rounded-[50%]",
                          pet.me ? "arena-me-glow bg-[#ffd166]/70" : "bg-black/35",
                        )}
                      />
                      <span
                        className={cn("block", !out && !celebrate && "arena-idle")}
                        style={{ animationDelay: `${(i * 0.37) % 1.6}s` }}
                      >
                        <span
                          key={anim.id}
                          className={cn(
                            "arena-actor block",
                            !out && anim.name === "dash" && "arena-dash",
                            !out && anim.name === "hurt" && "arena-hurt",
                            fainted && "arena-fainted",
                            pet.left && "opacity-40 grayscale",
                            celebrate && !out && "arena-cheer",
                          )}
                          style={celebrate ? { animationDelay: `${(i % 6) * 0.08}s` } : undefined}
                        >
                          {pet.stage ? (
                            <PetSprite stage={pet.stage} size={size} />
                          ) : (
                            <span className="block rounded-full bg-lavender" style={{ width: size, height: size }} />
                          )}
                        </span>
                      </span>
                      {pet.me && combo >= 2 && !out ? (
                        <span
                          aria-label={`Комбо ×${combo}`}
                          className="absolute -top-1 -right-2 rounded-full bg-primary px-1.5 py-0.5 text-[10px] leading-none font-bold text-white shadow-card md:text-xs"
                        >
                          ×{combo}
                        </span>
                      ) : null}
                      {floaters
                        .filter((f) => f.username === pet.username)
                        .map((f) => (
                          <span
                            key={f.id}
                            aria-hidden="true"
                            className={cn(
                              "arena-float absolute top-0 left-1/2 font-bold text-white [-webkit-text-stroke:1.5px_var(--color-magenta)]",
                              big ? "text-2xl md:text-3xl" : "text-lg",
                            )}
                          >
                            {f.text}
                          </span>
                        ))}
                    </span>
                    <span
                      className={cn(
                        "mt-1 max-w-full truncate rounded-full leading-tight font-bold",
                        big ? "px-1.5 text-xs md:text-sm" : "px-1 text-[10px]",
                        pet.me ? "bg-primary text-white" : onCard ? "bg-surface text-ink" : "bg-white/90 text-ink",
                      )}
                    >
                      {pet.username}
                    </span>
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mt-1 block w-[86%] overflow-hidden rounded-full",
                        onCard ? "bg-surface" : "bg-black/40",
                        big ? "h-2" : "h-1.5",
                      )}
                    >
                      <span
                        className={cn(
                          "block h-full rounded-full transition-[width] duration-500",
                          percent <= 25 ? "bg-magenta" : onCard ? "bg-primary" : "bg-sky",
                        )}
                        style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
                      />
                    </span>
                    {big || pet.me ? (
                      <span
                        aria-hidden="true"
                        className={cn(
                          "mt-0.5 text-[10px] leading-none font-bold tabular-nums md:text-xs",
                          onCard ? "text-ink-muted" : "text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.8)]",
                        )}
                      >
                        {pet.left ? "гарсан" : `${pet.petHp}/${pet.petMaxHp}`}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
        </ul>
      </div>
    </div>
  );
}

/** A pet's full details, above the formation; nobody moves out of the way. */
function PetDetails({ pet, onClose }: { pet: FormationPet; onClose: () => void }) {
  const fainted = !pet.left && pet.petHp === 0;
  return (
    <div
      id="pet-details"
      role="group"
      aria-label={`${pet.username}-ын мэдээлэл`}
      className="absolute bottom-full left-1/2 z-20 mb-2 flex w-[min(300px,100%)] -translate-x-1/2 items-center gap-3 rounded-tile bg-white p-3 text-ink shadow-float"
    >
      {pet.stage ? <PetSprite stage={pet.stage} size={48} className="shrink-0" /> : null}
      <div className="min-w-0 flex-1">
        <p className="font-bold break-words">
          {pet.username}
          {pet.me ? <span className="text-ink-muted"> (чи)</span> : null}
        </p>
        <p className="text-sm text-ink-muted">
          {pet.stage?.name ?? "Тэжээвэр"}
          {pet.level ? ` · Түвшин ${pet.level}` : ""}
          {pet.host ? " · Эзэн" : ""}
        </p>
        <HpBar value={pet.petHp} max={pet.petMaxHp} label={`${pet.username}-ын тэжээвэр HP`} tone="pet" className="mt-1.5" />
        <p className="mt-1.5 text-sm">
          Хохирол <span className="font-bold">{pet.damage}</span> · Зөв <span className="font-bold">{pet.correct}</span>
          {pet.left ? " · Гарсан" : fainted ? " · Ухаан алдсан" : ""}
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Хаах"
        className="flex size-11 shrink-0 cursor-pointer items-center justify-center self-start rounded-full bg-surface text-ink"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden="true" className="size-4">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
  );
}
