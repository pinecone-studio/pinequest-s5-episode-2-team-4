import Link from "next/link";
import { cn } from "@/lib/cn";
import type { HeatmapStatus, SubtopicCounts } from "@/lib/types";

const STATUS: Record<
  HeatmapStatus,
  { label: string; tip: string; className: string; icon?: React.ReactNode }
> = {
  weak: {
    label: "Сул",
    tip: "Сул",
    className: "bg-magenta",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.4" strokeLinecap="round">
        <path d="M12 6v7M12 18h.01" />
      </svg>
    ),
  },
  learning: {
    label: "Нөхөж буй",
    tip: "Нөхөж буй",
    className: "bg-line",
    icon: (
      <svg viewBox="0 0 24 24" className="fill-ink">
        <path d="M12 3a9 9 0 0 0 0 18z" />
        <circle cx="12" cy="12" r="8" fill="none" className="stroke-ink" strokeWidth="2.4" />
      </svg>
    ),
  },
  good: {
    label: "Сайн",
    tip: "Сайн / эзэмшсэн",
    className: "bg-sky",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="stroke-ink" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    ),
  },
  untested: {
    label: "Өгөөгүй",
    tip: "Тест өгөөгүй",
    className: "border-2 border-dashed border-line bg-white",
  },
};

const LEGEND_ORDER: HeatmapStatus[] = ["weak", "learning", "good", "untested"];

type ClassTopicChartProps = {
  rows: (SubtopicCounts & { title: string; lessonTitle: string; href: string; selected: boolean })[];
  studentCount: number;
};

/**
 * How the whole class does per subtopic, weakest first: one stacked bar of
 * student counts per subtopic. No student is shown on their own.
 */
export function ClassTopicChart({ rows, studentCount }: ClassTopicChartProps) {
  const summary = `Ангийн дүн: ${rows
    .map((r) => `${r.lessonTitle}: ${r.weak} сул, ${r.learning} нөхөж буй, ${r.good} сайн, ${r.untested} өгөөгүй`)
    .join(". ")}.`;

  return (
    <section
      aria-labelledby="chart-title"
      className="grid gap-3 rounded-[25px] bg-white p-5 shadow-card md:mt-5 md:grid-cols-[1fr_auto] md:items-center md:gap-x-4 md:gap-y-6 md:rounded-panel md:p-7"
    >
      <div>
        <h2
          id="chart-title"
          className="text-[22px] leading-[1.15] font-bold md:text-[28px] md:leading-[1.1]"
        >
          Ангийн хоцрогдол сэдвээр
        </h2>
        <p className="mt-1 text-sm font-semibold text-ink-muted">
          Сурагчдын нэр харагдахгүй, зөвхөн тоо. Сэдвээ сонгоод даалгавар өг.
        </p>
      </div>

      <ul
        aria-label="Тайлбар"
        className="order-last flex flex-wrap gap-x-3.5 gap-y-2 text-xs font-semibold md:order-none md:gap-4 md:text-[13px]"
      >
        {LEGEND_ORDER.map((status) => (
          <li key={status} className="inline-flex items-center gap-1.5 md:gap-2">
            <span
              aria-hidden="true"
              className={cn(
                "flex size-4.5 items-center justify-center rounded-[5px] [&>svg]:size-2.5 md:size-5.5 md:rounded-md md:[&>svg]:size-3",
                STATUS[status].className,
              )}
            >
              {STATUS[status].icon}
            </span>
            {STATUS[status].label}
          </li>
        ))}
      </ul>

      <p className="sr-only">{summary}</p>
      <ol className="flex flex-col gap-2 md:col-span-2 md:gap-2.5">
        {rows.map((row, ri) => (
          <li key={row.subtopicId}>
            <Link
              href={row.href}
              scroll={false}
              aria-current={row.selected ? "true" : undefined}
              className={cn(
                "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 rounded-card border-2 px-3 py-2.5 text-ink no-underline transition-colors hover:border-primary hover:text-ink md:grid-cols-[200px_minmax(0,1fr)_auto] md:px-4",
                row.selected ? "border-primary bg-surface" : "border-transparent",
              )}
            >
              <span className="text-sm leading-tight font-bold md:text-[15px]">{row.title}</span>
              <span className="shrink-0 rounded-full bg-pink px-2.5 py-0.5 text-xs font-bold md:order-last">
                {row.weak + row.learning} хоцорсон
              </span>
              <span
                aria-hidden="true"
                className="col-span-2 flex h-7 overflow-hidden rounded-[8px] md:col-span-1 md:h-8"
              >
                {LEGEND_ORDER.map((status) =>
                  row[status] > 0 ? (
                    <span
                      key={status}
                      title={`${STATUS[status].tip}: ${row[status]} сурагч`}
                      className={cn(
                        "heatmap-cell flex items-center justify-center text-xs font-bold first:rounded-l-[8px] last:rounded-r-[8px]",
                        STATUS[status].className,
                        status === "weak" && "text-white",
                      )}
                      style={{
                        width: `${(row[status] / studentCount) * 100}%`,
                        animationDelay: `${ri * 0.04}s`,
                      }}
                    >
                      {row[status]}
                    </span>
                  ) : null,
                )}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
