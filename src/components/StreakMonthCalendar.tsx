"use client";

import { useId, useState } from "react";
import { calendarCells, shiftCalendarMonth } from "@/lib/streak-calendar";

export function StreakMonthCalendar({ today, activeDates, availableFrom }: { today: string; activeDates: string[]; availableFrom: string }) {
  const [offset, setOffset] = useState(0);
  const titleId = useId();
  const month = shiftCalendarMonth(today.slice(0, 7), offset);
  const [year, number] = month.split("-").map(Number);
  const active = new Set(activeDates);
  const cells = calendarCells(month);
  const total = activeDates.filter((date) => date.startsWith(month)).length;
  const canGoBack = month > availableFrom.slice(0, 7);

  return (
    <details className="streak-month">
      <summary>Сарын календарь <span aria-hidden="true">▾</span></summary>
      <div className="streak-month-header">
        <button type="button" disabled={!canGoBack} onClick={() => setOffset((value) => value - 1)} aria-label="Өмнөх сар">←</button>
        <h3 id={titleId} aria-live="polite">{year} оны {number} сар</h3>
        <button type="button" disabled={offset >= 0} onClick={() => setOffset((value) => value + 1)} aria-label="Дараагийн сар">→</button>
      </div>
      <div className="streak-month-grid" role="table" aria-labelledby={titleId}>
        <div role="row" className="streak-month-row">
          {["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"].map((day) => <span key={day} role="columnheader" className="streak-month-weekday">{day}</span>)}
        </div>
        {Array.from({ length: cells.length / 7 }, (_, row) => (
          <div key={row} role="row" className="streak-month-row">
            {cells.slice(row * 7, row * 7 + 7).map((date, column) => {
              const recorded = date && active.has(date);
              const untracked = date && date < availableFrom;
              const future = date && date > today;
              return <span key={date ?? `blank-${column}`} role="cell" aria-current={date === today ? "date" : undefined} aria-label={date ? `${date}: ${future ? "Ирээгүй өдөр" : untracked ? "Түүх хадгалагдаагүй" : recorded ? "Идэвхтэй" : "Идэвх бүртгэгдээгүй"}` : undefined} className={`streak-month-cell ${recorded ? "is-active" : ""} ${date === today ? "is-today" : ""} ${untracked || future ? "is-muted" : ""}`}>
                {date && <><span>{Number(date.slice(-2))}</span><span aria-hidden="true" className="streak-month-mark">{recorded ? "●" : ""}</span></>}
              </span>;
            })}
          </div>
        ))}
      </div>
      <div className="streak-month-footer">
        <p><span aria-hidden="true" className="streak-month-legend">●</span> {total} өдөр идэвхтэй</p>
        <button type="button" disabled={offset === 0} onClick={() => setOffset(0)}>Энэ сар</button>
      </div>
      <p className="streak-timezone">Хадгалагдсан түүх {availableFrom}-ээс эхэлнэ. Улаанбаатарын цагаар тооцно.</p>
    </details>
  );
}
