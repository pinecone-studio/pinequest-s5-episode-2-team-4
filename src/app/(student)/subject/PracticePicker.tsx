"use client";

import { useState, useTransition } from "react";
import { buttonClass } from "@/components/ui";
import { choosePractice } from "@/lib/class-actions";
import { cn } from "@/lib/cn";

type PracticePickerProps = {
  subjects: { id: string; title: string }[];
  /** Grades without content yet show as coming soon */
  grades: { grade: number; open: boolean }[];
  initial?: { subject: string; grade: number };
};

const chip =
  "flex min-h-12 items-center justify-center rounded-tile border-2 px-3 text-center text-sm font-bold transition-colors";

/** Grade and subject for a student in no class; the games then ask that subject's questions. */
export function PracticePicker({ subjects, grades, initial }: PracticePickerProps) {
  const [grade, setGrade] = useState(initial?.grade ?? grades.find((g) => g.open)?.grade);
  const [subject, setSubject] = useState(initial?.subject);
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-6 flex flex-col gap-6">
      <fieldset>
        <legend className="mb-2 text-lg font-bold">Анги</legend>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {grades.map((g) => (
            <button
              key={g.grade}
              type="button"
              disabled={!g.open}
              aria-pressed={grade === g.grade}
              onClick={() => setGrade(g.grade)}
              className={cn(
                chip,
                "flex-col",
                grade === g.grade ? "border-primary bg-surface" : "border-lavender bg-card",
                g.open ? "cursor-pointer hover:border-primary" : "cursor-not-allowed opacity-50",
              )}
            >
              {g.grade}-р
              {!g.open && <span className="text-2xs font-semibold">удахгүй</span>}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-lg font-bold">Хичээл</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {subjects.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={subject === s.id}
              onClick={() => setSubject(s.id)}
              className={cn(
                chip,
                "cursor-pointer hover:border-primary",
                subject === s.id ? "border-primary bg-surface" : "border-lavender bg-card",
              )}
            >
              {s.title}
            </button>
          ))}
        </div>
      </fieldset>

      <button
        type="button"
        disabled={!subject || !grade || pending}
        aria-busy={pending}
        onClick={() => subject && grade && startTransition(() => choosePractice(subject, grade))}
        className={buttonClass({ size: "lg", className: "self-start" })}
      >
        Тоглоом руу
      </button>
    </div>
  );
}
