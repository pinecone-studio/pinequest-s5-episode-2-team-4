"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { checkAssignment } from "@/lib/actions";
import { cn } from "@/lib/cn";

type AssignmentCardProps = {
  id: string;
  subtopicTitle: string;
  /** Questions only: the answers are checked on the server. */
  questions: string[];
  due?: string;
};

/** Exercises the class teacher sent for a subtopic the student is weak in. */
export function AssignmentCard({ id, subtopicTitle, questions, due }: AssignmentCardProps) {
  const [answers, setAnswers] = useState(() => questions.map(() => ""));
  const [results, setResults] = useState<boolean[] | null>(null);
  const [pending, startTransition] = useTransition();
  const correct = results?.filter(Boolean).length ?? 0;

  function check(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => setResults(await checkAssignment(id, answers)));
  }

  return (
    <section
      aria-labelledby={`assignment-${id}`}
      className="mt-7 rounded-[25px] bg-white p-5 shadow-card md:mt-6 md:rounded-panel md:p-8"
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="rounded-full bg-ink px-3 py-1 text-xs font-bold text-white">
          Багшийн даалгавар
        </span>
        {due && (
          <span className="text-xs font-semibold text-ink-muted">Хугацаа: {due}</span>
        )}
      </div>
      <h2 id={`assignment-${id}`} className="mt-2 text-[22px] font-bold md:text-[28px]">
        {subtopicTitle}
      </h2>

      <form onSubmit={check} className="mt-4 flex flex-col gap-2.5">
        {questions.map((q, i) => {
          const result = results?.[i];
          return (
            <div
              key={i}
              className={cn(
                "flex flex-col gap-2 rounded-card p-3 md:flex-row md:items-center md:gap-4",
                result === true ? "bg-sky" : result === false ? "bg-pink" : "bg-surface",
              )}
            >
              <label htmlFor={`${id}-${i}`} className="flex-1 font-bold">
                {i + 1}. {q}
              </label>
              <div className="flex items-center gap-2">
                <input
                  id={`${id}-${i}`}
                  value={answers[i]}
                  onChange={(e) => {
                    const value = e.target.value;
                    setAnswers((prev) => prev.map((a, j) => (j === i ? value : a)));
                    setResults(null);
                  }}
                  placeholder="3/4"
                  maxLength={30}
                  inputMode="text"
                  autoComplete="off"
                  className="h-12 w-32 rounded-tile border-2 border-lavender bg-white px-3 text-base font-bold text-ink focus:border-primary focus:outline-none"
                />
                <span aria-live="polite" className="w-6 text-lg font-bold">
                  {result === true ? "✓" : result === false ? "✗" : ""}
                </span>
              </div>
            </div>
          );
        })}
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <Button type="submit" size="sm" disabled={pending} aria-busy={pending}>
            Шалгах
          </Button>
          {results && (
            <p role="status" className="font-bold">
              {correct === questions.length
                ? "Бүгд зөв! Сайн байна 🎉"
                : `${correct}/${questions.length} зөв. Улаанаар тэмдэглэснийг дахин бодоорой.`}
            </p>
          )}
        </div>
      </form>
    </section>
  );
}
