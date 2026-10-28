import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { logOut } from "@/lib/actions";
import { requireTeacher } from "@/lib/auth";
import { selectClass } from "@/lib/class-actions";
import { getCurrentUser, getTeacherClasses } from "@/lib/data";
import { subjectTitle } from "@/lib/subjects";
import { NewClassCard } from "./NewClassCard";

export const metadata: Metadata = {
  title: "Ангиа сонгох · LevelUp",
};

/** Where a teacher lands after logging in: pick the class to work in, or add one. */
export default async function ClassesPage() {
  await requireTeacher();
  const [classes, user] = await Promise.all([getTeacherClasses(), getCurrentUser()]);
  const subject = user?.subject ? subjectTitle(user.subject) : undefined;

  return (
    <>
      <header className="mx-auto flex h-18 w-full max-w-7xl items-center justify-between gap-3 px-4 md:h-22 md:px-[clamp(16px,4vw,40px)]">
        <Link href="/classes" aria-label="LevelUp" className="flex min-h-12 items-center gap-2 no-underline md:gap-2.5">
          <Logo />
          <span className="rounded-full bg-ink px-2.5 py-0.75 text-xs font-bold text-white md:px-3 md:py-1 md:text-sm">
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

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-16 md:px-[clamp(16px,4vw,40px)] md:pt-10">
        <h1 className="type-page-title">Ангиа сонгох</h1>
        <p className="mt-2 text-base font-semibold text-ink-muted">
          {subject ? `${subject} · ` : ""}
          {classes.length ? "Өнөөдөр аль ангид хичээл заах вэ?" : "Одоогоор анги алга. Эхний ангиа нэмээрэй."}
        </p>

        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => (
            <li key={c.id}>
              <form action={selectClass.bind(null, c.id)} className="h-full">
                <button
                  type="submit"
                  className="flex h-full min-h-36 w-full cursor-pointer flex-col items-start justify-between gap-4 rounded-panel bg-card p-6 text-left shadow-card transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-float"
                >
                  <span className="text-5xl leading-none font-bold tracking-tight">{c.name}</span>
                  <span className="flex w-full items-center justify-between gap-3 text-sm font-semibold text-ink-muted">
                    <span>
                      {subjectTitle(c.subject)} · {c.studentCount ?? 0} сурагч
                    </span>
                    <span aria-hidden="true" className="text-lg text-primary">
                      →
                    </span>
                  </span>
                </button>
              </form>
            </li>
          ))}
          <li>
            <NewClassCard demo={Boolean(user?.demo)} />
          </li>
        </ul>
      </main>
      <SiteFooter />
    </>
  );
}
