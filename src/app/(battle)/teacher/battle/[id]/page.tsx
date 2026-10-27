import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import { getBoss, getClassBattle, getPetLines } from "@/lib/data";
import { BattleScreen } from "@/app/(battle)/pets/battle/[id]/BattleScreen";

export const metadata: Metadata = {
  title: "Ангийн тулаан · LevelUp",
};

/** The teacher's class battle, full screen for the projector: watch it and run it. */
export default async function TeacherBattlePage({ params }: PageProps<"/teacher/battle/[id]">) {
  await requireTeacher();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [battle, lines] = await Promise.all([getClassBattle(id), getPetLines()]);
  if (!battle) notFound();
  const boss = await getBoss(battle.bossId);
  if (!boss) notFound();

  return (
    <BattleScreen
      initial={battle}
      boss={{ id: boss.id, name: boss.name, sprite: boss.sprite, attack: boss.attack, arena: boss.arena }}
      lines={lines}
      teacher
    />
  );
}
