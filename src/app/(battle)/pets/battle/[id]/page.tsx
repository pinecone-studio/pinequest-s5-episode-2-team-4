import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import { getBattle, getBoss, getCurrentPet, getPetLine, getPetLines } from "@/lib/data";
import { petStage } from "@/lib/pets";
import { BattleScreen } from "./BattleScreen";
import { LobbyScreen } from "./LobbyScreen";

export const metadata: Metadata = {
  title: "Тулаан · LevelUp",
};

export default async function BattlePage({ params }: PageProps<"/pets/battle/[id]">) {
  await requireStudent();
  const { id } = await params;
  // Not a battle id, or not this student's battle.
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [battle, accountPet] = await Promise.all([getBattle(id), getCurrentPet()]);
  if (!battle) notFound();
  const [boss, line, lines] = await Promise.all([
    getBoss(battle.bossId),
    battle.pet ? getPetLine(battle.pet.lineId) : undefined,
    getPetLines(),
  ]);
  if (!boss) notFound();

  // A group battle that hasn't started (or a closed lobby).
  if (battle.mode !== "solo" && (battle.status === "lobby" || !battle.startedAt)) {
    return <LobbyScreen initial={battle} boss={boss} lines={lines} />;
  }
  // The pet that is fighting (from the collection); older battles fall back to the account pet.
  const pet = line && battle.pet ? petStage(line, battle.pet.level) : accountPet?.stage;
  if (!pet) notFound();

  return (
    <BattleScreen
      initial={battle}
      boss={{ id: boss.id, name: boss.name, sprite: boss.sprite, attack: boss.attack, arena: boss.arena }}
      pet={pet}
      lines={lines}
    />
  );
}
