import Link from "next/link";
import { PetSprite } from "@/components/pet/PetSprite";
import { ProgressBar } from "@/components/ui";

type PetChipProps = {
  name: string;
  level: number;
  /** Progress to the next level, 0–100. */
  xpPercent: number;
  imageSrc?: string;
};

/** Pet avatar with level and XP bar, links to /pets. */
export function PetChip({ name, level, xpPercent, imageSrc }: PetChipProps) {
  return (
    <Link
      href="/pets"
      aria-label={`${name}, түвшин ${level}, ${xpPercent} XP`}
      className="inline-flex h-13 items-center gap-2 rounded-full bg-surface pr-4 pl-0.5 text-ink no-underline hover:text-ink md:h-14 md:gap-2.5 md:pr-4.5 md:pl-1"
    >
      {imageSrc ? (
        <PetSprite stage={{ name, sprite: imageSrc }} size={48} />
      ) : (
        <span aria-hidden="true" className="size-12 rounded-full bg-lavender" />
      )}
      <span className="flex flex-col gap-1.25">
        <span className="text-sm leading-none font-bold">
          Түв. {level}
        </span>
        <ProgressBar
          value={xpPercent}
          label="XP"
          size="sm"
          track="white"
          className="w-15 md:w-20"
        />
      </span>
    </Link>
  );
}
