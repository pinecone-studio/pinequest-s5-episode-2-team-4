"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dock } from "@/components/layout/Dock";
import { MenuPopover, menuItemClass } from "@/components/layout/MenuPopover";
import { NavPill } from "@/components/layout/NavPill";
import { BookIcon, ClockIcon, GridIcon, UsersIcon } from "@/components/layout/navIcons";
import { cn } from "@/lib/cn";

type Page = { href: string; label: string; exact?: boolean; also?: string };
type Section = { label: string; icon: (className: string) => React.ReactNode; pages: Page[] };

/** The teacher's four sections; Анги and Агуулга hold two pages each. */
export const SECTIONS: Section[] = [
  { label: "Самбар", icon: (c) => <GridIcon className={c} />, pages: [{ href: "/teacher", label: "Самбар", exact: true }] },
  {
    label: "Анги",
    icon: (c) => <UsersIcon className={c} />,
    pages: [
      { href: "/teacher/students", label: "Сурагчид" },
      { href: "/teacher/schedule", label: "Хуваарь" },
    ],
  },
  {
    label: "Агуулга",
    icon: (c) => <BookIcon className={c} />,
    pages: [
      { href: "/teacher/videos", label: "Хичээлийн видео" },
      { href: "/teacher/assignments", label: "Даалгавар" },
    ],
  },
  {
    label: "Түүх",
    icon: (c) => <ClockIcon className={c} />,
    pages: [{ href: "/teacher/history", label: "Түүх", also: "/teacher/english" }],
  },
];

const pageActive = (page: Page, pathname: string) =>
  page.exact
    ? pathname === page.href
    : pathname.startsWith(page.href) || Boolean(page.also && pathname.startsWith(page.also));

/** The section the current page belongs to. */
export const activeSection = (pathname: string) => SECTIONS.find((s) => s.pages.some((p) => pageActive(p, pathname)));

const barItemClass =
  "relative isolate inline-flex min-h-12 items-center gap-1.5 rounded-full px-4 font-semibold whitespace-nowrap text-ink no-underline transition-colors duration-200 hover:bg-white/60 hover:text-ink xl:px-5";

/** The four sections in the header (lg up); Анги and Агуулга open a small menu. */
export function TeacherNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const current = activeSection(pathname);
  return (
    <nav aria-label="Багшийн цэс" className={className}>
      <ul className="flex gap-1">
        {SECTIONS.map((section) => {
          const active = section === current;
          const pill = active && <NavPill name="teacher-pill" />;
          return (
            <li key={section.label} className="shrink-0">
              {section.pages.length === 1 ? (
                <Link href={section.pages[0].href} aria-current={active ? "page" : undefined} className={barItemClass}>
                  {pill}
                  {section.label}
                </Link>
              ) : (
                <MenuPopover
                  label={`${section.label}: ${section.pages.map((p) => p.label).join(", ")}`}
                  trigger={
                    <>
                      {pill}
                      {section.label}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-4 text-ink-muted">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </>
                  }
                  triggerClassName={barItemClass}
                >
                  {section.pages.map((page) => (
                    <Link
                      key={page.href}
                      href={page.href}
                      aria-current={pageActive(page, pathname) ? "page" : undefined}
                      className={cn(menuItemClass, pageActive(page, pathname) && "bg-surface font-bold text-primary hover:text-primary")}
                    >
                      {page.label}
                    </Link>
                  ))}
                </MenuPopover>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Under the header: the pages of the current section, when it has more than one. */
export function SectionTabs({ className }: { className?: string }) {
  const pathname = usePathname();
  const section = activeSection(pathname);
  if (!section || section.pages.length < 2) return null;
  return (
    <nav aria-label={section.label} className={className}>
      <ul className="flex gap-1">
        {section.pages.map((page) => {
          const active = pageActive(page, pathname);
          return (
            <li key={page.href}>
              <Link
                href={page.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative isolate inline-flex min-h-11 items-center px-3 text-sm font-semibold whitespace-nowrap text-ink no-underline hover:text-ink",
                  active && "text-primary hover:text-primary",
                )}
              >
                {active && <NavPill name="teacher-tab" className="inset-x-0 bottom-0 h-0.75 rounded-full bg-primary" />}
                {page.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Bottom dock for teachers on phones and tablets, like the students' one:
 * the four sections; a section opens its first page.
 */
export function TeacherDock() {
  const pathname = usePathname();
  const current = activeSection(pathname);
  return (
    <Dock>
      <nav aria-label="Багшийн цэс" style={{ viewTransitionName: "bottom-nav" }} className="relative grid grid-cols-4 gap-1 px-2 py-1.5">
        {SECTIONS.map((section) => {
          const active = section === current;
          return (
            <Link
              key={section.label}
              href={section.pages[0].href}
              aria-current={active ? "page" : undefined}
              className="flex min-h-15 flex-col items-center justify-end gap-0.5 rounded-card pb-1 text-xs font-bold text-ink no-underline hover:text-ink"
            >
              <span className={cn("relative isolate flex size-11 items-center justify-center rounded-full", active ? "-translate-y-3.5 text-white" : "text-ink")}>
                {active && <NavPill name="mobile-pill" className="inset-0 rounded-full bg-primary shadow-3d" />}
                {section.icon("size-5.5")}
              </span>
              <span className={active ? "text-primary" : undefined}>{section.label}</span>
            </Link>
          );
        })}
      </nav>
    </Dock>
  );
}
