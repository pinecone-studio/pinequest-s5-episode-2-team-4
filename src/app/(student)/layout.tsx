import { MobileNav } from "@/components/layout/MobileNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getCurrentPet } from "@/lib/data";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pet = await getCurrentPet();

  return (
    <>
      <SiteHeader
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
      <div className="mt-16">
        <SiteFooter />
      </div>
      <MobileNav petSprite={pet?.stage.sprite} />
    </>
  );
}
