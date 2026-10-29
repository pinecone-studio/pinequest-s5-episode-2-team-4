"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { NavPill } from "@/components/layout/NavPill";
import { cn } from "@/lib/cn";
import "./PetsTabs.css";

type Tab = {
  href: string;
  label: string;
  /** 24×24 stroke icon. */
  icon: ReactNode;
  /** Icon circle colours while the tab isn't the current one. */
  iconColors: string;
  exact?: boolean;
  badge?: "eggs";
};

const TABS: Tab[] = [
  {
    href: "/pets",
    label: "Миний тэжээвэр",
    exact: true,
    iconColors: "bg-sky text-ink",
    icon: (
      <>
        <circle cx="11" cy="4" r="2" />
        <circle cx="18" cy="8" r="2" />
        <circle cx="20" cy="16" r="2" />
        <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z" />
      </>
    ),
  },
  {
    href: "/pets/battle",
    label: "Боссууд",
    iconColors: "bg-magenta text-white",
    icon: <path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M14.5 6.5 18 3h3v3l-3.5 3.5M5 14l4 4M7 17l-3 3M3 19l2 2" />,
  },
  {
    href: "/pets/join",
    label: "Нэгдэх",
    iconColors: "bg-lavender text-ink",
    icon: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
  {
    href: "/pets/eggs",
    label: "Өндөг",
    badge: "eggs",
    iconColors: "bg-pink text-magenta",
    icon: <path d="M12 22c6.23-.05 7.87-5.57 7.5-10-.36-4.34-3.95-9.96-7.5-10-3.55.04-7.14 5.66-7.5 10-.37 4.43 1.27 9.95 7.5 10z" />,
  },
  {
    href: "/pets/progress",
    label: "Ахиц",
    iconColors: "bg-line text-ink",
    icon: <path d="M22 7 13.5 15.5l-5-5L2 17M16 7h6v6" />,
  },
  {
    href: "/pets/history",
    label: "Түүх",
    iconColors: "bg-primary-dark text-white",
    icon: <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5M12 7v5l4 2" />,
  },
];

/**
 * Tabs for the Pets area (pets and collection, bosses, joining, eggs, English
 * progress, battle history): one track under the header, each tab an icon in
 * a coloured circle, and a purple pill that slides to the current tab.
 */
export function PetsTabs({ eggCount }: { eggCount: number }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Тэжээвэрийн хэсэг" className="mx-auto max-w-7xl px-4 pt-2 md:px-[clamp(16px,4vw,40px)]">
      {/* The track scrolls sideways on narrow screens instead of wrapping. */}
      <div className="-mx-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
        <ul className="flex w-max gap-0.5 rounded-full border-2 border-lavender bg-card p-1 shadow-[0_3px_0_var(--color-lavender)] md:gap-1">
          {TABS.map((tab) => {
            const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
            const count = tab.badge === "eggs" ? eggCount : 0;
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "pets-tab relative isolate inline-flex min-h-11 items-center gap-2 rounded-full py-1 pr-3.5 pl-1 text-sm font-bold whitespace-nowrap no-underline md:pr-4 md:text-base",
                    active ? "text-white hover:text-white" : "text-ink hover:bg-surface hover:text-ink",
                  )}
                >
                  {active && (
                    <NavPill
                      name="pets-tabs-pill"
                      className="inset-0 rounded-full bg-primary shadow-[0_3px_0_var(--color-primary-dark)]"
                    />
                  )}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "pets-tab-icon flex size-8 shrink-0 items-center justify-center rounded-full",
                      active ? "pets-tab-icon-on bg-white text-primary" : tab.iconColors,
                    )}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="size-4"
                    >
                      {tab.icon}
                    </svg>
                  </span>
                  {tab.label}
                  {count > 0 ? (
                    <span
                      aria-label={`${count} өндөг`}
                      className={cn(
                        "pets-tab-count rounded-full px-2 text-xs leading-5",
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
      </div>
    </nav>
  );
}
