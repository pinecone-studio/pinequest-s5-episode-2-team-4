"use client";

import { useState } from "react";
import { Expression, Fraction, sayFraction } from "@/components/Fraction";
import { savePractice } from "@/lib/actions";
import type { Question } from "@/lib/types";
import "./practice.css";

type PracticeSectionProps = {
  questions: Question[];
  /** Question ids solved on an earlier visit. */
  solvedIds: string[];
};

/** Last pick per question id, and how many tries it took (to replay the shake). */
type Picks = Record<string, { index: number; tries: number }>;

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

const CheckIcon = ({ className }: { className: string }) => (
  <svg {...iconProps} strokeWidth={3.2} className={className}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const CrossIcon = ({ className }: { className: string }) => (
  <svg {...iconProps} strokeWidth={3.2} className={className}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

/** The expression without its "= ?" ending. */
function leftSide(question: Question) {
  const end = question.expression.findIndex(
    (t) => t.kind === "op" && t.op === "=",
  );
  return end === -1 ? question.expression : question.expression.slice(0, end);
}

function PracticeRow({
  question,
  pick,
  onPick,
}: {
  question: Question;
  pick?: Picks[string];
  onPick: (index: number) => void;
}) {
  const solved = pick?.index === question.correctIndex;
  const wrong = pick !== undefined && !solved;

  return (
    <li
      className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-card border-2 p-3.5 md:flex md:flex-wrap md:gap-x-5 md:px-4.5 md:py-4 ${
        solved
          ? "border-sky bg-[#f5fcff]"
          : wrong
            ? "border-magenta bg-[#fffafd]"
            : "border-lavender"
      }`}
    >
      <Expression
        tokens={leftSide(question)}
        className="text-xl font-bold md:w-37.5 md:shrink-0 md:text-[22px]"
      />

      <div aria-live="polite" className="justify-self-end md:order-3">
        {solved ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky px-2.5 py-0.75 text-xs font-bold md:px-3.5 md:py-1.5 md:text-sm">
            <CheckIcon className="size-3 md:size-3.5" />
            Зөв!
          </span>
        ) : wrong ? (
          <a
            href="#tutor"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 border-magenta bg-pink px-3.5 text-sm font-bold text-ink no-underline hover:text-ink"
          >
            <svg {...iconProps} strokeWidth={3} className="size-3.5 text-magenta">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Дахиад · Туслах
          </a>
        ) : (
          <span className="hidden md:block md:w-26" />
        )}
      </div>

      <div className="col-span-2 grid grid-cols-4 gap-1.5 md:order-2 md:flex-[1_1_320px] md:gap-2">
        {question.options.map((option, i) => {
          const picked = pick?.index === i;
          const label = sayFraction(option);
          return (
            <button
              key={picked ? `${i}-${pick.tries}` : i}
              type="button"
              disabled={solved}
              onClick={() => onPick(i)}
              aria-pressed={picked}
              aria-label={
                picked
                  ? `${label}, чиний хариу, ${solved ? "зөв" : "зөв биш"}`
                  : label
              }
              className={`flex min-h-14 items-center justify-center gap-1 rounded-tile border-2 text-[17px] font-bold text-ink md:min-h-16 md:gap-2 md:text-xl ${
                picked && solved
                  ? "border-ink bg-sky"
                  : picked
                    ? "practice-nudge cursor-pointer border-magenta bg-pink"
                    : solved
                      ? "border-lavender bg-white"
                      : "cursor-pointer border-lavender bg-white hover:border-primary"
              }`}
            >
              {picked && solved ? (
                <CheckIcon className="size-3.5 md:size-4.5" />
              ) : picked ? (
                <CrossIcon className="size-3.5 text-magenta md:size-4.5" />
              ) : null}
              <Fraction value={option} />
            </button>
          );
        })}
      </div>
    </li>
  );
}

/** Practice questions with correct / try-again feedback. */
export function PracticeSection({ questions, solvedIds }: PracticeSectionProps) {
  const [picks, setPicks] = useState<Picks>(() =>
    Object.fromEntries(
      questions
        .filter((q) => solvedIds.includes(q.id))
        .map((q) => [q.id, { index: q.correctIndex, tries: 0 }]),
    ),
  );
  const solvedCount = questions.filter(
    (q) => picks[q.id]?.index === q.correctIndex,
  ).length;

  function pick(question: Question, index: number) {
    setPicks((prev) => ({
      ...prev,
      [question.id]: { index, tries: (prev[question.id]?.tries ?? 0) + 1 },
    }));
    // Saved on the server, which gives XP the first time.
    if (index === question.correctIndex) void savePractice(question.id, index);
  }

  return (
    <section
      aria-labelledby="practice-title"
      className="rounded-[25px] bg-white p-5 shadow-card md:rounded-panel md:px-8 md:py-7"
    >
      <div className="flex items-center justify-between gap-2 md:gap-3">
        <h3
          id="practice-title"
          className="text-2xl leading-tight font-bold md:text-[28px]"
        >
          Дасгал
        </h3>
        <span
          aria-label={`${questions.length}-аас ${solvedCount} бодсон`}
          className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-sm font-bold md:px-3.5 md:py-1.5 md:text-[15px]"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="size-3.5 fill-primary md:size-4"
          >
            <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" />
          </svg>
          {solvedCount}/{questions.length}
        </span>
      </div>
      <ul className="mt-3.5 flex flex-col gap-3 md:mt-5 md:gap-3.5">
        {questions.map((q) => (
          <PracticeRow
            key={q.id}
            question={q}
            pick={picks[q.id]}
            onPick={(index) => pick(q, index)}
          />
        ))}
      </ul>
    </section>
  );
}
