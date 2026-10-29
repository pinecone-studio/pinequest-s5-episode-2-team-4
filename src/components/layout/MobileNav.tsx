"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PetSprite } from "@/components/pet/PetSprite";
import { usePetPreview } from "@/components/pet/petPreview";
import { NavBadge } from "./NavBadge";
import { NavPill } from "./NavPill";
import { HomeIcon, PlayIcon, TaskIcon, VideoIcon } from "./navIcons";
import type { NavCounts } from "./SiteHeader";

function petIcon(sprite?: string) {
  return sprite ? (
    <PetSprite stage={{ name: "", sprite }} size={24} />
  ) : (
    <span aria-hidden="true" className="size-6 rounded-full bg-lavender" />
  );
}

/** Sticky bottom navigation for student pages on phones and tablets. */
export function MobileNav({ petSprite: realSprite, counts = {} }: { petSprite?: string; counts?: NavCounts }) {
  // The /pets evolution demo shows each stage here too.
  const petSprite = usePetPreview()?.sprite ?? realSprite;
  const pathname = usePathname();
  const LINKS = [
    { href: "/", label: "Нүүр", icon: <HomeIcon className="size-5.5" /> },
    { href: "/games", label: "Тоглоом", icon: <PlayIcon className="size-5.5" /> },
    { href: "/videos", label: "Видео", icon: <VideoIcon className="size-5.5" />, count: counts.videos, countLabel: "шинэ видео" },
    { href: "/assignments", label: "Даалгавар", icon: <TaskIcon className="size-5.5" />, count: counts.assignments, countLabel: "биелүүлээгүй даалгавар" },
    { href: "/pets", label: "Тэжээвэр", icon: petIcon(petSprite) },
  ];

  return (
    // The white bar is this wrapper, not the nav: the nav is named for page
    // transitions, and its snapshot must be transparent so the sliding pill
    // shows beneath the labels.
    <div className="sticky bottom-0 z-10 bg-white shadow-[0_-8px_24px_rgb(63_7_145/0.1)] lg:hidden">
      <nav
        aria-label="Үндсэн цэс"
        style={{ viewTransitionName: "bottom-nav" }}
        className="grid grid-cols-5 gap-1 px-3 pt-2 pb-3"
      >
        {LINKS.map((link) => {
          const active =
            link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className="relative isolate flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-card text-xs font-bold text-ink no-underline hover:text-ink"
            >
              {active && <NavPill name="mobile-pill" className="inset-0 rounded-card bg-lavender" />}
              {link.icon}
              {link.label}
              {link.count ? (
                <NavBadge count={link.count} label={`${link.count} ${link.countLabel}`} className="absolute top-1 right-[calc(50%-24px)]" />
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
