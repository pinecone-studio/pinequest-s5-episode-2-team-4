import { AchievementWatcher } from "@/components/layout/AchievementWatcher";
import { ClassNewsWatcher } from "@/components/layout/ClassNewsWatcher";
import { LandscapeBackdrop } from "@/components/layout/LandscapeBackdrop";
import { MobileNav } from "@/components/layout/MobileNav";
import { PageTransition } from "@/components/layout/PageTransition";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { StudentFooter } from "@/components/layout/StudentFooter";
import { requireStudent } from "@/lib/auth";
import {
  getCoins,
  getCurrentPet,
  getEquippedItems,
  getOpenAssignmentCount,
  getPetLines,
  getStudentSubject,
  getTodayLesson,
  getUnseenVideoCount,
} from "@/lib/data";
import { subjectTitle } from "@/lib/subjects";

const FOOTER_PET_IDS = ["dollfin", "agnite", "wrougon"];

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireStudent();
  const [pet, petLines, videos, assignments, subject, lesson, coins, equipped] = await Promise.all([
    getCurrentPet(),
    getPetLines(),
    getUnseenVideoCount(),
    getOpenAssignmentCount(),
    getStudentSubject(),
    getTodayLesson(),
    getCoins(),
    getEquippedItems(),
  ]);
  const counts = { videos, assignments, lesson: lesson && !lesson.answered ? 1 : 0 };
  const footerPets = FOOTER_PET_IDS.flatMap((id) => {
    const line = petLines.find((l) => l.id === id);
    return line ? [line.stages[0]] : [];
  });

  return (
    <>
      <LandscapeBackdrop />
      <SiteHeader
        counts={counts}
        subject={subject && subjectTitle(subject.subject)}
        coins={coins}
        pet={
          pet && {
            name: pet.stage.name,
            level: pet.level,
            xpPercent: pet.xp,
            imageSrc: pet.stage.sprite,
            ringColors: equipped.ring?.colors,
            aura: equipped.aura,
          }
        }
      />
      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
      <StudentFooter pets={footerPets} />
      <MobileNav counts={counts} />
      <AchievementWatcher />
      <ClassNewsWatcher />
    </>
  );
}
