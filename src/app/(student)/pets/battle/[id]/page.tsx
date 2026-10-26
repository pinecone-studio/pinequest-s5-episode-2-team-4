import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBattle, getBoss, getCurrentPet, getPetLine } from "@/lib/data";
import { petStage } from "@/lib/pets";
import { BattleScreen } from "./BattleScreen";

export const metadata: Metadata = {
  title: "Тулаан · LevelUp",
};

export default async function BattlePage({ params }: PageProps<"/pets/battle/[id]">) {
  const { id } = await params;
  // Not a battle id, or not this student's battle.
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [battle, accountPet] = await Promise.all([getBattle(id), getCurrentPet()]);
  if (!battle) notFound();
  const [boss, line] = await Promise.all([
    getBoss(battle.bossId),
    battle.pet ? getPetLine(battle.pet.lineId) : undefined,
  ]);
  if (!boss) notFound();
  // The pet that is fighting (from the collection); older battles fall back to the account pet.
  const pet = line && battle.pet ? petStage(line, battle.pet.level) : accountPet?.stage;
  if (!pet) notFound();

  return (
    <BattleScreen
      initial={battle}
      boss={{ id: boss.id, name: boss.name, sprite: boss.sprite, attack: boss.attack, arena: boss.arena }}
      pet={pet}
    />
  );
}
