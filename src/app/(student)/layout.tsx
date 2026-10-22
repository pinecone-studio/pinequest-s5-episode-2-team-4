import { MobileNav } from "@/components/layout/MobileNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getCurrentUser } from "@/lib/data";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const pet = user.pet && {
    // TODO(#9): use the pet line's name for the current level.
    name: "Wrougon",
    level: user.pet.level,
    xpPercent: user.pet.xp,
  };

  return (
    <>
      <SiteHeader pet={pet} />
      <main className="flex-1">{children}</main>
      <div className="mt-16">
        <SiteFooter />
      </div>
      <MobileNav />
    </>
  );
}
