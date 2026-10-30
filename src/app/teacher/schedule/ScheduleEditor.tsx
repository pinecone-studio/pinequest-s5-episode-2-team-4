"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { WEEKDAYS, isoWeekday } from "@/lib/lesson-topics";
import { clearLessonAction, planLessonAction, setLessonDaysAction, type ScheduleResult } from "@/lib/schedule-actions";
import type { ClassSchedule, LessonTopic } from "@/lib/types";

const fieldClass =
  "h-11 w-full min-w-0 rounded-tile border-2 border-lavender bg-card px-3 text-base text-ink focus:border-primary focus:outline-none disabled:opacity-60";

const ERRORS: Record<Exclude<ScheduleResult, { ok: true }>["error"], string> = {
  noclass: "Ангиа сонгоод дахин оролдоно уу.",
  invalid: "Энэ өдрийг хуваарьт оруулах боломжгүй.",
  failed: "Хадгалж чадсангүй. Дахин оролдоно уу.",
};

const OWN = "__own";

/** "10-р сарын 30" for a "YYYY-MM-DD" day; built by hand so server and browser match. */
const dayLabel = (day: string) => `${Number(day.slice(5, 7))}-р сарын ${Number(day.slice(8, 10))}`;

/** Topics grouped for the <select>, keeping the order they came in. */
function groups(topics: LessonTopic[]) {
  const map = new Map<string, LessonTopic[]>();
  for (const t of topics) map.set(t.group ?? "", [...(map.get(t.group ?? "") ?? []), t]);
  return [...map];
}

export function ScheduleEditor({ schedule }: { schedule: ClassSchedule }) {
  const [days, setDays] = useState(schedule.lessonDays);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const locked = !schedule.editable;

  function run(task: () => Promise<ScheduleResult>, undo?: () => void) {
    setError(undefined);
    startTransition(async () => {
      const result = await task();
      if ("error" in result) {
        undo?.();
        setError(ERRORS[result.error]);
      }
    });
  }

  function toggle(day: number) {
    const before = days;
    const next = days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort();
    setDays(next);
    run(() => setLessonDaysAction(next), () => setDays(before));
  }

  return (
    <div className="mt-6 flex flex-col gap-5">
      {locked && (
        <p className="rounded-card bg-surface px-4 py-3 text-sm font-semibold text-ink-muted">
          Демо горимд өөрчлөлт хадгалагдахгүй.
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-card border-2 border-magenta bg-pink px-4 py-3 text-sm font-bold">
          {error}
        </p>
      )}

      <section aria-labelledby="weekdays-title" className="glass-panel rounded-panel bg-card p-5 shadow-card md:p-7">
        <h2 id="weekdays-title" className="type-section-title">
          {schedule.className} анги хичээл орох гарагууд
        </h2>
        <div role="group" aria-labelledby="weekdays-title" className="mt-4 flex flex-wrap gap-2">
          {WEEKDAYS.map((w) => {
            const on = days.includes(w.day);
            return (
              <button
                key={w.day}
                type="button"
                aria-pressed={on}
                aria-label={w.name}
                disabled={locked || pending}
                onClick={() => toggle(w.day)}
                className={cn(
                  "flex size-14 cursor-pointer items-center justify-center rounded-full text-base font-bold disabled:cursor-default",
                  on ? "bg-primary text-white" : "bg-surface text-ink hover:bg-lavender",
                )}
              >
                {w.short}
              </button>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="upcoming-title" className="glass-panel rounded-panel bg-card p-5 shadow-card md:p-7">
        <h2 id="upcoming-title" className="type-section-title">
          Ирэх хичээлүүд
        </h2>
        {schedule.upcoming.length === 0 ? (
          <p className="mt-3 text-ink-muted">Дээрээс хичээл орох гарагуудаа сонгоход ирэх хичээлүүд энд гарна.</p>
        ) : (
          <ul className="mt-4 flex flex-col divide-y divide-line">
            {/* Keyed by the plan too, so a saved topic resets the row. */}
            {schedule.upcoming.map(({ day, plan }) => (
              <DayRow key={`${day}-${plan?.topicKey ?? ""}`} day={day} planKey={plan?.topicKey} topics={schedule.topics} locked={locked} onSave={run} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

type DayRowProps = {
  day: string;
  planKey?: string;
  topics: LessonTopic[];
  locked: boolean;
  onSave: (task: () => Promise<ScheduleResult>, undo?: () => void) => void;
};

/** One lesson day: a curriculum topic, the teacher's own text, or none (students pick). */
function DayRow({ day, planKey, topics, locked, onSave }: DayRowProps) {
  const [value, setValue] = useState(planKey ?? "");
  const [own, setOwn] = useState("");
  const weekday = WEEKDAYS.find((w) => w.day === isoWeekday(day))?.name;
  // A typed topic from an earlier day may not be in today's list yet.
  const known = !planKey || topics.some((t) => t.key === planKey);

  function choose(next: string) {
    const before = value;
    setValue(next);
    if (next === OWN) return;
    onSave(() => (next ? planLessonAction(day, { key: next }) : clearLessonAction(day)), () => setValue(before));
  }

  return (
    <li className="grid gap-2 py-3 md:grid-cols-[12rem_minmax(0,1fr)] md:items-center md:gap-4">
      <p className="font-bold">
        {dayLabel(day)} <span className="font-semibold text-ink-muted">· {weekday}</span>
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          aria-label={`${dayLabel(day)}-ны сэдэв`}
          value={value}
          disabled={locked}
          onChange={(e) => choose(e.target.value)}
          className={fieldClass}
        >
          <option value="">— Сэдэв сонгогдоогүй —</option>
          {!known && planKey && <option value={planKey}>{planKey.replace(/^t:/, "")}</option>}
          {groups(topics).map(([group, list]) =>
            group ? (
              <optgroup key={group} label={group}>
                {list.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.title}
                  </option>
                ))}
              </optgroup>
            ) : (
              list.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.title}
                </option>
              ))
            ),
          )}
          <option value={OWN}>✎ Өөр сэдэв бичих…</option>
        </select>
        {value === OWN && (
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!own.trim()) return;
              onSave(() => planLessonAction(day, { title: own }));
            }}
          >
            <input
              aria-label="Сэдвийн нэр"
              value={own}
              maxLength={120}
              autoFocus
              placeholder="Жишээ нь: Пифагорын теорем"
              onChange={(e) => setOwn(e.target.value)}
              className={fieldClass}
            />
            <button type="submit" className="h-11 shrink-0 cursor-pointer rounded-full bg-primary px-4 text-sm font-bold text-white">
              Хадгалах
            </button>
          </form>
        )}
      </div>
    </li>
  );
}
