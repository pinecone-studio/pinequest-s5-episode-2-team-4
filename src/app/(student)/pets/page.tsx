import type { Metadata } from "next";
import { getBosses, getCurrentPet, getEquippedItems, getLearningStreak, getPetCollection, getPetLines } from "@/lib/data";
import { petMood } from "@/lib/pets";
import { PetsView } from "./PetsView";
import "./pets.css";

export const metadata: Metadata = {
  title: "Тэжээвэр · LevelUp",
};

/** A pet in its habitat and its evolution path, then every pet line (design: Тэжээвэр). */
export default async function PetsPage() {
  const [pet, lines, collection, bosses, streak, equipped] = await Promise.all([
    getCurrentPet(),
    getPetLines(),
    getPetCollection(),
    getBosses(),
    getLearningStreak(),
    getEquippedItems(),
  ]);
  // Which bosses can drop each pet line's egg (for undiscovered pets).
  const dropsFrom: Record<string, string[]> = {};
  for (const boss of bosses) {
    for (const { lineId } of boss.rewards.eggPool) (dropsFrom[lineId] ??= []).push(boss.name);
  }

  return (
    <div className="mx-auto max-w-[1280px] px-4 pt-1 md:px-[clamp(16px,4vw,40px)] md:pt-2">
      <h1 className="type-page-title">Тэжээвэр</h1>
      <PetsView
        lines={lines}
        owned={collection?.pets ?? []}
        dropsFrom={dropsFrom}
        myPet={pet && { lineId: pet.lineId, level: pet.level, xp: pet.xp }}
        mood={petMood(streak)}
        palette={equipped.scene?.palette}
        aura={equipped.aura}
      />
    </div>
  );
}
