"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePetPreview } from "@/components/pet/petPreview";
import { ButtonLink } from "@/components/ui";
import { cn } from "@/lib/cn";
import { AccountMenu } from "./AccountMenu";
import { CoinChip } from "./CoinChip";
import { Logo } from "./Logo";
import { NavPill } from "./NavPill";
import { NavBadge } from "./NavBadge";
import { BookIcon, HomeIcon, PawIcon, PlayIcon, SwapIcon, TaskIcon } from "./navIcons";
import { PetChip } from "./PetChip";

export type NavCounts = {
  /** Lesson videos the student hasn't opened yet */
  videos?: number;
  /** Assignments not finished yet */
  assignments?: number;
  /** 1 while today's class lesson hasn't been answered («Ойлгосон уу?») */
  lesson?: number;
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
  /** The student's coins, shown beside the pet. */
  coins?: number;
  className?: string;
};

/**
 * Header for student pages (design: header), a floating bar that stays at
 * the top. Nav links and «Тоглох» move to MobileNav below lg (they don't fit
 * on tablets); the logo and the pet stay. The pet opens the account menu:
 * the pet page, changing subject, dark mode and «Гарах». On smaller laptops
 * the bar drops the nav icons (below xl) and the pet's name (below 1360px).
 */
export function SiteHeader({ pet: realPet, counts = {}, subject, coins, className }: SiteHeaderProps) {
  const pathname = usePathname();
  // The /pets evolution demo shows each stage here too.
  const preview = usePetPreview();
  const pet =
    realPet && preview
      ? { ...realPet, name: preview.name, level: preview.level, imageSrc: preview.sprite }
      : realPet;

  const links: { href: string; label: string; icon: React.ReactNode; count?: number; countLabel?: string }[] = [
    { href: "/", label: "Нүүр", icon: <HomeIcon className={iconClass} />, count: counts.lesson, countLabel: "өнөөдрийн хичээлийн асуулт" },
    { href: "/videos", label: "Хичээл", icon: <BookIcon className={iconClass} />, count: counts.videos, countLabel: "шинэ видео" },
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
          {coins !== undefined && <CoinChip coins={coins} />}
          <span aria-hidden="true" className="mx-1 hidden h-9 w-px bg-line lg:block" />
          {pet && (
            <AccountMenu
              label={`${pet.name}, түвшин ${pet.level}. Бүртгэлийн цэс`}
              title={`${pet.name} · Түв. ${pet.level}`}
              subtitle={subject ? `Хичээл: ${subject}` : undefined}
              links={[
                { href: "/pets", label: "Миний тэжээвэр", icon: <PawIcon /> },
                { href: "/subject", label: "Хичээл солих", detail: subject, icon: <SwapIcon /> },
              ]}
              trigger={<PetChip {...pet} />}
              triggerClassName="rounded-full hover:bg-surface"
            />
          )}
        </div>
      </div>
    </header>
  );
}
