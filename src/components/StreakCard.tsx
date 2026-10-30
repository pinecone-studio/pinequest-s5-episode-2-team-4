import type { streakSummary } from "@/lib/streak";
import { StreakMonthCalendar } from "./StreakMonthCalendar";
import "./streak.css";

type StreakSummary = ReturnType<typeof streakSummary>;
const WEEKDAYS = ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"];
const MILESTONES = [3, 7, 10, 14, 30, 50, 100, 365];

export function StreakCard({ streak }: { streak: StreakSummary }) {
  const first = new Date(`${streak.days[0].date}T00:00:00Z`);
  const last = new Date(`${streak.days[6].date}T00:00:00Z`);
  const range = first.getUTCMonth() === last.getUTCMonth()
    ? `${last.getUTCMonth() + 1} сарын ${first.getUTCDate()}–${last.getUTCDate()}`
    : `${first.getUTCMonth() + 1}/${first.getUTCDate()} – ${last.getUTCMonth() + 1}/${last.getUTCDate()}`;
  const nextMilestone = MILESTONES.find((milestone) => milestone > streak.current) ?? Math.ceil((streak.current + 1) / 100) * 100;

  return (
    <section aria-labelledby="streak-title" className="streak-widget my-6 md:my-10">
      <div className="streak-panel">
        <div className="streak-range">
          <span className="streak-eyebrow">МИНИЙ STREAK</span>
          <p>{range}</p>
          <span className={`streak-live-dot ${streak.activeToday ? "is-active" : ""}`} aria-label={streak.activeToday ? "Өнөөдрийн идэвх бүртгэгдсэн" : "Өнөөдрийн идэвх хүлээгдэж байна"} />
        </div>
        <ol aria-label="Сүүлийн 7 өдрийн идэвх" className="streak-calendar">
          {streak.days.map(({ date, active }, index) => {
            const day = new Date(`${date}T00:00:00Z`);
            const today = index === 6;
            return (
              <li key={date} aria-current={today ? "date" : undefined} aria-label={`${date}: ${active ? "Идэвх бүртгэгдсэн" : "Идэвх бүртгэгдээгүй"}${today ? ", өнөөдөр" : ""}`} className={`streak-calendar-day ${active ? "is-active" : ""} ${today ? "is-today" : ""}`}>
                <span className="streak-date-frame">
                  {active && <span className="streak-fire" aria-hidden="true" />}
                  <span className="streak-date-number" aria-hidden="true">{day.getUTCDate()}</span>
                  {!active && !today && <span className="streak-missed" aria-hidden="true">×</span>}
                  {active && <span className="streak-flame-badge" aria-hidden="true">
                    <svg viewBox="0 0 24 30" fill="none">
                      <path d="M13 1c2 7-5 9-4 15 2-1 3-3 3-5 6 4 10 8 10 12C22 33 2 33 2 22 2 14 10 9 13 1Z" fill="#f88a32" />
                      <path d="M13 16c0 4-5 6-4 9 1 4 7 4 8 0 1-3-2-5-4-9Z" fill="#ffdc85" />
                    </svg>
                  </span>}
                </span>
                <span className="streak-calendar-label">{WEEKDAYS[day.getUTCDay()]}</span>
                <span className="streak-today-label">{today ? "Өнөөдөр" : "\u00a0"}</span>
              </li>
            );
          })}
        </ol>
        <h2 id="streak-title" className="streak-total"><span>{streak.current}</span> өдрийн streak</h2>
        <p className="streak-description">{streak.activeToday ? "Өнөөдрийн идэвх бүртгэгдлээ! Маргааш дахин орж streak-ээ үргэлжлүүлээрэй." : "Сайтад орж ашиглахад өдрийн идэвх автоматаар бүртгэгдэнэ."}</p>
        <p className="streak-timezone">Өдөрт нэг удаа · Улаанбаатарын цагаар</p>
        <StreakMonthCalendar {...streak.calendar} />
      </div>
      <div className="streak-stat-grid">
        <div className="streak-stat">
          <span className="streak-stat-label">Хамгийн урт streak</span>
          <strong>{streak.longest} <span>өдөр</span></strong>
        </div>
        <div className="streak-stat">
          <span className="streak-stat-label">Дараагийн зорилго</span>
          <strong>{nextMilestone} <span>өдөр</span></strong>
          <span className="streak-stat-remaining">{nextMilestone - streak.current} өдөр үлдлээ</span>
        </div>
      </div>
    </section>
  );
}
