import { CoinIcon } from "@/components/layout/CoinChip";
import { ProgressBar } from "@/components/ui";
import { cn } from "@/lib/cn";
import { learningDay } from "@/lib/streak";
import type { AchievementProgress } from "@/lib/types";

/** «2026.10.29»: the Ulaanbaatar day it was unlocked. */
const unlockedDay = (iso: string) => learningDay(new Date(iso)).replaceAll("-", ".");

/**
 * «Амжилтууд»: every achievement as a badge. Unlocked ones are in colour with
 * the day they were unlocked; locked ones are outlines with their goal and
 * how far the student got.
 */
export function AchievementShelf({ achievements, className }: { achievements: AchievementProgress[]; className?: string }) {
  const unlocked = achievements.filter((a) => a.unlocked).length;
  return (
    <section aria-labelledby="achievements-title" className={cn("rounded-panel bg-white p-5 shadow-card md:p-7", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="achievements-title" className="type-section-title">
          Амжилтууд
        </h2>
        <span className="rounded-full bg-surface px-3.5 py-1.5 text-sm font-bold">
          {unlocked}/{achievements.length} нээсэн
        </span>
      </div>
      <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {achievements.map((a) => (
          <li
            key={a.id}
            className={cn(
              "flex flex-col items-center gap-2 rounded-card p-4 text-center",
              a.unlocked ? "bg-surface" : "border-2 border-dashed border-line",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "flex size-16 items-center justify-center rounded-full text-3xl",
                a.unlocked ? "bg-tint-sand ring-4 ring-[#f5c542]" : "bg-surface opacity-50 grayscale",
              )}
            >
              {a.emoji}
            </span>
            <h3 className="font-bold">{a.title}</h3>
            <p className="text-sm text-ink-muted">{a.description}</p>
            {a.unlocked && a.unlockedAt ? (
              <p className="mt-auto text-xs font-semibold text-ink-muted">
                <span className="sr-only">Нээсэн өдөр: </span>
                {unlockedDay(a.unlockedAt)}
              </p>
            ) : (
              <div className="mt-auto flex w-full flex-col gap-1">
                <ProgressBar value={(a.progress / a.goal) * 100} label={`${a.title}: ${a.progress}/${a.goal}`} size="sm" />
                <p className="text-xs font-bold tabular-nums">
                  {a.progress}/{a.goal}
                </p>
              </div>
            )}
            <p className={cn("inline-flex items-center gap-1 text-sm font-bold", !a.unlocked && "text-ink-muted")}>
              <CoinIcon className="size-4" />
              {a.unlocked ? `${a.coins} авсан` : `+${a.coins}`}
              <span className="sr-only">зоос</span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
