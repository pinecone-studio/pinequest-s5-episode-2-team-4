import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { requireStudent } from "@/lib/auth";
import { getCurrentPet } from "@/lib/data";

/** The test is a focused screen: no header or bottom nav on mobile. */
export default async function TestLayout({ children }: LayoutProps<"/test">) {
  await requireStudent();
  const pet = await getCurrentPet();

  return (
    <>
      <SiteHeader
        className="hidden md:block"
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
      <div className="mt-8 md:mt-16">
        <SiteFooter />
      </div>
    </>
  );
}
