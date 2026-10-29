import { cn } from "@/lib/cn";
import { hardestSubtopic, summarizeResults, TESTED_STATUSES, type TestedStatus } from "@/lib/class-results";
import type { HeatmapRow } from "@/lib/types";
import { FocusSubtopic } from "./FocusSubtopic";
import { NextStepNote } from "./NextStepNote";

// Students who haven't taken the test are left out of every row: a per-row
// "not taken" count lets the teacher guess who it is (e.g. the one absent
// student), and students shouldn't feel watched. Only the class total shows.
// Student numbers aren't shown either: the teacher can't tell who №07 is, so
// each row gives how many students are weak, still learning and good.

const STATUS: Record<TestedStatus, { label: string; className: string }> = {
  weak: { label: "сул", className: "bg-status-weak text-status-weak-ink" },
  learning: { label: "нөхөж буй", className: "bg-status-mid text-status-mid-ink" },
  good: { label: "сайн", className: "bg-status-good text-status-good-ink" },
};

type HeatmapProps = {
  rows: (HeatmapRow & { title: string; lessonTitle: string })[];
  testedCount: number;
};

/**
 * The class's test results, one row per subtopic, weakest first, under the
 * subtopic to look at first. A row opens to show how many students are weak,
 * still learning and good, and what share.
 */
export function Heatmap({ rows, testedCount }: HeatmapProps) {
  const titles = new Map(rows.map((r) => [r.subtopicId, r.title]));
  const results = summarizeResults(rows);
  const focus = hardestSubtopic(results);

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
        {TESTED_STATUSES.map((s) => (
          <li key={s} className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className={cn("size-2.5 rounded-full", STATUS[s].className)} />
            {STATUS[s].label}
          </li>
        ))}
      </ul>

      {testedCount === 0 ? (
        <p className="mt-4 rounded-card bg-surface px-4 py-5 text-ink-muted">
          Ангийн сурагчид оношлох тест өгөөгүй байна. Тест өгмөгц дүн нь энд гарна.
        </p>
      ) : (
        <>
          {focus ? (
            <FocusSubtopic result={focus} title={titles.get(focus.subtopicId) ?? focus.subtopicId} />
          ) : null}
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {results.map((row, i) => (
              <li key={row.subtopicId}>
                {/* The focus card already covers the first row. */}
                <details open={!focus && i === 0} className="group">
                  <summary className="grid cursor-pointer list-none grid-cols-[1fr_auto_auto] items-center gap-x-4 gap-y-2 py-3.5 md:grid-cols-[minmax(10rem,14rem)_1fr_7rem_auto] [&::-webkit-details-marker]:hidden">
                    <span className="font-bold">{titles.get(row.subtopicId) ?? row.subtopicId}</span>
                    <span
                      role="img"
                      aria-label={TESTED_STATUSES.map((s) => `${row.counts[s]} ${STATUS[s].label} (${row.shares[s]}%)`).join(", ")}
                      className="col-span-3 row-start-2 flex h-2.5 gap-0.5 overflow-hidden rounded-full md:col-span-1 md:row-start-auto"
                    >
                      {TESTED_STATUSES.map((s) =>
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
                      {row.counts.weak > 0 ? `${row.counts.weak} сул · ${row.shares.weak}%` : "сул алга"}
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

                  <dl className="grid grid-cols-3 gap-2">
                    {TESTED_STATUSES.map((s) => (
                      <div key={s} className={cn("flex flex-col rounded-tile px-3 py-2.5", STATUS[s].className)}>
                        <dt className="order-last text-xs font-semibold">{STATUS[s].label}</dt>
                        <dd className="text-2xl leading-none font-bold tabular-nums">
                          {row.counts[s]}
                          <span className="ml-1 text-sm font-semibold">{row.shares[s]}%</span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <NextStepNote step={row.step} className="mt-3 pb-4" />
                </details>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
