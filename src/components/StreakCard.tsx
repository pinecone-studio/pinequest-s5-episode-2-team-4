import { ButtonLink } from "@/components/ui";
import type { streakSummary } from "@/lib/streak";

type StreakSummary = ReturnType<typeof streakSummary>;
const WEEKDAYS = ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"];

export function StreakCard({ streak }: { streak: StreakSummary }) {
  return (
    <section aria-labelledby="streak-title" className="my-6 rounded-panel border border-line bg-white p-5 shadow-card md:my-10 md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="flex size-14 items-center justify-center rounded-card bg-pink text-3xl">🔥</span>
          <div>
            <h2 id="streak-title" className="text-xl font-bold">{streak.current} өдрийн streak</h2>
            <p className="mt-1 text-sm text-ink-muted">Хамгийн урт: {streak.longest} өдөр</p>
          </div>
        </div>
        <span className={`rounded-full px-3 py-2 text-sm font-semibold ${streak.activeToday ? "bg-sky" : "bg-surface"}`}>
          {streak.activeToday ? "✓ Өнөөдрийн зорилго биеллээ" : "Өнөөдөр суралцаад галаа асаагаарай"}
        </span>
      </div>
      <ol aria-label="Сүүлийн 7 өдрийн суралцсан байдал" className="mt-5 grid grid-cols-7 gap-2">
        {streak.days.map(({ date, active }, index) => (
          <li key={date} aria-label={`${date}: ${active ? "Суралцсан" : "Суралцаагүй"}${index === 6 ? ", өнөөдөр" : ""}`} className="flex flex-col items-center gap-2">
            <span className="text-xs text-ink-muted">{index === 6 ? "Өнөөдөр" : WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()]}</span>
            <span aria-hidden="true" className={`flex size-9 items-center justify-center rounded-full text-sm font-bold md:size-11 ${active ? "bg-primary text-white" : "bg-surface text-ink-muted"} ${index === 6 ? "ring-2 ring-line ring-offset-2 ring-offset-surface-soft" : ""}`}>
              {active ? "✓" : new Date(`${date}T00:00:00Z`).getUTCDate()}
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <p className="max-w-xl text-xs leading-relaxed text-ink-muted">Өдөр бүр тест, дасгал эсвэл boss-ийн нэг асуултад хариулаарай. Өдөр алгасвал дараалал дахин эхэлнэ. Улаанбаатарын цагаар тооцно.</p>
        {!streak.activeToday && <ButtonLink href="/test" size="sm">{streak.current > 0 ? "Streak-ээ үргэлжлүүлэх" : "Streak эхлүүлэх"}</ButtonLink>}
      </div>
    </section>
  );
}
