import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

/** The test is a focused screen: no header or bottom nav on mobile. */
export default function TestLayout({ children }: LayoutProps<"/test">) {
  return (
    <>
      <div className="hidden md:block">
        <SiteHeader />
      </div>
      <main className="flex-1">{children}</main>
      <div className="mt-8 md:mt-16">
        <SiteFooter />
      </div>
    </>
  );
}
