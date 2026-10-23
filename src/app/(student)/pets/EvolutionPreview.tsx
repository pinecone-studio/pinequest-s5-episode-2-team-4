"use client";

import { useEffect, useState } from "react";
import { showPetPreview } from "@/components/pet/petPreview";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { EVOLVE_LEVELS, petStage } from "@/lib/pets";
import type { PetLine } from "@/lib/types";
import { MyPetCard } from "./MyPetCard";

type EvolutionPreviewProps = {
  line: PetLine;
  level: number;
  className?: string;
};

/** Level shown for each stage while previewing: 1, then each evolve level. */
const PREVIEW_LEVELS = [1, ...EVOLVE_LEVELS];
const STEP_MS = 1500;

/**
 * The student's pet card with a demo button that plays it through its three
 * stages, then shows the real stage again. Nothing is saved.
 */
export function EvolutionPreview({ line, level, className }: EvolutionPreviewProps) {
  // The stage being previewed, or null for the pet's real stage.
  const [step, setStep] = useState<number | null>(null);

  useEffect(() => {
    if (step === null) return;
    const timer = setTimeout(
      () => setStep(step < line.stages.length - 1 ? step + 1 : null),
      STEP_MS,
    );
    return () => clearTimeout(timer);
  }, [step, line.stages.length]);

  const playing = step !== null;

  // Mirror the previewed stage in the header chip and mobile nav.
  useEffect(() => {
    showPetPreview(
      step === null
        ? null
        : { name: line.stages[step].name, level: PREVIEW_LEVELS[step], sprite: line.stages[step].sprite },
    );
  }, [step, line.stages]);
  useEffect(() => () => showPetPreview(null), []);

  return (
    <div className={cn("flex min-w-0 flex-col gap-3", className)}>
      <MyPetCard
        stage={playing ? line.stages[step] : petStage(line, level)}
        level={playing ? PREVIEW_LEVELS[step] : level}
        element={line.element}
      />
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setStep(0)}
        disabled={playing}
        className="self-center md:self-end"
      >
        {playing ? `Хувьсал ${step + 1}/${line.stages.length}` : "Хувьслыг үзүүлэх"}
      </Button>
      <p role="status" className="sr-only">
        {playing ? `${line.stages[step].name}, түвшин ${PREVIEW_LEVELS[step]}` : ""}
      </p>
    </div>
  );
}
