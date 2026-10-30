import type { Metadata } from "next";
import Link from "next/link";
import { getActiveClass, getBattleSubjects, getBosses, getCurrentUser, getTeacherClassBattle } from "@/lib/data";
import { subjectTitle } from "@/lib/subjects";
import { ClassBattleCard } from "../ClassBattleCard";

export const metadata: Metadata = {
  title: "Ангийн босс тулаан · LevelUp",
};

/** Opens a boss battle for the open class, or goes back to the one already running. */
export default async function ClassBattlePage() {
  const [bosses, open, subjects, user, active] = await Promise.all([
    getBosses(),
    getTeacherClassBattle(),
    getBattleSubjects(),
    getCurrentUser(),
    getActiveClass(),
  ]);
  const classCode = open?.classCode ?? active?.code ?? user?.classCode ?? "";

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-[clamp(16px,4vw,40px)]">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="type-page-title">Ангийн босс тулаан</h1>
        <Link href={`/teacher/history?class=${encodeURIComponent(classCode)}`} className="font-bold">
          Тулааны түүх →
        </Link>
      </div>
      <ClassBattleCard
        bosses={bosses}
        subjects={subjects}
        teacherSubjectTitle={user?.subject && subjectTitle(user.subject)}
        open={open}
        classCode={classCode}
        className="mt-6"
      />
    </div>
  );
}
