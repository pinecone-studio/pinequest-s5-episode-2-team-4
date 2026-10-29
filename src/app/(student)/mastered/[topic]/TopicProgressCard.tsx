import { StatusBadge } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { SubtopicStatus } from "@/lib/types";
import { StarIcon } from "./icons";

type TopicProgressCardProps = {
  title: string;
  items: { id: string; title: string; status: SubtopicStatus }[];
};

/** Subtopics of the topic with their status; the new one is highlighted. */
export function TopicProgressCard({ title, items }: TopicProgressCardProps) {
  const masteredCount = items.filter(
    (i) => i.status === "mastered" || i.status === "new",
  ).length;

  return (
    <div className="rounded-[25px] bg-white p-5 shadow-card md:rounded-panel md:p-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="type-section-title">
          {title}
        </h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-sm font-bold">
          <StarIcon className="size-[13px] md:size-3.5" />
          {masteredCount} / {items.length}
          <span className="sr-only"> эзэмшсэн</span>
        </span>
      </div>
      <ul className="mt-3.5 flex flex-col gap-2 md:mt-4">
        {items.map((item) => (
          <li
            key={item.id}
            className={cn(
              "flex items-center justify-between gap-2 rounded-card border-2 px-3.5 py-3 md:gap-3",
              item.status === "new"
                ? "border-primary bg-surface"
                : "border-surface",
            )}
          >
            <span className="text-base font-bold">{item.title}</span>
            <StatusBadge status={item.status} size="sm" />
          </li>
        ))}
      </ul>
    </div>
  );
}
