"use client";

import Link from "next/link";
import { useState } from "react";
import { FractionText, sayFraction } from "./FractionText";
import type { ExpressionPart, TestQuestion } from "./questions";

type DiagnosticTestProps = {
  questions: TestQuestion[];
};

/** Selected option index per question id. */
type Answers = Record<string, number>;

// TODO(#21): pass the answers to the results page.
const RESULTS_HREF = "/lesson/fractions";

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

const CloseIcon = (
  <svg {...iconProps} className="size-5 md:size-[22px]">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const ArrowLeftIcon = (
  <svg {...iconProps} className="size-5 md:size-[22px]">
    <path d="M19 12H5" />
    <path d="m12 19-7-7 7-7" />
  </svg>
);

const ArrowRightIcon = (
  <svg {...iconProps} className="size-5">
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

const CheckIcon = (
  <svg {...iconProps} strokeWidth={2.8} className="size-5">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

function describeExpression(parts: ExpressionPart[]) {
  const words = parts.flatMap((part) => {
    if (part.kind === "fraction") return [sayFraction(part.value)];
    if (part.kind === "operator") {
      return [part.symbol === "+" ? "нэмэх" : "тэнцүү"];
    }
    return [];
  });
  return `${words.join(" ")} хэд вэ`;
}

const primaryButtonClass =
  "flex min-h-[60px] flex-1 items-center justify-center gap-2.5 rounded-full bg-primary px-9 text-lg font-bold text-white no-underline shadow-[0_5px_0_var(--color-primary-dark)] transition hover:text-white hover:brightness-110 active:translate-y-[5px] active:shadow-[0_1px_0_var(--color-primary-dark)] md:flex-none md:shadow-3d";

export function DiagnosticTest({ questions }: DiagnosticTestProps) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

  const question = questions[current];
  const total = questions.length;
  const answeredCount = questions.filter((q) => q.id in answers).length;
  const isLast = current === total - 1;
  const isComplete = answeredCount === total;
  const selected = answers[question.id];

  function pick(index: number) {
    setAnswers((prev) => ({ ...prev, [question.id]: index }));
  }

  return (
    <div className="mx-auto max-w-[960px] px-4 pt-4 md:px-[clamp(16px,4vw,40px)] md:pt-6">
      <div className="flex items-end gap-2.5 md:gap-4">
        <Link
          href="/"
          aria-label="Тестээс гарах"
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-surface text-ink hover:text-ink"
        >
          {CloseIcon}
        </Link>
        <ol
          aria-label="Асуултууд"
          className="grid flex-1 grid-cols-8 gap-1 md:gap-1.5"
        >
          {questions.map((q, i) => {
            const isCurrent = i === current;
            const isAnswered = q.id in answers;
            return (
              <li
                key={q.id}
                className="relative flex h-[60px] flex-col justify-end md:h-16"
              >
                {isCurrent ? (
                  // TODO(#9): use the current pet's PetSprite.
                  <span
                    aria-hidden="true"
                    className="absolute top-0.5 left-1/2 -ml-3 size-6 animate-bob rounded-full bg-lavender md:-top-0.5 md:-ml-6 md:size-12"
                  />
                ) : null}
                <button
                  type="button"
                  onClick={() => setCurrent(i)}
                  aria-label={`${i + 1}-р асуулт${isAnswered ? ", хариулсан" : ""}`}
                  aria-current={isCurrent ? "step" : undefined}
                  className="flex h-8 cursor-pointer items-end md:h-12"
                >
                  <span
                    className={`block h-3 w-full rounded-full transition-colors duration-300 md:h-3.5 ${
                      isAnswered ? "bg-primary" : "bg-lavender"
                    } ${
                      isCurrent
                        ? "shadow-[0_0_0_2px_white,0_0_0_4px_var(--color-primary)] md:shadow-[0_0_0_3px_white,0_0_0_6px_var(--color-primary)]"
                        : ""
                    }`}
                  />
                </button>
              </li>
            );
          })}
        </ol>
        <p
          aria-label={`${answeredCount} асуултад хариулсан, нийт ${total}`}
          className="mb-1.5 shrink-0 text-[17px] font-bold md:mb-2 md:text-xl"
        >
          {answeredCount}
          <span className="text-ink-muted">/{total}</span>
        </p>
      </div>

      <section
        aria-labelledby="question-prompt"
        className="mt-5 flex flex-col items-center gap-6 rounded-[25px] bg-white px-4 pt-6 pb-5 shadow-float md:mt-8 md:gap-9 md:rounded-panel md:px-12 md:pt-10 md:pb-12"
      >
        <h1
          id="question-prompt"
          className="rounded-full bg-surface px-4 py-1.5 text-base font-bold md:px-5 md:py-2 md:text-lg"
        >
          {question.prompt}
        </h1>

        <div
          role="img"
          aria-label={describeExpression(question.expression)}
          className="flex items-center gap-3 text-[40px] leading-none font-bold md:gap-5 md:text-[56px]"
        >
          {question.expression.map((part, i) => {
            if (part.kind === "fraction") {
              return (
                <FractionText key={i} value={part.value} size="expression" />
              );
            }
            if (part.kind === "operator") {
              return (
                <span key={i} className="text-primary">
                  {part.symbol}
                </span>
              );
            }
            return (
              <span
                key={i}
                className="inline-flex h-[76px] w-14 items-center justify-center rounded-tile border-3 border-dashed border-primary bg-surface text-[32px] text-primary md:h-[104px] md:w-20 md:rounded-card md:text-[44px]"
              >
                ?
              </span>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-3 self-stretch md:grid-cols-4 md:gap-4">
          {question.options.map((option, i) => {
            const isSelected = selected === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => pick(i)}
                aria-pressed={isSelected}
                aria-label={sayFraction(option)}
                className={`relative flex min-h-28 cursor-pointer items-center justify-center rounded-tile border-3 px-2 py-3 transition active:scale-[.98] md:min-h-[148px] md:py-4 ${
                  isSelected
                    ? "border-primary bg-primary text-white shadow-[0_5px_0_var(--color-primary-dark)] md:shadow-3d"
                    : "border-lavender bg-white text-ink shadow-[0_5px_0_var(--color-lavender)] hover:border-primary md:shadow-[0_6px_0_var(--color-lavender)]"
                }`}
              >
                {isSelected ? (
                  <span
                    aria-hidden="true"
                    className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-white text-primary md:top-2.5 md:right-2.5 md:size-[26px]"
                  >
                    <svg {...iconProps} strokeWidth={3.4} className="size-3.5 md:size-4">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                ) : null}
                <span className="text-[32px] leading-none font-bold md:text-[40px]">
                  <FractionText value={option} size="option" />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="mt-6 flex gap-3 md:mt-7 md:justify-between md:gap-4">
        {current > 0 ? (
          <button
            type="button"
            onClick={() => setCurrent(current - 1)}
            aria-label="Өмнөх асуулт"
            className="flex size-[60px] shrink-0 cursor-pointer items-center justify-center gap-2.5 rounded-full bg-surface text-lg font-bold text-ink shadow-[0_5px_0_var(--color-line)] transition active:translate-y-[5px] active:shadow-[0_1px_0_var(--color-line)] md:w-auto md:px-7 md:shadow-3d-soft"
          >
            {ArrowLeftIcon}
            <span className="hidden md:inline">Өмнөх</span>
          </button>
        ) : (
          <span className="hidden md:block" />
        )}

        {!isLast ? (
          <button
            type="button"
            onClick={() => setCurrent(current + 1)}
            className={`${primaryButtonClass} cursor-pointer`}
          >
            Дараах
            {ArrowRightIcon}
          </button>
        ) : isComplete ? (
          <Link href={RESULTS_HREF} className={primaryButtonClass}>
            Дуусгах
            {CheckIcon}
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="min-h-[60px] flex-1 cursor-not-allowed rounded-full border-3 border-dashed border-line bg-white px-9 text-base font-bold text-ink-muted md:flex-none md:text-lg"
          >
            Дуусгах · {total - answeredCount} үлдсэн
          </button>
        )}
      </div>
    </div>
  );
}
