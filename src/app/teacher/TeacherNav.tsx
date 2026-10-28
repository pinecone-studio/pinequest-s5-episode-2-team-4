"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const LINKS: { href: string; label: string; exact?: boolean; also?: string }[] = [
  { href: "/teacher", label: "Самбар", exact: true },
  { href: "/teacher/assignments", label: "Даалгавар" },
  { href: "/teacher/history", label: "Түүх", also: "/teacher/english" },
];

/** The teacher's sections, under the header; scrolls sideways on phones. */
export function TeacherNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Багшийн цэс" className="mx-auto w-full max-w-[1280px] px-4 md:px-[clamp(16px,4vw,40px)]">
      <ul className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-2 md:gap-2">
        {LINKS.map((link) => {
          const active = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href) || Boolean(link.also && pathname.startsWith(link.also));
          return (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-full px-4 text-sm font-bold no-underline md:text-base",
                  active ? "bg-primary text-white hover:text-white" : "bg-surface text-ink hover:bg-lavender hover:text-ink",
                )}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
