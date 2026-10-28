"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const LINKS: { href: string; label: string; exact?: boolean; also?: string }[] = [
  { href: "/teacher", label: "Самбар", exact: true },
  { href: "/teacher/students", label: "Сурагчид" },
  { href: "/teacher/videos", label: "Хичээлийн видео" },
  { href: "/teacher/assignments", label: "Даалгавар" },
  { href: "/teacher/history", label: "Түүх", also: "/teacher/english" },
];

type TeacherNavProps = {
  /** "bar" sits in the header row (lg up); "tabs" is the header's second row below lg. */
  variant: "bar" | "tabs";
  className?: string;
};

/** The teacher's sections, inside the header: links on wide screens, scrolling tabs on phones. */
export function TeacherNav({ variant, className }: TeacherNavProps) {
  const pathname = usePathname();
  return (
    <nav aria-label="Багшийн цэс" className={className}>
      <ul
        className={cn(
          "flex",
          variant === "bar" ? "gap-1" : "-mx-1 gap-1 overflow-x-auto px-1",
        )}
      >
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
                  "inline-flex items-center font-semibold whitespace-nowrap text-ink no-underline hover:text-ink",
                  variant === "bar"
                    ? cn("min-h-12 rounded-full px-4 hover:bg-white/60 xl:px-5", active && "bg-lavender")
                    : cn(
                        "min-h-11 border-b-3 px-3 text-sm",
                        active ? "border-primary text-primary hover:text-primary" : "border-transparent",
                      ),
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
