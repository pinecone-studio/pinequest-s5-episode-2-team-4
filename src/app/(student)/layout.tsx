import { MobileNav } from "@/components/layout/MobileNav";
import { PageTransition } from "@/components/layout/PageTransition";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { StudentFooter } from "@/components/layout/StudentFooter";
import { requireStudent } from "@/lib/auth";
import { getCurrentPet, getOpenAssignmentCount, getPetLines, getStudentSubject, getUnseenVideoCount } from "@/lib/data";
import { subjectTitle } from "@/lib/subjects";

const FOOTER_PET_IDS = ["dollfin", "agnite", "wrougon"];

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireStudent();
  const [pet, petLines, videos, assignments, subject] = await Promise.all([
    getCurrentPet(),
    getPetLines(),
    getUnseenVideoCount(),
    getOpenAssignmentCount(),
    getStudentSubject(),
  ]);
  const counts = { videos, assignments };
  const footerPets = FOOTER_PET_IDS.flatMap((id) => {
    const line = petLines.find((l) => l.id === id);
    return line ? [line.stages[0]] : [];
  });

  return (
    <>
      <SiteHeader
        counts={counts}
        subject={subject && subjectTitle(subject.subject)}
        pet={
          pet && {
            name: pet.stage.name,
            level: pet.level,
            xpPercent: pet.xp,
            imageSrc: pet.stage.sprite,
          }
        }
      />
      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
      <StudentFooter pets={footerPets} />
      <MobileNav petSprite={pet?.stage.sprite} counts={counts} />
    </>
  );
}
