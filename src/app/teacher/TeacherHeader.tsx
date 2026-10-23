import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { logOut } from "@/lib/actions";

/** Header for the teacher dashboard: logo with a "Багш" tag and log out. */
export function TeacherHeader() {
  return (
    <header className="mx-auto flex h-18 w-full max-w-7xl items-center justify-between gap-3 px-4 md:h-22 md:gap-4 md:px-[clamp(16px,4vw,40px)]">
      <Link
        href="/teacher"
        aria-label="LevelUp — багшийн самбар"
        className="flex min-h-12 items-center gap-2 no-underline md:gap-2.5"
      >
        <Logo />
        <span className="rounded-full bg-ink px-2.5 py-0.75 text-xs font-bold text-white md:px-3 md:py-1 md:text-[13px]">
          Багш
        </span>
      </Link>
      <form action={logOut}>
        <button
          type="submit"
          className="inline-flex min-h-12 cursor-pointer items-center rounded-full px-4 text-sm font-semibold text-ink hover:bg-surface"
        >
          Гарах
        </button>
      </form>
    </header>
  );
}
