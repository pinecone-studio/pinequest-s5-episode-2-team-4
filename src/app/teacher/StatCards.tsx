import { cn } from "@/lib/cn";

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  className: "size-6",
} as const;

type StatCardsProps = {
  testedCount: number;
  studentCount: number;
  weakestCount: number;
  weakestTitle: string;
  notificationCount: number;
};

/** Class overview: tested students, the weakest subtopic and new notifications. */
export function StatCards({
  testedCount,
  studentCount,
  weakestCount,
  weakestTitle,
  notificationCount,
}: StatCardsProps) {
  const stats = [
    {
      value: testedCount,
      total: studentCount,
      label: "Тест өгсөн сурагч",
      tile: "bg-lavender",
      icon: (
        <svg {...iconProps}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      value: weakestCount,
      label: "Давтлага хэрэгтэй",
      detail: weakestTitle,
      tile: "border-2 border-magenta bg-pink",
      alert: true,
      icon: (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      ),
    },
    {
      value: notificationCount,
      label: "Анхаарах мэдэгдэл",
      tile: "bg-sky",
      icon: (
        <svg {...iconProps}>
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      ),
    },
  ];

  return (
    <section
      aria-label="Ангийн суралцах явцын тойм"
      className="grid grid-cols-3 gap-2 md:grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] md:gap-5"
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={cn(
            "flex flex-col gap-1 rounded-card md:flex-row md:items-center md:gap-[18px] md:rounded-panel md:border-0 md:bg-white md:px-7 md:py-6 md:shadow-card",
            // On mobile the weak card is tinted instead of showing an icon
            stat.alert
              ? "border-2 border-magenta bg-pink px-2.5 py-3"
              : "bg-white px-3 py-3.5 shadow-card",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "hidden size-[52px] shrink-0 items-center justify-center rounded-card md:flex",
              stat.tile,
            )}
          >
            {stat.icon}
          </span>
          <div>
            <p className="text-3xl leading-none font-bold md:text-4xl">
              {stat.value}
              {stat.total !== undefined && (
                <span className="text-base text-ink-muted md:text-xl">
                  /{stat.total}
                </span>
              )}
            </p>
            <p className="mt-1 text-xs font-semibold md:mt-1.5 md:text-base">
              {stat.label}
              {stat.detail && (
                <span className="hidden md:inline"> · {stat.detail}</span>
              )}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}
