import Link from "next/link";
import { PetSprite } from "@/components/pet/PetSprite";
import type { PetStage } from "@/lib/types";
import { Logo } from "./Logo";

/** Pet sprites are from Tuxemon; this attribution is required by CC BY-SA 4.0. */
export function TuxemonCredit() {
  return (
    <span>
      Зураг:{" "}
      <a
        href="https://wiki.tuxemon.org/Completed_Tuxemon"
        className="text-sky hover:text-white"
      >
        Tuxemon
      </a>{" "}
      ·{" "}
      <a
        href="https://creativecommons.org/licenses/by-sa/4.0/"
        className="text-sky hover:text-white"
      >
        CC BY-SA 4.0
      </a>
    </span>
  );
}

type SiteFooterProps = {
  /** "auth" shows the copyright instead of the logo; "full" is the home page footer. */
  variant?: "default" | "auth" | "full";
  /** Pets shown under the tagline in the full footer */
  pets?: PetStage[];
};

const footerLinkClass = "inline-flex min-h-11 items-center text-sky no-underline hover:text-white md:min-h-9";

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 text-[13px] font-bold tracking-[0.04em] text-white uppercase">{children}</p>
  );
}

function FullFooter({ pets = [] }: { pets?: PetStage[] }) {
  return (
    <footer className="bg-black text-sm text-lavender md:text-[15px]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-3 gap-y-6 px-4 pt-7 pb-5 md:grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] md:gap-8 md:px-[clamp(16px,4vw,40px)] md:pt-12 md:pb-8">
        <div className="col-span-2 flex items-center justify-between gap-3 md:col-span-1 md:flex-col md:items-start md:gap-3.5">
          <Logo tone="light" />
          <p className="hidden max-w-65 md:block">Ойлгоогүйгээ ичихгүйгээр нөх.</p>
          <div aria-hidden="true" className="flex gap-0.5 md:gap-1">
            {pets.map((stage) => (
              <PetSprite key={stage.name} stage={stage} />
            ))}
          </div>
        </div>
        <nav aria-label="Тоглоом" className="flex flex-col">
          <FooterHeading>Тоглоом</FooterHeading>
          <Link href="/games" className={footerLinkClass}>Тоглоом</Link>
          <Link href="/lesson/fractions" className={footerLinkClass}>Бутархай</Link>
          <Link href="/pets" className={footerLinkClass}>Тэжээвэр</Link>
        </nav>
        <nav aria-label="Багшид" className="flex flex-col">
          <FooterHeading>Багшид</FooterHeading>
          <Link href="/teacher" className={footerLinkClass}>Багшийн самбар</Link>
        </nav>
        <div className="col-span-2 flex flex-col md:col-span-1">
          <FooterHeading>Зураг</FooterHeading>
          <p>
            Тэжээврийн пиксел зураг:{" "}
            <a href="https://wiki.tuxemon.org/Completed_Tuxemon" className="text-sky hover:text-white">
              Tuxemon төсөл
            </a>
            ,{" "}
            <a href="https://creativecommons.org/licenses/by-sa/4.0/" className="text-sky hover:text-white">
              CC BY-SA 4.0
            </a>
          </p>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-3 border-t border-primary-dark px-4 pt-5 pb-7 text-[13px] md:px-[clamp(16px,4vw,40px)]">
        <span>© 2026 LevelUp баг</span>
        <span>PINEQUEST S5 · SDG 4</span>
      </div>
    </footer>
  );
}

export function SiteFooter({ variant = "default", pets }: SiteFooterProps) {
  if (variant === "full") return <FullFooter pets={pets} />;
  return (
    <footer className="bg-black text-[13px] text-lavender">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 md:px-[clamp(16px,4vw,40px)]">
        {variant === "auth" ? (
          <span>© 2026 LevelUp баг</span>
        ) : (
          <Logo tone="light" size="sm" />
        )}
        <TuxemonCredit />
      </div>
    </footer>
  );
}
