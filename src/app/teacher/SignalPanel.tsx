import { cn } from "@/lib/cn";
import type { SignalLevel, SignalSummary } from "@/lib/types";

// The 🟢🟡🔴 the students sent, in the same status colours as the heatmap.
const LEVELS: { level: SignalLevel; emoji: string; label: string; className: string }[] = [
  { level: "got", emoji: "🟢", label: "Ойлгосон", className: "bg-status-good text-status-good-ink" },
  { level: "unsure", emoji: "🟡", label: "Сайн мэдэхгүй", className: "bg-status-mid text-status-mid-ink" },
  { level: "lost", emoji: "🔴", label: "Ойлгоогүй", className: "bg-status-weak text-status-weak-ink" },
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

type SignalPanelProps = {
  /** Today's lessons only, in the order they were taught */
  rows: (SignalSummary & { title: string })[];
  className?: string;
};

/** Today's 🟢🟡🔴 per subtopic taught, from the anonymous signals sent in lessons. */
export function SignalPanel({ rows, className }: SignalPanelProps) {
  return (
    <section
      aria-labelledby="signals-title"
      className={cn(
        "min-w-0 rounded-[25px] bg-white p-5 shadow-card md:rounded-panel md:p-7",
        className,
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="signals-title" className="type-section-title">
          Өнөөдрийн хичээлийн дохио
        </h2>
        <p className="text-sm font-semibold text-ink-muted">
          Нэргүй · сурагчид хичээлийн үеэр илгээсэн
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="mt-4 rounded-card border-2 border-dashed border-line px-5 py-6 text-center text-sm font-semibold text-ink-muted">
          Өнөөдөр дохио ирээгүй байна. Сурагчид хичээлийн «Ойлгосон уу?» хэсгээс илгээнэ.
        </p>
      ) : (
        <ul className={cn("mt-4 grid gap-4", rows.length > 1 && "lg:grid-cols-2")}>
          {rows.map((row) => {
            const total = row.counts.got + row.counts.unsure + row.counts.lost;
            const summary = verdict(row.counts);
            return (
              <li key={row.subtopicId} className="flex flex-col gap-3 rounded-card bg-surface p-4 md:p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <h3 className="text-lg font-bold">{row.title}</h3>
                  <p className="text-sm font-semibold text-ink-muted">
                    {row.time} · {total} сурагч хариулсан
                  </p>
                </div>

                <p className={cn("rounded-tile px-4 py-2.5 text-base font-bold", summary.className)}>
                  {summary.text}
                </p>

                <dl className="grid grid-cols-3 gap-2">
                  {LEVELS.map((l) => (
                    <div key={l.level} className={cn("flex flex-col rounded-tile px-3 py-2.5", l.className)}>
                      <dt className="order-last text-xs font-semibold">
                        <span aria-hidden="true" className="hidden sm:inline">{l.emoji} </span>
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
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
