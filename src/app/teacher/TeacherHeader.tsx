import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { logOut } from "@/lib/actions";
import { getActiveClass } from "@/lib/data";
import { subjectTitle } from "@/lib/subjects";
import { TeacherNav } from "./TeacherNav";

/**
 * Header for the teacher dashboard, laid out like the student one: logo with a
 * "Багш" tag and the sections, then the current class and log out. Below lg the
 * sections move to a second row of tabs inside the header.
 */
export async function TeacherHeader() {
  // The layout makes sure there is one.
  const active = await getActiveClass();

  return (
    <header className="mb-6 border-b border-line md:mb-8">
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
          <TeacherNav variant="bar" className="hidden lg:block" />
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
          <form action={logOut}>
            {/* Icon only on mobile, where the header is tight. */}
            <button
              type="submit"
              aria-label="Гарах"
              className="inline-flex min-h-12 min-w-12 cursor-pointer items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold text-ink hover:bg-white/60 md:px-4"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="size-5"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="m16 17 5-5-5-5" />
                <path d="M21 12H9" />
              </svg>
              <span className="hidden md:inline">Гарах</span>
            </button>
          </form>
        </div>
      </div>

      <TeacherNav
        variant="tabs"
        className="mx-auto w-full max-w-7xl px-4 md:px-[clamp(16px,4vw,40px)] lg:hidden"
      />
    </header>
  );
}
