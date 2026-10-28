"use client";

import { cn } from "@/lib/cn";
import { askedBy, QuestionGroupCard, type GroupView } from "./QuestionGroupCard";

type QuestionGroupsProps = {
  groups: GroupView[];
  className?: string;
};

/**
 * Anonymous questions grouped by AI: the teacher fixes the grouping and
 * answers each group once; the answer goes to the whole class.
 */
export function QuestionGroups({ groups, className }: QuestionGroupsProps) {
  // Unanswered groups first, then the ones most students asked.
  const sorted = [...groups].sort(
    (a, b) =>
      Number(a.status === "answered") - Number(b.status === "answered") ||
      askedBy(b.questions) - askedBy(a.questions),
  );

  return (
    <section
      aria-labelledby="questions-title"
      className={cn(
        "min-w-0 rounded-[25px] bg-white p-5 shadow-card md:rounded-panel md:p-7",
        className,
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2
          id="questions-title"
          className="text-[22px] leading-[1.15] font-bold md:text-[28px] md:leading-[1.1]"
        >
          Нэргүй асуултууд
        </h2>
        <p className="text-[13px] font-semibold text-ink-muted md:text-sm">
          AI ижил асуултуудыг бүлэглэсэн
        </p>
      </div>

      {sorted.length === 0 ? (
        <p className="mt-4 text-[15px] text-ink-muted">Одоогоор асуулт алга.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {sorted.map((g) => (
            <QuestionGroupCard
              key={g.id}
              group={g}
              mergeTargets={sorted.filter((t) => t.id !== g.id && t.subtopicId === g.subtopicId)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
