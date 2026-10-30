"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { NavBadge } from "./NavBadge";
import { NavPill } from "./NavPill";
import { HomeIcon, PlayIcon, TaskIcon, VideoIcon } from "./navIcons";
import type { NavCounts } from "./SiteHeader";

/**
 * Bottom navigation for student pages on phones and tablets: a floating dock
 * whose current item rises into a purple circle. It stays in the page flow
 * (sticky), so at the end of the page it sits below the footer instead of
 * covering it, and it keeps clear of the iPhone home bar. The pet page is in
 * the header's account menu, not here.
 */
export function MobileNav({ counts = {} }: { counts?: NavCounts }) {
  const pathname = usePathname();
  const LINKS = [
    { href: "/", label: "Нүүр", icon: <HomeIcon className="size-5.5" />, count: counts.lesson, countLabel: "өнөөдрийн хичээлийн асуулт" },
    { href: "/games", label: "Тоглоом", icon: <PlayIcon className="size-5.5" /> },
    { href: "/videos", label: "Хичээл", icon: <VideoIcon className="size-5.5" />, count: counts.videos, countLabel: "шинэ видео" },
    { href: "/assignments", label: "Даалгавар", icon: <TaskIcon className="size-5.5" />, count: counts.assignments, countLabel: "биелүүлээгүй даалгавар" },
  ];

  return (
    <div className="sticky bottom-0 z-10 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
      <div className="relative mx-auto max-w-md">
        {/* The white dock is its own layer, not the nav: the nav is named for
            page transitions, and its snapshot must be transparent so the
            sliding circle shows beneath the icons. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-full border border-line bg-white/90 shadow-float backdrop-blur-md"
        />
        <nav
          aria-label="Үндсэн цэс"
          style={{ viewTransitionName: "bottom-nav" }}
          className="relative grid grid-cols-4 gap-1 px-2 py-1.5"
        >
          {LINKS.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className="flex min-h-15 flex-col items-center justify-end gap-0.5 rounded-card pb-1 text-xs font-bold text-ink no-underline hover:text-ink"
              >
                <span
                  className={cn(
                    "relative isolate flex size-11 items-center justify-center rounded-full",
                    active ? "-translate-y-3.5 text-white" : "text-ink",
                  )}
                >
                  {active && <NavPill name="mobile-pill" className="inset-0 rounded-full bg-primary shadow-3d" />}
                  {link.icon}
                  {link.count ? (
                    <NavBadge count={link.count} label={`${link.count} ${link.countLabel}`} className="absolute -top-1 -right-1.5" />
                  ) : null}
                </span>
                <span className={active ? "text-primary" : undefined}>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
