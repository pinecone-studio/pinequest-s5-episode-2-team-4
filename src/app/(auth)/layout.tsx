import { LandscapeBackdrop } from "@/components/layout/LandscapeBackdrop";
import { Logo } from "@/components/layout/Logo";
import { PageTransition } from "@/components/layout/PageTransition";
import { SiteFooter } from "@/components/layout/SiteFooter";

/** Login, signup and password pages, on the same pixel landscape as the app. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LandscapeBackdrop />
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <header className="relative mx-auto flex h-18 w-full max-w-7xl items-center px-4 md:h-22 md:px-[clamp(16px,4vw,40px)]">
          <Logo />
        </header>
        <PageTransition className="flex flex-1 flex-col">{children}</PageTransition>
      </div>
      <SiteFooter variant="auth" />
    </>
  );
}
