import type { Lesson } from "@/lib/types";

type LessonSectionProps = {
  lesson: Pick<Lesson, "title">;
  /** Explanation and practice */
  children: React.ReactNode;
  /** The AI helper chat; it floats in the corner, so it takes no room here. */
  helper: React.ReactNode;
  /** Below the practice: the retest */
  footer: React.ReactNode;
};

/** The lesson title, then everything full width like the results above. */
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
          className="text-[32px] leading-[1.05] font-bold tracking-[-0.02em] md:text-[40px]"
        >
          {lesson.title}
        </h2>
      </div>

      <div className="mt-4 flex flex-col gap-4 md:mt-7 md:gap-6">
        {children}
        {footer}
      </div>
      {helper}
    </section>
  );
}
