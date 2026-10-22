import { cn } from "@/lib/cn";

export type Status = "weak" | "learning" | "good" | "mastered" | "new";

const styles: Record<Status, { label: string; className: string }> = {
  weak: { label: "Сул", className: "border-2 border-magenta bg-pink" },
  learning: { label: "Нөхөж буй", className: "bg-line" },
  good: { label: "Сайн", className: "bg-sky" },
  mastered: { label: "Эзэмшсэн", className: "bg-lavender" },
  new: { label: "Шинэ", className: "bg-sky" },
};

type StatusBadgeProps = {
  status: Status;
  size?: "sm" | "md";
  className?: string;
};

/** Subtopic status pill: Сул / Нөхөж буй / Сайн / Эзэмшсэн / Шинэ. */
export function StatusBadge({ status, size = "md", className }: StatusBadgeProps) {
  const { label, className: color } = styles[status];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full py-0.75 font-bold text-ink",
        size === "sm" ? "px-2.5 text-xs" : "px-3 text-[13px]",
        color,
        className,
      )}
    >
      {status === "mastered" && (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5">
          <path
            d="M5 12.5l4.5 4.5L19 7.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {label}
    </span>
  );
}
