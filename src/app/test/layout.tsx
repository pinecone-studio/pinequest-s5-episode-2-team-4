import { LandscapeBackdrop } from "@/components/layout/LandscapeBackdrop";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { requireStudent } from "@/lib/auth";
import { getCoins, getCurrentPet, getEquippedItems } from "@/lib/data";

/** The test is a focused screen: no header or bottom nav on mobile. */
export default async function TestLayout({ children }: LayoutProps<"/test">) {
  await requireStudent();
  const [pet, coins, equipped] = await Promise.all([getCurrentPet(), getCoins(), getEquippedItems()]);

  return (
    <>
      <LandscapeBackdrop />
      <SiteHeader
        className="hidden md:block"
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
      <main className="flex-1">{children}</main>
      <div className="mt-8 md:mt-16">
        <SiteFooter />
      </div>
    </>
  );
}
