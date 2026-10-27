import { TuxemonCredit } from "@/components/layout/SiteFooter";

/**
 * Battles fill the whole screen: no site header, footer or bottom nav, so the
 * boss and every pet get the space. The battle screen has its own exit.
 * Students and teachers both use it, so each page checks who may see it.
 */
export default function BattleLayout({ children }: { children: React.ReactNode }) {
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
