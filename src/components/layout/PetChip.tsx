import { PetSprite } from "@/components/pet/PetSprite";
import "./PetChip.css";

type PetChipProps = {
  name: string;
  level: number;
  /** Progress to the next level, 0–100. */
  xpPercent: number;
  imageSrc?: string;
};

/** Length of the XP ring (r = 25), the dash that fills it. */
const RING = 157.1;

/**
 * The pet in a circular XP ring with its level (design: header); the
 * account menu's button in the header. Wide screens show the name and «60 / 100 XP» after the ring, phones
 * the level and XP before it; the smallest phones (beside the coins) and
 * laptops in between (lg to 1360px, next to the nav) show the ring alone.
 */
export function PetChip({ name, level, xpPercent, imageSrc }: PetChipProps) {
  const xp = Math.min(100, Math.max(0, Math.round(xpPercent)));
  return (
    <span className="flex min-h-14 shrink-0 flex-row-reverse items-center gap-2.5 rounded-full pl-3 max-[380px]:pl-0 text-ink lg:flex-row lg:pl-0 min-[1360px]:gap-3 min-[1360px]:pr-4">
      <span className="relative size-14 shrink-0">
        <svg viewBox="0 0 56 56" aria-hidden="true" className="absolute inset-0 size-full -rotate-90">
          <circle cx="28" cy="28" r="25" strokeWidth="5" className="fill-card stroke-line" />
          <circle
            cx="28"
            cy="28"
            r="25"
            fill="none"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={RING}
            strokeDashoffset={RING * (1 - xp / 100)}
            className={xp > 0 ? "pet-chip-xp stroke-primary" : "hidden"}
          />
        </svg>
        {imageSrc ? (
          <PetSprite stage={{ name, sprite: imageSrc }} size={48} className="absolute top-1 left-1 animate-bob" />
        ) : (
          <span aria-hidden="true" className="absolute inset-1.5 rounded-full bg-lavender" />
        )}
        <span
          aria-hidden="true"
          className="absolute -right-1 -bottom-1 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-card bg-ink px-1.5 text-xs leading-none font-bold text-white"
        >
          {level}
        </span>
      </span>
      <span aria-hidden="true" className="flex flex-col items-end gap-0.5 leading-tight max-[380px]:hidden lg:items-start lg:max-[1360px]:hidden">
        <span className="text-sm font-bold lg:text-base">
          <span className="lg:hidden">Түв. {level}</span>
          <span className="hidden lg:inline">{name}</span>
        </span>
        <span className="text-xs font-medium whitespace-nowrap text-ink-muted">
          <span className="font-bold text-primary">{xp}</span> / 100<span className="hidden lg:inline"> XP</span>
        </span>
      </span>
    </span>
  );
}
