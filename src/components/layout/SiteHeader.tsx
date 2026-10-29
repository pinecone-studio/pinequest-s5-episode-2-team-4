"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PetSprite } from "@/components/pet/PetSprite";
import { usePetPreview } from "@/components/pet/petPreview";
import { ButtonLink } from "@/components/ui";
import { logOut } from "@/lib/actions";
import { cn } from "@/lib/cn";
import { Logo } from "./Logo";
import { NavPill } from "./NavPill";
import { NavBadge } from "./NavBadge";
import { BookIcon, HomeIcon, PlayIcon, TaskIcon } from "./navIcons";
import { PetChip } from "./PetChip";

export type NavCounts = {
  /** Lesson videos the student hasn't opened yet */
  videos?: number;
  /** Assignments not finished yet */
  assignments?: number;
};

// No display or padding here: each link sets its own, so a `hidden`
// never clashes with `inline-flex`. Colours are separate because `cn`
// doesn't resolve clashing utilities.
const navLinkClass = "min-h-12 items-center rounded-full no-underline transition-colors duration-200";
const idleClass = "font-semibold text-ink hover:bg-surface hover:text-ink";
// Nav icons from xl: on smaller laptops the labels alone fit.
const iconClass = "hidden size-5 xl:block";

type SiteHeaderProps = {
  pet?: React.ComponentProps<typeof PetChip>;
  counts?: NavCounts;
  /** The subject being studied, e.g. "Математик"; links to /subject to change it. */
  subject?: string;
  className?: string;
};

/**
 * Header for student pages (design: header), a floating bar that stays at
 * the top. Nav links and «Тоглох» move to MobileNav below lg (they don't fit
 * on tablets); the logo, subject, pet and logout stay. On smaller laptops the
 * bar drops the nav icons and the subject (below xl) and the pet's name (below
 * 1360px, where the bar reaches its full width).
 */
export function SiteHeader({ pet: realPet, counts = {}, subject, className }: SiteHeaderProps) {
  const pathname = usePathname();
  // The /pets evolution demo shows each stage here too.
  const preview = usePetPreview();
  const pet =
    realPet && preview
      ? { ...realPet, name: preview.name, level: preview.level, imageSrc: preview.sprite }
      : realPet;

  const links: { href: string; label: string; icon: React.ReactNode; count?: number; countLabel?: string }[] = [
    { href: "/", label: "Нүүр", icon: <HomeIcon className={iconClass} /> },
    { href: "/videos", label: "Хичээл", icon: <BookIcon className={iconClass} />, count: counts.videos, countLabel: "шинэ видео" },
    {
      href: "/pets",
      label: "Тэжээвэр",
      icon: pet?.imageSrc ? (
        <PetSprite stage={{ name: "", sprite: pet.imageSrc }} size={24} className="hidden shrink-0 xl:block" />
      ) : (
        <span aria-hidden="true" className="hidden size-6 shrink-0 rounded-full bg-lavender xl:block" />
      ),
    },
    { href: "/assignments", label: "Даалгавар", icon: <TaskIcon className={iconClass} />, count: counts.assignments, countLabel: "биелүүлээгүй даалгавар" },
  ];
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    // Named so it stays put while the page below animates (globals.css).
    <header
      style={{ viewTransitionName: "site-header" }}
      className={cn("sticky top-0 z-20 px-3 pt-2.5 md:px-[clamp(16px,4vw,40px)] md:pt-4", className)}
    >
      <div className="mx-auto flex h-17 w-full max-w-7xl items-center justify-between gap-2.5 rounded-full border border-line bg-white/90 pr-1.5 pl-4 shadow-card backdrop-blur-md lg:h-19 lg:gap-4 lg:pr-2.5 lg:pl-5.5">
        <Link href="/" aria-label="LevelUp — нүүр" className="flex min-h-12 shrink-0 items-center no-underline">
          <Logo />
        </Link>
        <nav aria-label="Үндсэн цэс" className="hidden flex-1 justify-center gap-1 lg:flex xl:gap-1.5">
          {links.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  navLinkClass,
                  "relative isolate inline-flex gap-2 px-3 whitespace-nowrap min-[1360px]:px-4",
                  active ? "font-bold text-primary hover:text-primary" : idleClass,
                )}
              >
                {active && <NavPill name="header-pill" />}
                {link.icon}
                {link.label}
                {link.count ? <NavBadge count={link.count} label={`${link.count} ${link.countLabel}`} /> : null}
              </Link>
            );
          })}
        </nav>
        <div className="flex shrink-0 items-center gap-1.5 lg:gap-2">
          <ButtonLink
            href="/games"
            size="sm"
            aria-current={pathname.startsWith("/games") ? "page" : undefined}
            className="max-lg:hidden"
          >
            <PlayIcon className="size-4.5" />
            Тоглох
          </ButtonLink>
          <Link
            href="/subject"
            aria-label={subject ? `Хичээл: ${subject}. Солих` : "Хичээл сонгох"}
            aria-current={pathname === "/subject" ? "page" : undefined}
            className={cn(navLinkClass, idleClass, "hidden gap-1.5 bg-surface px-4 text-sm sm:inline-flex lg:hidden xl:inline-flex")}
          >
            {subject ?? "Хичээл сонгох"}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="size-4 text-ink-muted"
            >
              <path d="m7 15 5 5 5-5M7 9l5-5 5 5" />
            </svg>
          </Link>
          <span aria-hidden="true" className="mx-1 hidden h-9 w-px bg-line lg:block" />
          {pet && <PetChip {...pet} />}
          {/* No teacher link: only students see this header, and /teacher sends them home. */}
          <form action={logOut}>
            <button
              type="submit"
              aria-label="Гарах"
              title="Гарах"
              className={cn(navLinkClass, idleClass, "inline-flex min-w-12 cursor-pointer justify-center px-3")}
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
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
