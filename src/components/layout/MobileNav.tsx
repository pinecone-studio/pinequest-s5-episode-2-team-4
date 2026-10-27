"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PetSprite } from "@/components/pet/PetSprite";
import { usePetPreview } from "@/components/pet/petPreview";

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

function petIcon(sprite?: string) {
  return sprite ? (
    <PetSprite stage={{ name: "", sprite }} size={24} />
  ) : (
    <span aria-hidden="true" className="size-6 rounded-full bg-lavender" />
  );
}

/** Sticky bottom navigation for student pages on small screens. */
export function MobileNav({ petSprite: realSprite }: { petSprite?: string }) {
  // The /pets evolution demo shows each stage here too.
  const petSprite = usePetPreview()?.sprite ?? realSprite;
  const pathname = usePathname();
  const LINKS = [
    { href: "/", label: "Нүүр", icon: HomeIcon },
    { href: "/games", label: "Тоглоом", icon: PlayIcon },
    { href: "/pets", label: "Тэжээвэр", icon: petIcon(petSprite) },
  ];

  return (
    <nav
      aria-label="Үндсэн цэс"
      className="sticky bottom-0 z-10 grid grid-cols-3 gap-1.5 bg-white px-3 pt-2 pb-3 shadow-[0_-8px_24px_rgb(63_7_145/0.1)] md:hidden"
    >
      {LINKS.map((link) => {
        const active =
          link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-card text-xs font-bold text-ink no-underline hover:text-ink ${
              active ? "bg-lavender" : ""
            }`}
          >
            {link.icon}
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
