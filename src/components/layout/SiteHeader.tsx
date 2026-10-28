"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePetPreview } from "@/components/pet/petPreview";
import { logOut } from "@/lib/actions";
import { Logo } from "./Logo";
import { NavBadge } from "./NavBadge";
import { PetChip } from "./PetChip";

export type NavCounts = {
  /** Lesson videos the student hasn't opened yet */
  videos?: number;
  /** Assignments not finished yet */
  assignments?: number;
};

const NAV_LINKS: { href: string; label: string; count?: keyof NavCounts; countLabel?: string }[] = [
  { href: "/games", label: "Тоглоом" },
  { href: "/pets", label: "Тэжээвэр" },
  { href: "/videos", label: "Видео хичээл", count: "videos", countLabel: "шинэ видео" },
  { href: "/assignments", label: "Даалгавар", count: "assignments", countLabel: "биелүүлээгүй даалгавар" },
];

// No display or padding here: each link sets its own, so a `hidden`
// never clashes with `inline-flex`.
const navLinkClass =
  "min-h-12 items-center rounded-full font-semibold text-ink no-underline hover:bg-white/60 hover:text-ink";

type SiteHeaderProps = {
  pet?: React.ComponentProps<typeof PetChip>;
  counts?: NavCounts;
};

/** Header for student pages. Nav links move to MobileNav below lg (they don't fit on tablets). */
export function SiteHeader({ pet: realPet, counts = {} }: SiteHeaderProps) {
  const pathname = usePathname();
  // The /pets evolution demo shows each stage here too.
  const preview = usePetPreview();
  const pet =
    realPet && preview
      ? { ...realPet, name: preview.name, level: preview.level, imageSrc: preview.sprite }
      : realPet;

  return (
    <header className="relative z-10 mx-auto flex h-18 w-full max-w-7xl items-center justify-between gap-3 px-4 md:h-22 md:gap-4 md:px-[clamp(16px,4vw,40px)]">
      <div className="flex items-center gap-6">
        <Link
          href="/"
          aria-label="LevelUp — нүүр"
          className="flex min-h-12 items-center no-underline"
        >
          <Logo />
        </Link>
        <nav aria-label="Үндсэн цэс" className="hidden gap-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`${navLinkClass} inline-flex gap-2 px-4 whitespace-nowrap xl:px-5 ${active ? "bg-lavender" : ""}`}
              >
                {link.label}
                {link.count && (
                  <NavBadge count={counts[link.count] ?? 0} label={`${counts[link.count] ?? 0} ${link.countLabel}`} />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex items-center gap-2">
        {pet && <PetChip {...pet} />}
        {/* No teacher link: only students see this header, and /teacher sends them home. */}
        <form action={logOut}>
          {/* Icon only on mobile, where the header is tight. */}
          <button
            type="submit"
            aria-label="Гарах"
            className={`${navLinkClass} inline-flex min-w-12 cursor-pointer justify-center gap-2 px-3 text-sm md:px-4`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="size-5"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="m16 17 5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
            <span className="hidden md:inline">Гарах</span>
          </button>
        </form>
      </div>
    </header>
  );
}
