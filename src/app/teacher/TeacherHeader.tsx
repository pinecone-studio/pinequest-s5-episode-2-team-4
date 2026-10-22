import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { getClassOverview, getTopic } from "@/lib/data";

/** Header for the teacher dashboard: logo with a "Багш" tag and the current class. */
export async function TeacherHeader() {
  const overview = await getClassOverview();
  const topic = await getTopic(overview.topicId);

  return (
    <header className="mx-auto flex h-[72px] w-full max-w-[1280px] items-center justify-between gap-3 px-4 md:h-[88px] md:gap-4 md:px-[clamp(16px,4vw,40px)]">
      <Link
        href="/"
        aria-label="LevelUp — нүүр"
        className="flex min-h-12 items-center gap-2 no-underline md:gap-2.5"
      >
        <Logo />
        <span className="rounded-full bg-ink px-2.5 py-[3px] text-xs font-bold text-white md:px-3 md:py-1 md:text-[13px]">
          Багш
        </span>
      </Link>

      {/* TODO: becomes a class picker once a teacher can have several classes */}
      <p className="inline-flex h-12 items-center gap-2 rounded-full bg-surface pr-4 pl-1.5 text-sm font-bold md:h-[52px] md:gap-2.5 md:pr-[18px] md:pl-2">
        <span
          aria-hidden="true"
          className="flex size-9 items-center justify-center rounded-full bg-primary text-[13px] text-white"
        >
          {overview.code}
        </span>
        <span className="sr-only">Анги {overview.code}, </span>
        {topic?.title}
      </p>
    </header>
  );
}
