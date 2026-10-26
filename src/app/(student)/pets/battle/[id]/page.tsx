import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBattle, getBoss, getCurrentPet } from "@/lib/data";
import { BattleScreen } from "./BattleScreen";

export const metadata: Metadata = {
  title: "Тулаан · LevelUp",
};

export default async function BattlePage({ params }: PageProps<"/pets/battle/[id]">) {
  const { id } = await params;
  // Not a battle id, or not this student's battle.
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [battle, pet] = await Promise.all([getBattle(id), getCurrentPet()]);
  if (!battle || !pet) notFound();
  const boss = await getBoss(battle.bossId);
  if (!boss) notFound();

  return (
    <BattleScreen
      initial={battle}
      boss={{ id: boss.id, name: boss.name, sprite: boss.sprite, attack: boss.attack, arena: boss.arena }}
      pet={pet.stage}
    />
  );
}
