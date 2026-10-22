import { Logo } from "@/components/layout/Logo";
import { SiteFooter } from "@/components/layout/SiteFooter";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="relative flex flex-1 animate-flow flex-col overflow-hidden bg-flow">
        <header className="relative mx-auto flex h-18 w-full max-w-7xl items-center px-4 md:h-22 md:px-[clamp(16px,4vw,40px)]">
          <Logo />
        </header>
        {children}
      </div>
      <SiteFooter variant="auth" />
    </>
  );
}
