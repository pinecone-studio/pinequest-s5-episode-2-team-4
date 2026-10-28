import { MobileNav } from "@/components/layout/MobileNav";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { StudentFooter } from "@/components/layout/StudentFooter";
import { requireStudent } from "@/lib/auth";
import { getCurrentPet, getOpenAssignmentCount, getPetLines } from "@/lib/data";

const FOOTER_PET_IDS = ["dollfin", "agnite", "wrougon"];

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireStudent();
  const [pet, petLines, assignments] = await Promise.all([
    getCurrentPet(),
    getPetLines(),
    getOpenAssignmentCount(),
  ]);
  const counts = { assignments };
  const footerPets = FOOTER_PET_IDS.flatMap((id) => {
    const line = petLines.find((l) => l.id === id);
    return line ? [line.stages[0]] : [];
  });

  return (
    <>
      <SiteHeader
        counts={counts}
        pet={
          pet && {
            name: pet.stage.name,
            level: pet.level,
            xpPercent: pet.xp,
            imageSrc: pet.stage.sprite,
          }
        }
      />
      <main className="flex-1">{children}</main>
      <StudentFooter pets={footerPets} />
      <MobileNav petSprite={pet?.stage.sprite} counts={counts} />
    </>
  );
}
