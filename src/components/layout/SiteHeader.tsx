"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { PetChip } from "./PetChip";

const NAV_LINKS = [
  { href: "/test", label: "Тоглох" },
  { href: "/pets", label: "Тэжээвэр" },
];

const navLinkClass =
  "inline-flex min-h-12 items-center rounded-full px-5 font-semibold text-ink no-underline hover:bg-white/60 hover:text-ink";

type SiteHeaderProps = {
  pet?: React.ComponentProps<typeof PetChip>;
};

/** Header for student pages. Nav links move to MobileNav below md. */
export function SiteHeader({ pet }: SiteHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="mx-auto flex h-18 w-full max-w-7xl items-center justify-between gap-3 px-4 md:h-22 md:gap-4 md:px-[clamp(16px,4vw,40px)]">
      <div className="flex items-center gap-6">
        <Link
          href="/"
          aria-label="LevelUp — нүүр"
          className="flex min-h-12 items-center no-underline"
        >
          <Logo />
        </Link>
        <nav aria-label="Үндсэн цэс" className="hidden gap-1 md:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`${navLinkClass} ${active ? "bg-lavender" : ""}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex items-center gap-2">
        {pet && <PetChip {...pet} />}
        <Link
          href="/teacher"
          className={`${navLinkClass} hidden px-4 text-sm md:inline-flex`}
        >
          Багш
        </Link>
      </div>
    </header>
  );
}
