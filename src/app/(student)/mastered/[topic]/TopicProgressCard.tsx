import type { Subtopic, SubtopicStatus } from "./data";
import { CheckIcon, StarIcon } from "./icons";

// TODO(#7): use the shared StatusBadge once it lands.
const STATUS: Record<
  SubtopicStatus,
  { label: string; className: string; check?: boolean }
> = {
  new: { label: "Шинэ", className: "bg-sky", check: true },
  mastered: { label: "Эзэмшсэн", className: "bg-sky", check: true },
  good: { label: "Сайн", className: "bg-lavender" },
  weak: { label: "Сул", className: "border-2 border-magenta bg-pink" },
};

type TopicProgressCardProps = {
  title: string;
  subtopics: Subtopic[];
};

/** Subtopics of the topic with their status; the new one is highlighted. */
export function TopicProgressCard({ title, subtopics }: TopicProgressCardProps) {
  const masteredCount = subtopics.filter(
    (s) => s.status === "mastered" || s.status === "new",
  ).length;

  return (
    <div className="rounded-[25px] bg-white p-5 shadow-card md:rounded-panel md:p-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[22px] leading-[1.15] font-bold md:text-2xl">
          {title}
        </h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-[13px] font-bold md:text-sm">
          <StarIcon className="size-[13px] md:size-3.5" />
          {masteredCount} / {subtopics.length}
          <span className="sr-only"> эзэмшсэн</span>
        </span>
      </div>
      <ul className="mt-3.5 flex flex-col gap-2 md:mt-4">
        {subtopics.map((subtopic) => {
          const status = STATUS[subtopic.status];
          return (
            <li
              key={subtopic.slug}
              className={`flex items-center justify-between gap-2 rounded-card border-2 px-3.5 py-3 md:gap-3 ${
                subtopic.status === "new"
                  ? "border-primary bg-surface"
                  : "border-surface"
              }`}
            >
              <span className="text-[15px] font-bold">{subtopic.title}</span>
              <span
                className={`inline-flex shrink-0 items-center gap-[5px] rounded-full px-2.5 py-[3px] text-xs font-bold ${status.className}`}
              >
                {status.check && <CheckIcon className="size-3" />}
                {status.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
