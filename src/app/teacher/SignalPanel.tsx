import { PixelIcon, type PixelIconName } from "@/components/ui";
import { cn } from "@/lib/cn";
import { WEEKDAYS, isoWeekday } from "@/lib/lesson-topics";
import type { SignalLevel, SignalSummary, SignalWeek, WeekSignals } from "@/lib/types";
import { WeekPicker } from "./WeekPicker";

// The 🟢🟡🔴 the students sent, in the same status colours as the heatmap.
const LEVELS: { level: SignalLevel; icon: PixelIconName; label: string; className: string }[] = [
  { level: "got", icon: "signal-got", label: "Ойлгосон", className: "bg-status-good text-status-good-ink" },
  { level: "unsure", icon: "signal-unsure", label: "Сайн мэдэхгүй", className: "bg-status-mid text-status-mid-ink" },
  { level: "lost", icon: "signal-lost", label: "Ойлгоогүй", className: "bg-status-weak text-status-weak-ink" },
];

/** Share of 🔴 at which a subtopic is flagged to explain again. */
const REEXPLAIN_SHARE = 0.25;
/** Share of 🟡 and 🔴 together at which some students are still unsure. */
const UNSURE_SHARE = 0.4;

/** One-line verdict for a lesson, so the teacher knows what to do at a glance. */
function verdict({ got, unsure, lost }: SignalSummary["counts"]) {
  const total = got + unsure + lost;
  if (lost / total >= REEXPLAIN_SHARE) {
    return { text: `${lost} сурагч ойлгоогүй · дахин тайлбарлах`, className: LEVELS[2].className };
  }
  if ((unsure + lost) / total >= UNSURE_SHARE) {
    return { text: `${unsure + lost} сурагч эргэлзэж байна · жишээ нэмэх`, className: LEVELS[1].className };
  }
  return { text: "Ихэнх нь ойлгосон · дараагийн сэдэв рүү", className: LEVELS[0].className };
}

type Row = SignalSummary & { title: string };

// Dates built by hand so server and browser match.
const month = (day: string) => Number(day.slice(5, 7));
const date = (day: string) => Number(day.slice(8, 10));

/** "10-р сарын 28 · Лхагва" */
const dayLabel = (day: string) =>
  `${month(day)}-р сарын ${date(day)} · ${WEEKDAYS.find((w) => w.day === isoWeekday(day))?.name ?? ""}`;

/** "10/19–25", or "10/27–11/2" across months; short, so it fits the picker on a phone */
const rangeLabel = ({ from, to }: SignalWeek) =>
  `${month(from)}/${date(from)}–${month(to) === month(from) ? "" : `${month(to)}/`}${date(to)}`;

const weekLabel = (week: SignalWeek, i: number) =>
  i === 0 ? `Энэ 7 хоног · ${rangeLabel(week)}` : i === 1 ? `Өмнөх 7 хоног · ${rangeLabel(week)}` : rangeLabel(week);

type SignalPanelProps = {
  /** Today's lessons, in the order they were taught */
  today: Row[];
  /** The picked week's lesson days before today, newest first */
  signals: WeekSignals;
  className?: string;
};

/**
 * The 🟢🟡🔴 students sent per lesson topic: in the app's lessons, and on
 * lesson days the teacher taught without the app. One week at a time (this
 * one first, earlier ones from the picker), today on top; each topic folds
 * to its name, today's start open.
 */
export function SignalPanel({ today, signals, className }: SignalPanelProps) {
  const { week, weeks, days } = signals;
  const selected = weeks.findIndex((w) => w.from === week.from);
  const current = selected === 0;
  const empty = (!current || today.length === 0) && days.length === 0;
  return (
    <section
      aria-labelledby="signals-title"
      className={cn(
        "min-w-0 rounded-[25px] bg-white p-5 shadow-card md:rounded-panel md:p-7",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div>
          <h2 id="signals-title" className="type-section-title">
            Хичээлийн дохио
          </h2>
          <p className="text-sm font-semibold text-ink-muted">Нэргүй · сурагчдын илгээсэн</p>
        </div>
        <WeekPicker labels={weeks.map(weekLabel)} selected={selected} />
      </div>

      {empty ? (
        <p className="mt-4 rounded-card border-2 border-dashed border-line px-5 py-6 text-center text-sm font-semibold text-ink-muted">
          {current ? "Энэ" : "Тэр"} 7 хоногт дохио ирээгүй байна. Сурагчид хичээлийн «Ойлгосон уу?» хэсгээс, эсвэл хуваарьт хичээлийн өдөр нүүр хуудаснаасаа илгээнэ.
        </p>
      ) : (
        <ol className="mt-4 flex flex-col gap-5">
          {current && (
            <li>
              <h3 className="text-sm font-bold text-ink-muted">Өнөөдөр</h3>
              {today.length === 0 ? (
                <p className="mt-2 text-sm font-semibold text-ink-muted">Өнөөдөр дохио ирээгүй байна.</p>
              ) : (
                <TopicList rows={today} open />
              )}
            </li>
          )}
          {days.map((d) => (
            <li key={d.day}>
              <h3 className="text-sm font-bold text-ink-muted">{dayLabel(d.day)}</h3>
              <TopicList rows={d.rows} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function TopicList({ rows, open = false }: { rows: Row[]; open?: boolean }) {
  return (
    <ul className={cn("mt-2 grid gap-3 md:items-start", rows.length > 1 && "lg:grid-cols-2")}>
      {rows.map((row) => {
        const total = row.counts.got + row.counts.unsure + row.counts.lost;
        const summary = verdict(row.counts);
        return (
          <li key={row.subtopicId}>
            <details open={open} className="group rounded-card bg-surface">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 md:px-5 [&::-webkit-details-marker]:hidden">
                <span className="text-lg font-bold">{row.title}</span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="size-4 shrink-0 text-ink-muted transition-transform group-open:rotate-90"
                >
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </summary>

              <div className="flex flex-col gap-3 px-4 pb-4 md:px-5 md:pb-5">
                <p className="text-sm font-semibold text-ink-muted">
                  {row.time} · {total} сурагч хариулсан
                </p>

                <p className={cn("rounded-tile px-4 py-2.5 text-base font-bold", summary.className)}>
                  {summary.text}
                </p>

                <dl className="grid grid-cols-3 gap-2">
                  {LEVELS.map((l) => (
                    <div key={l.level} className={cn("flex flex-col rounded-tile px-3 py-2.5", l.className)}>
                      <dt className="order-last text-xs font-semibold">
                        <span className="hidden sm:inline"><PixelIcon name={l.icon} className="inline-block size-3.5 align-[-0.15em]" /> </span>
                        {l.label}
                      </dt>
                      <dd className="text-3xl leading-none font-bold tabular-nums">
                        {row.counts[l.level]}
                        <span className="ml-1 text-sm font-semibold">
                          {Math.round((row.counts[l.level] / total) * 100)}%
                        </span>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </details>
          </li>
        );
      })}
    </ul>
  );
}
