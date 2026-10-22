import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import type { HeatmapRow, HeatmapStatus } from "@/lib/types";

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

const pad = (n: number) => String(n).padStart(2, "0");

type HeatmapProps = {
  rows: (HeatmapRow & { title: string; lessonTitle: string })[];
  testedCount: number;
  /** Student number whose column is outlined. */
  highlight: number;
};

/** Subtopic × student grid of the class's test results. */
export function Heatmap({ rows, testedCount, highlight }: HeatmapProps) {
  const studentCount = rows[0]?.cells.length ?? 0;
  const students = Array.from({ length: studentCount }, (_, i) => i + 1);
  const weakCounts = rows.map(
    (row) => row.cells.filter((c) => c === "weak").length,
  );
  const summary = `Ангийн дүн: ${rows
    .map((row, i) => `${row.lessonTitle} ${weakCounts[i]} сурагч сул`)
    .join(", ")}. ${testedCount} сурагч тест өгсөн. Сурагч №${pad(highlight)} тэмдэглэгдсэн.`;

  return (
    <section
      aria-labelledby="heatmap-title"
      className="grid gap-3 rounded-[25px] bg-white p-5 shadow-card md:mt-5 md:grid-cols-[1fr_auto] md:items-center md:gap-x-4 md:gap-y-6 md:rounded-panel md:p-7"
    >
      <h2
        id="heatmap-title"
        className="text-[22px] leading-[1.15] font-bold md:text-[28px] md:leading-[1.1]"
      >
        Дэд сэдэв × сурагч
      </h2>

      <ul
        aria-label="Тайлбар"
        className="order-last flex flex-wrap gap-x-3.5 gap-y-2 text-xs font-semibold md:order-none md:gap-4 md:text-[13px]"
      >
        {LEGEND_ORDER.map((status) => (
          <li key={status} className="inline-flex items-center gap-1.5 md:gap-2">
            <span
              aria-hidden="true"
              className={cn(
                "flex size-[18px] items-center justify-center rounded-[5px] [&>svg]:size-2.5 md:size-[22px] md:rounded-md md:[&>svg]:size-3",
                STATUS[status].className,
              )}
            >
              {STATUS[status].icon}
            </span>
            {STATUS[status].label}
          </li>
        ))}
      </ul>

      <div
        tabIndex={0}
        role="region"
        aria-label="Ангийн дүн, хажуу тийш гүйлгэнэ"
        className="-mx-5 overflow-x-auto px-5 pt-2 pb-3 md:col-span-2 md:mx-0 md:px-0 md:pb-1"
      >
        <div
          role="img"
          aria-label={summary}
          className="flex w-[1150px] gap-2 md:w-auto md:min-w-[1040px] md:gap-4"
        >
          <div
            aria-hidden="true"
            className="sticky left-0 z-3 flex w-28 shrink-0 flex-col gap-1.5 bg-white shadow-[8px_0_12px_-8px_rgb(63_7_145/0.18)] md:static md:w-[210px] md:shadow-none"
          >
            <div className="flex h-6 items-center text-xs font-bold text-ink-muted md:h-[26px]">
              <span className="hidden md:inline">№</span>
            </div>
            {rows.map((row, i) => (
              <div
                key={row.subtopicId}
                className="flex h-10 items-center justify-between gap-1 pr-1.5 text-xs leading-[1.15] font-bold md:h-9 md:gap-2 md:pr-0 md:text-sm"
              >
                <span className="md:truncate">{row.title}</span>
                <span className="shrink-0 rounded-full bg-pink px-1.5 py-px text-[11px] md:px-2 md:text-xs">
                  {weakCounts[i]}
                </span>
              </div>
            ))}
          </div>

          <div
            aria-hidden="true"
            className="relative flex shrink-0 basis-[1020px] flex-col gap-1.5 md:min-w-0 md:flex-1 md:basis-auto"
          >
            <div
              className="heatmap-highlight pointer-events-none absolute -top-1.5 -bottom-1.5 z-2 rounded-xl border-3 border-primary"
              style={{ "--col": highlight - 1 } as CSSProperties}
            />
            <div className="grid h-6 grid-cols-[repeat(32,28px)] gap-1 md:h-[26px] md:grid-cols-[repeat(32,minmax(0,1fr))]">
              {students.map((n) => (
                <span
                  key={n}
                  className={cn(
                    "flex items-center justify-center text-[11px]",
                    n === highlight
                      ? "rounded-full bg-primary font-bold text-white"
                      : "font-semibold text-ink-muted",
                  )}
                >
                  {pad(n)}
                </span>
              ))}
            </div>
            {rows.map((row, ri) => (
              <div
                key={row.subtopicId}
                className="grid h-10 grid-cols-[repeat(32,28px)] gap-1 md:h-9 md:grid-cols-[repeat(32,minmax(0,1fr))]"
              >
                {row.cells.map((status, ci) => (
                  <span
                    key={ci}
                    title={`№${pad(ci + 1)} · ${STATUS[status].tip}`}
                    className={cn(
                      "heatmap-cell flex items-center justify-center rounded-[7px] [&>svg]:size-3",
                      STATUS[status].className,
                    )}
                    style={{ animationDelay: `${ri * 0.04}s` }}
                  >
                    {STATUS[status].icon}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
