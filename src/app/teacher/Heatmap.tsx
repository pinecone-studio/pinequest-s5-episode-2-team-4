import { cn } from "@/lib/cn";
import type { HeatmapRow, HeatmapStatus } from "@/lib/types";

// Students who haven't taken the test are left out of every row: a per-row
// "not taken" count lets the teacher guess who it is (e.g. the one absent
// student), and students shouldn't feel watched. Only the class total shows.
type TestedStatus = Exclude<HeatmapStatus, "untested">;

const STATUS: Record<TestedStatus, { label: string; className: string }> = {
  weak: { label: "сул", className: "bg-status-weak text-status-weak-ink" },
  learning: { label: "нөхөж буй", className: "bg-status-mid text-status-mid-ink" },
  good: { label: "сайн", className: "bg-status-good text-status-good-ink" },
};

const ORDER: TestedStatus[] = ["weak", "learning", "good"];

const pad = (n: number) => String(n).padStart(2, "0");

type HeatmapProps = {
  rows: (HeatmapRow & { title: string; lessonTitle: string })[];
  testedCount: number;
  /** Student number shown outlined in the lists (the demo student). */
  highlight: number;
};

/**
 * The class's test results, one row per subtopic, weakest first. A row opens
 * to show which students are weak or still learning it.
 */
export function Heatmap({ rows, testedCount, highlight }: HeatmapProps) {
  const subtopics = rows
    .map((row) => {
      const students = (status: TestedStatus) =>
        row.cells.flatMap((s, i) => (s === status ? [i + 1] : []));
      return {
        ...row,
        counts: Object.fromEntries(ORDER.map((s) => [s, students(s).length])) as Record<TestedStatus, number>,
        weak: students("weak"),
        learning: students("learning"),
      };
    })
    .sort((a, b) => b.counts.weak - a.counts.weak);

  return (
    <section
      aria-labelledby="heatmap-title"
      className="rounded-[25px] bg-white p-5 shadow-card md:mt-5 md:rounded-panel md:p-7"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="heatmap-title" className="type-section-title">
          Тестийн дүн · дэд сэдвээр
        </h2>
        <p className="text-sm font-semibold text-ink-muted">
          {testedCount} сурагчийн дүнгээр · хамгийн сул нь эхэнд
        </p>
      </div>

      <ul aria-label="Тайлбар" className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold text-ink-muted">
        {ORDER.map((s) => (
          <li key={s} className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className={cn("size-2.5 rounded-full", STATUS[s].className)} />
            {STATUS[s].label}
          </li>
        ))}
      </ul>

      <ul className="mt-4 divide-y divide-line border-y border-line">
        {subtopics.map((row, i) => (
          <li key={row.subtopicId}>
            <details open={i === 0} className="group">
              <summary className="grid cursor-pointer list-none grid-cols-[1fr_auto_auto] items-center gap-x-4 gap-y-2 py-3.5 md:grid-cols-[minmax(10rem,14rem)_1fr_6rem_auto] [&::-webkit-details-marker]:hidden">
                <span className="font-bold">{row.title}</span>
                <span
                  role="img"
                  aria-label={ORDER.map((s) => `${row.counts[s]} ${STATUS[s].label}`).join(", ")}
                  className="col-span-3 row-start-2 flex h-2.5 gap-0.5 overflow-hidden rounded-full md:col-span-1 md:row-start-auto"
                >
                  {ORDER.map((s) =>
                    row.counts[s] > 0 ? (
                      <span
                        key={s}
                        style={{ flexGrow: row.counts[s] }}
                        className={cn("basis-0", STATUS[s].className)}
                      />
                    ) : null,
                  )}
                </span>
                <span
                  className={cn(
                    "justify-self-end text-sm font-bold tabular-nums",
                    row.counts.weak > 0 ? "text-status-weak-ink" : "text-status-good-ink",
                  )}
                >
                  {row.counts.weak > 0 ? `${row.counts.weak} сул` : "сул алга"}
                </span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="size-4 text-ink-muted transition-transform group-open:rotate-90"
                >
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </summary>

              <div className="flex flex-col gap-3 pb-4">
                <StudentList label="Тусламж хэрэгтэй" students={row.weak} highlight={highlight} status="weak" />
                <StudentList label="Нөхөж буй" students={row.learning} highlight={highlight} status="learning" />
                <p className="text-xs font-semibold text-ink-muted">{row.counts.good} сурагч сайн</p>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}

type StudentListProps = {
  label: string;
  students: number[];
  highlight: number;
  status: TestedStatus;
};

/** Student numbers as chips, e.g. №02 №07; the highlighted student is outlined. */
function StudentList({ label, students, highlight, status }: StudentListProps) {
  if (students.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5 md:flex-row md:items-baseline md:gap-3">
      <p className="shrink-0 text-xs font-bold whitespace-nowrap text-ink-muted md:w-40">
        {label} · {students.length}
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {students.map((n) => (
          <li
            key={n}
            className={cn(
              "rounded-full px-2.5 py-0.5 text-sm font-bold tabular-nums",
              STATUS[status].className,
              n === highlight && "ring-2 ring-primary",
            )}
          >
            №{pad(n)}
          </li>
        ))}
      </ul>
    </div>
  );
}
