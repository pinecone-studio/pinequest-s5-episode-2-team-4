"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Expression, Fraction, sayFraction } from "@/components/Fraction";
import { PetSprite } from "@/components/pet/PetSprite";
import { Button } from "@/components/ui";
import type { PetStage, Question } from "@/lib/types";

type DiagnosticTestProps = {
  questions: Question[];
  /** The current pet, shown above the current question. */
  petStage?: PetStage;
  /** Saves the answers (a Server Function); it may redirect itself. */
  submit: (answers: Answers) => Promise<void>;
  /** Where to go after saving, unless `submit` redirected. */
  resultsHref?: string;
  /** Where the ✕ button goes. */
  exitHref?: string;
  /** Demo answers; shows a "fill with sample answers" button. */
  sampleAnswers?: Answers;
  /** Start with the sample answers filled in, as if the button was pressed. */
  startFilled?: boolean;
};

/** Selected option index per question id. */
type Answers = Record<string, number>;

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

const primaryButtonClass =
  "flex min-h-[60px] flex-1 items-center justify-center gap-2.5 rounded-full bg-primary px-9 text-lg font-bold text-white no-underline shadow-[0_5px_0_var(--color-primary-dark)] transition hover:text-white hover:brightness-110 active:translate-y-[5px] active:shadow-[0_1px_0_var(--color-primary-dark)] md:flex-none md:shadow-3d";

export function DiagnosticTest({
  questions,
  petStage,
  submit,
  resultsHref,
  exitHref = "/",
  sampleAnswers,
  startFilled = false,
}: DiagnosticTestProps) {
  const prefill = startFilled && sampleAnswers !== undefined;
  const [current, setCurrent] = useState(prefill ? questions.length - 1 : 0);
  const [answers, setAnswers] = useState<Answers>(prefill ? sampleAnswers : {});
  const [finishing, startFinishing] = useTransition();
  const router = useRouter();

  const question = questions[current];
  const total = questions.length;
  const answeredCount = questions.filter((q) => q.id in answers).length;
  const isLast = current === total - 1;
  const isComplete = answeredCount === total;
  const selected = answers[question.id];

  function pick(index: number) {
    setAnswers((prev) => ({ ...prev, [question.id]: index }));
  }

  // Demo: fill every answer, jump to the end and confirm with a short toast.
  const [filled, setFilled] = useState(prefill);
  useEffect(() => {
    if (!filled) return;
    const timer = setTimeout(() => setFilled(false), 3000);
    return () => clearTimeout(timer);
  }, [filled]);

  function fillSample() {
    if (!sampleAnswers) return;
    setAnswers(sampleAnswers);
    setCurrent(total - 1);
    setFilled(true);
  }

  const started = answeredCount > 0 && !finishing;

  // Warn before a reload or tab close would lose the answers.
  useEffect(() => {
    if (!started) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [started]);

  // An in-page dialog, not window.confirm: embedded previews and blocked
  // pop-ups make confirm() return false without showing anything.
  const exitDialog = useRef<HTMLDialogElement>(null);

  function exit() {
    if (started) exitDialog.current?.showModal();
    else router.push(exitHref);
  }

  function finish() {
    startFinishing(async () => {
      await submit(answers);
      if (resultsHref) router.push(resultsHref);
    });
  }

  return (
    <div className="mx-auto max-w-[960px] px-4 pt-4 md:px-[clamp(16px,4vw,40px)] md:pt-6">
      <div className="flex items-end gap-2.5 md:gap-4">
        <button
          type="button"
          onClick={exit}
          aria-label="Тестээс гарах"
          className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full bg-surface text-ink"
        >
          {CloseIcon}
        </button>
        <ol
          aria-label="Асуултууд"
          className="grid flex-1 gap-1 md:gap-1.5"
          style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
        >
          {questions.map((q, i) => {
            const isCurrent = i === current;
            const isAnswered = q.id in answers;
            return (
              <li
                key={q.id}
                className="relative flex h-[60px] flex-col justify-end md:h-16"
              >
                {isCurrent && petStage ? (
                  <span className="absolute top-0.5 left-1/2 -ml-3 animate-bob md:-top-0.5 md:-ml-6">
                    <PetSprite stage={petStage} size={24} className="md:hidden" />
                    <PetSprite
                      stage={petStage}
                      size={48}
                      className="hidden md:block"
                    />
                  </span>
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

        <Expression
          tokens={question.expression}
          className="text-[40px] font-bold md:text-[56px]"
        />

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
                <Fraction
                  value={option}
                  className="text-[32px] font-bold md:text-[40px]"
                />
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
          <button
            type="button"
            onClick={finish}
            disabled={finishing}
            aria-busy={finishing}
            className={`${primaryButtonClass} cursor-pointer disabled:cursor-wait disabled:opacity-70`}
          >
            Дуусгах
            {CheckIcon}
          </button>
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

      {sampleAnswers ? (
        <div className="mt-3 flex flex-col items-center gap-2 md:mt-5 md:gap-2.5">
          <button
            type="button"
            onClick={fillSample}
            className="min-h-12 cursor-pointer px-4 text-sm font-semibold text-ink-muted underline underline-offset-4 md:min-h-11"
          >
            Жишээ хариултаар бөглөх
          </button>
          <div role="status" aria-live="polite">
            {filled ? (
              <p className="inline-flex items-center gap-2.5 rounded-full bg-black px-4.5 py-2.5 text-sm font-semibold text-white md:px-5 md:py-3">
                <svg {...iconProps} className="size-4 text-sky md:size-4.5">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                Бөглөлөө
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <dialog
        ref={exitDialog}
        aria-labelledby="exit-title"
        className="fixed inset-0 m-auto h-fit w-[min(420px,calc(100%-32px))] rounded-panel bg-white p-6 text-ink shadow-float backdrop:bg-ink/40 md:p-8"
      >
        <h2 id="exit-title" className="text-xl leading-tight font-bold md:text-2xl">
          Тестээс гарах уу?
        </h2>
        <p className="mt-2 text-ink-muted">Хариултууд хадгалагдахгүй.</p>
        <div className="mt-6 flex flex-col-reverse gap-3 md:flex-row md:justify-end">
          {/* Staying is the safe choice, so it gets the focus. */}
          <Button
            variant="secondary"
            size="sm"
            autoFocus
            onClick={() => exitDialog.current?.close()}
          >
            Үргэлжлүүлэх
          </Button>
          <Button size="sm" onClick={() => router.push(exitHref)}>
            Гарах
          </Button>
        </div>
      </dialog>
    </div>
  );
}
