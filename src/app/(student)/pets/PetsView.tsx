"use client";

import { useState } from "react";
import { PetScene } from "@/components/pet/PetScene";
import { type PetMood, stageIndex } from "@/lib/pets";
import type { OwnedPet, PetLine, UserPet } from "@/lib/types";
import { EvolutionPath } from "./EvolutionPath";
import { PetCollection } from "./PetCollection";

type PetsViewProps = {
  lines: PetLine[];
  owned: OwnedPet[];
  dropsFrom: Record<string, string[]>;
  /** The student's own pet, which levels up as they learn. */
  myPet: UserPet | undefined;
  mood: PetMood;
};

/**
 * The habitat scene and evolution path show the pet picked in the collection
 * below; with nothing picked, the student's own pet. Pets not found yet stay
 * silhouettes.
 */
export function PetsView({ lines, owned, dropsFrom, myPet, mood }: PetsViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(myPet?.lineId ?? lines[0]?.id ?? null);

  // The student's own pet shows its learning level everywhere here, like the
  // header; other pets show their battle level.
  const pets = myPet
    ? owned.map((p) => (p.lineId === myPet.lineId ? { ...p, level: myPet.level, exp: myPet.xp } : p))
    : owned;
  const line = lines.find((l) => l.id === (selectedId ?? myPet?.lineId));
  const pet = line && pets.find((p) => p.lineId === line.id);

  return (
    <>
      {line ? (
        <div className="mt-4 flex flex-col gap-7 md:mt-7 lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-start">
          <PetScene
            stage={line.stages[pet ? stageIndex(pet.level) : 0]}
            level={pet?.level ?? 1}
            element={line.element}
            mood={mood}
            discovered={pet !== undefined}
          />
          <EvolutionPath line={line} level={pet?.level ?? 1} xp={pet?.exp ?? 0} discovered={pet !== undefined} />
        </div>
      ) : null}

      <PetCollection
        lines={lines}
        owned={pets}
        dropsFrom={dropsFrom}
        myLineId={myPet?.lineId}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
    </>
  );
}
