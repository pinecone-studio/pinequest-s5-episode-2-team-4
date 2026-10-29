import Link from "next/link";
import { AccountMenu } from "@/components/layout/AccountMenu";
import { Logo } from "@/components/layout/Logo";
import { SwapIcon } from "@/components/layout/navIcons";
import { getActiveClass, getCurrentUser } from "@/lib/data";
import { subjectTitle } from "@/lib/subjects";
import { SectionTabs, TeacherNav } from "./TeacherNav";

/**
 * Header for the teacher pages: logo with a "Багш" tag and the four sections
 * (lg up; the dock has them below lg), then the current class and the
 * account menu (dark mode, «Гарах»). A section with two pages shows them as
 * tabs under the header.
 */
export async function TeacherHeader() {
  // The layout makes sure there is one.
  const [active, user] = await Promise.all([getActiveClass(), getCurrentUser()]);

  return (
    // Named so it stays put while the page below animates (globals.css).
    <header style={{ viewTransitionName: "site-header" }} className="mb-6 border-b border-line bg-white/90 backdrop-blur-md md:mb-8">
      <div className="mx-auto flex h-18 w-full max-w-7xl items-center justify-between gap-3 px-4 md:h-22 md:gap-4 md:px-[clamp(16px,4vw,40px)]">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            aria-label="LevelUp — нүүр"
            className="flex min-h-12 shrink-0 items-center gap-2 no-underline md:gap-2.5"
          >
            <Logo />
            <span className="rounded-full bg-ink px-2.5 py-0.75 text-xs font-bold text-white md:px-3 md:py-1 md:text-sm">
              Багш
            </span>
          </Link>
          <TeacherNav className="hidden lg:block" />
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/classes"
            aria-label={`Анги ${active?.name}, ${active ? subjectTitle(active.subject) : ""}. Анги солих`}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-surface px-1.5 text-sm font-bold text-ink no-underline hover:bg-lavender hover:text-ink sm:pr-3"
          >
            <span className="flex h-9 min-w-9 items-center justify-center rounded-full bg-primary px-2 text-sm text-white">
              {active?.name}
            </span>
            <span className="hidden sm:inline">{active && subjectTitle(active.subject)}</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="mr-1 size-4 text-ink-muted"
            >
              <path d="m7 15 5 5 5-5M7 9l5-5 5 5" />
            </svg>
          </Link>
          <AccountMenu
            label="Бүртгэлийн цэс"
            title={user?.username ?? "Багш"}
            subtitle={active ? `${active.name} анги · ${subjectTitle(active.subject)}` : undefined}
            links={[{ href: "/classes", label: "Анги солих", icon: <SwapIcon /> }]}
            trigger={
              <span className="flex size-12 items-center justify-center rounded-full bg-ink text-base font-bold text-white">
                {(user?.username ?? "Б").slice(0, 1).toUpperCase()}
              </span>
            }
            triggerClassName="rounded-full"
          />
        </div>
      </div>

      <SectionTabs className="mx-auto w-full max-w-7xl px-4 md:px-[clamp(16px,4vw,40px)]" />
    </header>
  );
}
