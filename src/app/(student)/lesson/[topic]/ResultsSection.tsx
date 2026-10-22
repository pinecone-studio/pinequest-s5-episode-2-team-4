import { StatusBadge } from "@/components/ui";
import type { LessonResult } from "./results";

type ResultsSectionProps = {
  result: LessonResult;
};

/** Diagnostic test score and the weak/strong subtopic list. */
export function ResultsSection({ result }: ResultsSectionProps) {
  return (
    <section
      aria-labelledby="results-title"
      className="rounded-[25px] bg-white p-5 shadow-card md:flex md:flex-wrap md:items-center md:gap-x-14 md:gap-y-8 md:rounded-panel md:px-9 md:py-7"
    >
      <div className="flex items-center gap-3 md:shrink-0 md:gap-5">
        {/* TODO(#9): use the current pet's PetSprite. */}
        <span
          aria-hidden="true"
          className="size-16 shrink-0 animate-bob rounded-full bg-lavender md:size-32"
        />
        <div className="contents md:block">
          <h1
            id="results-title"
            className="text-xl leading-tight font-bold md:text-2xl"
          >
            Үр дүн
          </h1>
          <p
            aria-label={`${result.total}-аас ${result.correct} зөв`}
            className="ml-auto text-[44px] leading-none font-bold md:mt-1 md:ml-0 md:text-[64px] md:tracking-[-0.03em]"
          >
            {result.correct}
            <span className="text-[22px] text-ink-muted md:text-[32px]">
              /{result.total}
            </span>
          </p>
        </div>
      </div>

      <ul className="mt-4 flex min-w-0 flex-col gap-3 md:mt-0 md:flex-[1_1_520px] md:gap-3.5">
        {result.subtopics.map((s) => {
          const percent = s.total ? (s.correct / s.total) * 100 : 0;
          return (
            <li
              key={s.subtopicId}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1.5 md:grid-cols-[minmax(0,200px)_minmax(100px,1fr)_88px] md:gap-4"
            >
              <span className="text-[15px] font-bold md:text-base">
                {s.title}
                <span className="sr-only">
                  , {s.total}-аас {s.correct} зөв
                </span>
              </span>
              <StatusBadge
                status={s.status}
                size="sm"
                className="justify-self-end md:col-start-3 md:row-start-1 md:px-3 md:text-[13px]"
              />
              <span
                aria-hidden="true"
                className="col-span-2 h-2.5 overflow-hidden rounded-full bg-surface md:col-span-1 md:col-start-2 md:row-start-1 md:h-3.5"
              >
                <span
                  className={`block h-full rounded-full ${
                    s.status === "weak" ? "bg-magenta" : "bg-primary"
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
