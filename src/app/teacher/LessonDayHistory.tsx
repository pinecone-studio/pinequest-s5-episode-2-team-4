import { cn } from "@/lib/cn";
import { WEEKDAYS, isoWeekday } from "@/lib/lesson-topics";
import type { LessonDaySignals, SignalLevel } from "@/lib/types";

const LEVELS: { level: SignalLevel; emoji: string; label: string; bar: string }[] = [
  { level: "got", emoji: "🟢", label: "Ойлгосон", bar: "bg-status-good-ink" },
  { level: "unsure", emoji: "🟡", label: "Сайн мэдэхгүй", bar: "bg-status-mid-ink" },
  { level: "lost", emoji: "🔴", label: "Ойлгосонгүй", bar: "bg-status-weak-ink" },
];

/** "10-р сарын 28 · Лхагва"; built by hand so server and browser match. */
const dayLabel = (day: string) =>
  `${Number(day.slice(5, 7))}-р сарын ${Number(day.slice(8, 10))} · ${WEEKDAYS.find((w) => w.day === isoWeekday(day))?.name ?? ""}`;

/**
 * The last lesson days' «Ойлгосон уу?» per topic, newest first, so a teacher
 * who didn't open the app that day still sees how the class understood it.
 */
export function LessonDayHistory({ days, className }: { days: LessonDaySignals[]; className?: string }) {
  return (
    <section aria-labelledby="lesson-history-title" className={cn("rounded-[25px] bg-card p-5 shadow-card md:rounded-panel md:p-7", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="lesson-history-title" className="type-section-title">
          Сүүлийн хичээлүүд
        </h2>
        <p className="text-sm font-semibold text-ink-muted">Нэргүй · сүүлийн 2 долоо хоног</p>
      </div>

      {days.length === 0 ? (
        <p className="mt-4 rounded-card border-2 border-dashed border-line px-5 py-6 text-center text-sm font-semibold text-ink-muted">
          Өмнөх хичээлүүдээс дохио ирээгүй байна. Хуваарьт хичээлийн өдрүүдээ оруулбал сурагчдаас тэр өдөр асууна.
        </p>
      ) : (
        <ol className="mt-4 flex flex-col gap-4">
          {days.map((d) => (
            <li key={d.day}>
              <h3 className="text-base font-bold">{dayLabel(d.day)}</h3>
              <ul className="mt-2 flex flex-col gap-2">
                {d.rows.map((row) => {
                  const total = row.counts.got + row.counts.unsure + row.counts.lost;
                  return (
                    <li key={row.subtopicId} className="grid gap-2 rounded-card bg-surface p-3 md:grid-cols-[minmax(0,1fr)_16rem] md:items-center md:gap-4">
                      <p className="font-semibold">
                        {row.title} <span className="text-sm text-ink-muted">· {total} сурагч</span>
                      </p>
                      <div>
                        <div aria-hidden="true" className="flex h-2.5 overflow-hidden rounded-full bg-line">
                          {LEVELS.map((l) => (
                            <span key={l.level} className={l.bar} style={{ width: `${total ? (row.counts[l.level] / total) * 100 : 0}%` }} />
                          ))}
                        </div>
                        <p className="mt-1 flex justify-between text-xs font-bold tabular-nums">
                          {LEVELS.map((l) => (
                            <span key={l.level} aria-label={`${l.label} ${row.counts[l.level]}`}>
                              {l.emoji} {row.counts[l.level]}
                            </span>
                          ))}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
