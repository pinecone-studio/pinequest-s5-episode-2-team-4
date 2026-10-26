import { cn } from "@/lib/cn";
import type { SignalLevel, SignalSummary } from "@/lib/types";

// Same colors as the heatmap: good → sky, learning → line, weak → magenta.
const LEVELS: { level: SignalLevel; label: string; className: string }[] = [
  { level: "got", label: "Ойлгосон", className: "bg-sky" },
  { level: "unsure", label: "Сайн мэдэхгүй", className: "bg-line" },
  { level: "lost", label: "Ойлгосонгүй", className: "bg-magenta" },
];

/** Share of 🔴 at which a subtopic is flagged to explain again. */
const REEXPLAIN_SHARE = 0.25;

type SignalPanelProps = {
  rows: (SignalSummary & { title: string })[];
  className?: string;
};

/** 🟢🟡🔴 split per subtopic, from the anonymous signals sent in lessons. */
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
        <h2
          id="signals-title"
          className="text-[22px] leading-[1.15] font-bold md:text-[28px] md:leading-[1.1]"
        >
          Ойлголтын дохио
        </h2>
        <p className="text-[13px] font-semibold text-ink-muted md:text-sm">
          Нэргүй · хичээлийн үеэр сурагчдын илгээсэн
        </p>
      </div>

      <ul className="mt-4 flex flex-col gap-3.5 md:gap-4">
        {rows.map((row) => {
          const total = row.counts.got + row.counts.unsure + row.counts.lost;
          const reexplain =
            total > 0 && row.counts.lost / total >= REEXPLAIN_SHARE;
          return (
            <li key={row.subtopicId}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <b className="text-[15px] md:text-base">{row.title}</b>
                {reexplain ? (
                  <span className="rounded-full border-2 border-magenta bg-pink px-2.5 py-0.5 text-xs font-bold">
                    Дахин тайлбарлах
                  </span>
                ) : null}
              </div>
              <div
                role="img"
                aria-label={LEVELS.map(
                  (l) => `${l.label} ${row.counts[l.level]}`,
                ).join(", ")}
                className="mt-1.5 flex h-7 gap-[3px] overflow-hidden rounded-field md:h-8"
              >
                {total === 0 ? (
                  <span className="flex-1 border-2 border-dashed border-line" />
                ) : (
                  LEVELS.map((l) =>
                    row.counts[l.level] > 0 ? (
                      <span
                        key={l.level}
                        style={{ flexGrow: row.counts[l.level] }}
                        className={cn(
                          "flex min-w-7 basis-0 items-center justify-center text-xs font-bold",
                          l.className,
                          l.level === "lost" ? "text-white" : "text-ink",
                        )}
                      >
                        {row.counts[l.level]}
                      </span>
                    ) : null,
                  )
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] font-semibold text-ink-muted">
        {LEVELS.map((l) => (
          <li key={l.level} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={cn("size-3 rounded-full", l.className)}
            />
            {l.label}
          </li>
        ))}
      </ul>
    </section>
  );
}
