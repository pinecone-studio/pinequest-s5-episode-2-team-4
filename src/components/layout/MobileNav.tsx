"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PetSprite } from "@/components/pet/PetSprite";
import { usePetPreview } from "@/components/pet/petPreview";
import { NavBadge } from "./NavBadge";
import type { NavCounts } from "./SiteHeader";

const HomeIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="size-5.5"
  >
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
  </svg>
);

const PlayIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className="size-5.5"
  >
    <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z" />
  </svg>
);

const TaskIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="size-5.5"
  >
    <rect x="5" y="4" width="14" height="17" rx="2.5" />
    <path d="M9 4.5V3h6v1.5" />
    <path d="m9 12.5 2 2 4-4" />
  </svg>
);

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
    { href: "/", label: "Нүүр", icon: HomeIcon },
    { href: "/games", label: "Тоглоом", icon: PlayIcon },
    { href: "/assignments", label: "Даалгавар", icon: TaskIcon, count: counts.assignments, countLabel: "биелүүлээгүй даалгавар" },
    { href: "/pets", label: "Тэжээвэр", icon: petIcon(petSprite) },
  ];

  return (
    <nav
      aria-label="Үндсэн цэс"
      className="sticky bottom-0 z-10 grid grid-cols-4 gap-1 bg-white px-3 pt-2 pb-3 shadow-[0_-8px_24px_rgb(63_7_145/0.1)] lg:hidden"
    >
      {LINKS.map((link) => {
        const active =
          link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-card text-xs font-bold text-ink no-underline hover:text-ink ${
              active ? "bg-lavender" : ""
            }`}
          >
            {link.icon}
            {link.label}
            {link.count ? (
              <NavBadge count={link.count} label={`${link.count} ${link.countLabel}`} className="absolute top-1 right-[calc(50%-24px)]" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
