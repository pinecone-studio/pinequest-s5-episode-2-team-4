import { cn } from "@/lib/cn";
import type { TeacherNotification } from "@/lib/types";

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  className: "size-4 md:size-[18px]",
} as const;

const KINDS: Record<
  TeacherNotification["kind"],
  { row: string; badge: string; icon: React.ReactNode }
> = {
  failed: {
    row: "bg-pink",
    badge: "bg-magenta text-white",
    icon: (
      <svg {...iconProps} strokeWidth="2.4">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
    ),
  },
  "common-mistake": {
    row: "bg-surface",
    badge: "bg-primary text-white",
    icon: (
      <svg {...iconProps} strokeWidth="2.2">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  mastered: {
    row: "border-2 border-surface",
    badge: "bg-sky text-ink",
    icon: (
      <svg {...iconProps} strokeWidth="2.8">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    ),
  },
};

type NotificationListProps = {
  notifications: TeacherNotification[];
  /** Subtopic id → title */
  subtopicTitles: Map<string, string>;
  /** Notifications that need the teacher, shown in the badge. */
  alertCount: number;
  className?: string;
};

export function NotificationList({
  notifications,
  subtopicTitles,
  alertCount,
  className,
}: NotificationListProps) {
  return (
    <section
      aria-labelledby="alerts-title"
      className={cn(
        "min-w-0 rounded-[25px] bg-white p-5 shadow-card md:rounded-panel md:p-7",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="alerts-title"
          className="type-section-title"
        >
          Мэдэгдэл
        </h2>
        <span className="rounded-full border-2 border-magenta bg-pink px-2.5 py-0.5 text-xs font-bold md:px-3 md:text-sm">
          {alertCount}
          <span className="sr-only"> анхаарах шаардлагатай мэдэгдэл</span>
        </span>
      </div>
      <ul className="mt-3.5 flex flex-col gap-2 md:mt-4">
        {notifications.map((n) => {
          const kind = KINDS[n.kind];
          const context =
            n.kind === "common-mistake"
              ? "Давтагдсан алдаа"
              : subtopicTitles.get(n.subtopicId);
          return (
            <li
              key={n.id}
              className={cn(
                "flex min-h-16 items-center gap-2.5 rounded-card p-2.5 md:gap-3 md:px-3",
                kind.row,
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full md:size-10",
                  kind.badge,
                )}
              >
                {kind.icon}
              </span>
              <span className="flex min-w-0 flex-col">
                <b className="text-base">{n.title}</b>
                <span className="text-sm text-ink-muted">
                  {context} · {n.time}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
