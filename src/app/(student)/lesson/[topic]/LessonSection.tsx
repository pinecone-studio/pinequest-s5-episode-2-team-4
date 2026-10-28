import type { Lesson } from "@/lib/types";

type LessonSectionProps = {
  lesson: Pick<Lesson, "title" | "approvedByTeacher">;
  /** Explanation and practice, in the main column. */
  children: React.ReactNode;
  /** Anonymous questions: a sticky side column on wide screens. */
  helper: React.ReactNode;
  /** Below the main column; after the helper on narrow screens. */
  footer: React.ReactNode;
};

/** The lesson title and its two-column layout. */
export function LessonSection({
  lesson,
  children,
  helper,
  footer,
}: LessonSectionProps) {
  return (
    <section aria-labelledby="lesson-title" className="mt-6 md:mt-14">
      <div className="flex flex-col items-start gap-2 md:flex-row md:flex-wrap md:items-center md:gap-4">
        <h2
          id="lesson-title"
          className="text-3xl leading-[1.05] font-bold tracking-[-0.02em] md:text-4xl"
        >
          {lesson.title}
        </h2>
        {lesson.approvedByTeacher ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky px-2.5 py-0.75 text-xs font-bold md:px-3 md:py-1.25 md:text-sm">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="size-3 md:size-3.5"
            >
              <path d="M12 22c5.5-2.5 8-6.5 8-12V5l-8-3-8 3v5c0 5.5 2.5 9.5 8 12z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            Багш баталсан
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 md:mt-7 md:gap-6 min-[1100px]:grid-cols-[minmax(0,1fr)_minmax(340px,400px)] min-[1100px]:gap-x-7">
        <div className="flex min-w-0 flex-col gap-4 md:gap-6">{children}</div>
        <div className="min-w-0 min-[1100px]:sticky min-[1100px]:top-6 min-[1100px]:row-span-2 min-[1100px]:self-start">
          {helper}
        </div>
        <div className="min-w-0 min-[1100px]:col-start-1">{footer}</div>
      </div>
    </section>
  );
}
