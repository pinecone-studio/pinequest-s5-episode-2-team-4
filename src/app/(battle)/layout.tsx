import { TuxemonCredit } from "@/components/layout/SiteFooter";
import { requireStudent } from "@/lib/auth";

/**
 * Battles fill the whole screen: no site header, footer or bottom nav, so the
 * boss and every pet get the space. The battle screen has its own exit.
 */
export default async function BattleLayout({ children }: { children: React.ReactNode }) {
  await requireStudent();
  return (
    <main className="flex min-h-dvh flex-col">
      {children}
      {/* The footer is hidden here, but the sprites still need their CC BY-SA credit. */}
      <p className="mx-auto mb-2 rounded-full bg-black/45 px-3 py-0.5 text-[11px] text-white">
        <TuxemonCredit />
      </p>
    </main>
  );
}
