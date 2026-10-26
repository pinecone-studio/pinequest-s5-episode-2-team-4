import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui";
import { getBosses, getEggs, getPetLines } from "@/lib/data";
import { EggHatcher } from "./EggHatcher";

export const metadata: Metadata = {
  title: "Өндөг · LevelUp",
};

export default async function EggsPage() {
  const [eggs, bosses, lines] = await Promise.all([getEggs(), getBosses(), getPetLines()]);
  const bossNames = Object.fromEntries(bosses.map((b) => [b.id, b.name]));

  return (
    <div className="mx-auto max-w-5xl px-4 pt-2 md:px-[clamp(16px,4vw,40px)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-[40px] leading-none font-bold tracking-[-0.03em] md:text-[56px]">Өндөг</h1>
          <p className="mt-3 text-ink-muted md:text-lg">
            Боссыг ялахад өндөг олдож болно. Ангаахайлж шинэ тэжээвэртэй болоорой.
          </p>
        </div>
        <ButtonLink href="/pets" variant="secondary" size="sm">
          Цуглуулга руу
        </ButtonLink>
      </div>

      <div className="mt-6 md:mt-8">
        {eggs.length > 0 ? (
          <EggHatcher eggs={eggs} bossNames={bossNames} lines={lines} />
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-panel bg-surface px-6 py-10 text-center">
            <p className="text-lg font-bold">Одоогоор өндөг алга.</p>
            <ButtonLink href="/pets/battle" size="sm">
              Боссын тулаан
            </ButtonLink>
          </div>
        )}
      </div>
    </div>
  );
}
