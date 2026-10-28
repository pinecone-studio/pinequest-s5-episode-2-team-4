"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PetSprite } from "@/components/pet/PetSprite";
import { Button } from "@/components/ui";
import { hatchMyEgg } from "@/lib/battle-actions";
import { cn } from "@/lib/cn";
import type { Egg, HatchResult, PetLine } from "@/lib/types";
import { PixelEgg } from "../PixelEgg";
import { RARITY_LABELS, RARITY_STYLES } from "../battle/labels";
import "./eggs.css";

type EggHatcherProps = {
  eggs: Egg[];
  bossNames: Record<string, string>;
  lines: PetLine[];
};

/** How long the egg wobbles and cracks before the pet shows. */
const CRACK_MS = 1400;

export function EggHatcher({ eggs, bossNames, lines }: EggHatcherProps) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [hatching, setHatching] = useState<Egg | null>(null);
  const [result, setResult] = useState<HatchResult | null>(null);
  const [cracked, setCracked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hatching) return;
    const timer = setTimeout(() => setCracked(true), CRACK_MS);
    return () => clearTimeout(timer);
  }, [hatching]);

  async function hatch(egg: Egg) {
    setError(null);
    setResult(null);
    setCracked(false);
    setHatching(egg);
    dialog.current?.showModal();
    try {
      const r = await hatchMyEgg(egg.id);
      if (!r) throw new Error("not hatched");
      setResult(r);
    } catch {
      setError("Хагалж чадсангүй. Дахин оролдоно уу.");
    }
  }

  function close() {
    dialog.current?.close();
    setHatching(null);
    router.refresh();
  }

  const line = result && lines.find((l) => l.id === result.lineId);
  const revealed = cracked && result && line;

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {eggs.map((egg) => (
          <li key={egg.id} className="flex flex-col items-center gap-3 rounded-card bg-white p-4 shadow-card">
            <PixelEgg rarity={egg.rarity} size={72} className="egg-idle" />
            <span lang="en" className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", RARITY_STYLES[egg.rarity])}>
              {RARITY_LABELS[egg.rarity]}
            </span>
            <p className="text-center text-sm text-ink-muted">{bossNames[egg.bossId] ?? egg.bossId}-с</p>
            <Button size="sm" className="w-full" onClick={() => hatch(egg)}>
              Хагалах
            </Button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        aria-labelledby="hatch-title"
        onCancel={(e) => {
          // Let the animation finish before closing with Esc.
          if (!revealed && !error) e.preventDefault();
        }}
        className="fixed inset-0 m-auto h-fit w-[min(420px,calc(100%-32px))] rounded-panel bg-white p-6 text-center text-ink shadow-float backdrop:bg-ink/50 md:p-8"
      >
        <h2 id="hatch-title" className="text-2xl font-bold">
          {revealed ? (result.duplicate ? "Давхардсан тэжээвэр" : "Шинэ тэжээвэр!") : "Хагалж байна…"}
        </h2>
        <div className="mt-5 flex h-44 items-center justify-center" aria-live="polite">
          {revealed ? (
            <div className="egg-reveal flex flex-col items-center gap-2">
              <PetSprite stage={line.stages[0]} size={128} alt={line.stages[0].name} />
              <p className="text-xl font-bold">{line.stages[0].name}</p>
              <span lang="en" className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", RARITY_STYLES[result.rarity])}>
                {RARITY_LABELS[result.rarity]}
              </span>
            </div>
          ) : hatching ? (
            <PixelEgg rarity={hatching.rarity} size={96} className="egg-crack" />
          ) : null}
        </div>
        {revealed ? (
          <p className="mt-2 text-ink-muted">
            {result.duplicate
              ? `${line.stages[0].name} аль хэдийн байгаа тул +${result.bonusExp} EXP авлаа.`
              : "Цуглуулгад нэмэгдлээ. Тэжээвэр хэсгээс тулаанд оруулж болно."}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="mt-2 font-semibold text-magenta">
            {error}
          </p>
        ) : null}
        {revealed || error ? (
          <Button className="mt-5 w-full" autoFocus onClick={close}>
            Болсон
          </Button>
        ) : null}
      </dialog>
    </>
  );
}
