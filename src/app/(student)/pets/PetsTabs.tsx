"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/pets", label: "Миний тэжээвэр", exact: true },
  { href: "/pets/battle", label: "Боссууд" },
  { href: "/pets/join", label: "Нэгдэх" },
  { href: "/pets/eggs", label: "Өндөг", badge: "eggs" as const },
  { href: "/pets/progress", label: "Ахиц" },
];

/** Tabs for the Pets area: pets and collection, bosses, joining a group, eggs, English progress. */
export function PetsTabs({ eggCount }: { eggCount: number }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Тэжээвэрийн хэсэг" className="mx-auto max-w-7xl px-4 pt-2 md:px-[clamp(16px,4vw,40px)]">
      {/* Scrolls sideways on narrow screens instead of wrapping. */}
      <ul className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
        {TABS.map((tab) => {
          const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
          const count = tab.badge === "eggs" ? eggCount : 0;
          return (
            <li key={tab.href} className="shrink-0">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 rounded-full px-4 font-bold whitespace-nowrap no-underline",
                  active ? "bg-primary text-white hover:text-white" : "bg-surface text-ink hover:bg-lavender hover:text-ink",
                )}
              >
                {tab.label}
                {count > 0 ? (
                  <span
                    aria-label={`${count} өндөг`}
                    className={cn(
                      "rounded-full px-2 text-xs leading-5",
                      active ? "bg-white text-primary" : "bg-magenta text-white",
                    )}
                  >
                    {count}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
