"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { EnglishAnswer, EnglishQuestionView } from "@/lib/types";
import { SKILL_LABELS } from "@/app/(student)/pets/battle/labels";
import { useSpeech } from "./useSpeech";

type QuestionCardProps = {
  question: EnglishQuestionView;
  /** While submitting or knocked out. */
  disabled: boolean;
  /** The answer is being checked. */
  checking?: boolean;
  onAnswer: (answer: EnglishAnswer) => void;
  /** Called when a listening question plays, e.g. to quieten the music. */
  onListen?: () => void;
};

const SpeakerIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="size-5"
  >
    <path d="M11 5 6 9H2v6h4l5 4V5Z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7" />
    <path d="M19 5a10 10 0 0 1 0 14" />
  </svg>
);

/**
 * One English challenge, compact enough to sit between the boss and the pets.
 * Keyed by question id, so its state resets per question.
 */
export function QuestionCard({ question, disabled, checking, onAnswer, onListen }: QuestionCardProps) {
  const { supported, speak } = useSpeech();
  const [text, setText] = useState("");
  // Word order: indexes into question.words, in the order tapped.
  const [order, setOrder] = useState<number[]>([]);

  const words = question.kind === "order" ? question.words : [];
  const allPlaced = question.kind === "order" && order.length === words.length;
  // Short choices sit two per row, even on a phone.
  const longChoices = question.kind === "choice" && question.options.some((o) => o.length > 26);

  return (
    <section
      aria-labelledby="question-prompt"
      className="rounded-card bg-white p-3.5 shadow-float md:p-5"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-surface px-3 py-1 text-xs font-bold md:text-sm">
          {SKILL_LABELS[question.skill]}
        </span>
        {question.verified ? null : (
          <span className="text-xs font-semibold text-ink-muted">Дадлагын асуулт</span>
        )}
        <span role="status" className="ml-auto text-sm font-bold text-primary">
          {checking ? "Шалгаж байна…" : ""}
        </span>
      </div>

      <div className="mt-2 flex items-start gap-3">
        <h2 id="question-prompt" lang="en" className="min-w-0 flex-1 text-lg leading-snug font-bold md:text-xl">
          {question.prompt}
        </h2>
        {question.speak && supported ? (
          <button
            type="button"
            onClick={() => {
              onListen?.();
              speak(question.speak ?? "");
            }}
            className="flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-surface px-3.5 text-sm font-bold text-ink transition-colors hover:bg-lavender md:text-base"
          >
            {SpeakerIcon}
            Сонсох
          </button>
        ) : null}
      </div>

      {question.display ? (
        <p
          lang={/[а-яөү]/i.test(question.display) ? "mn" : "en"}
          className="mt-2 rounded-tile bg-surface px-3 py-2 text-base font-bold tracking-wide md:text-lg"
        >
          {question.display}
        </p>
      ) : null}

      {question.speak && !supported ? (
        <p className="mt-2 text-sm font-semibold text-ink-muted">
          Энэ төхөөрөмж дээр дуу тоглуулах боломжгүй байна.
        </p>
      ) : null}

      {question.hint ? (
        <p className="mt-2 text-sm text-ink-muted">
          <span className="font-bold">Сануулга:</span> <span lang="en">{question.hint}</span>
        </p>
      ) : null}

      <div className="mt-3">
        {question.kind === "choice" ? (
          <div className={cn("grid gap-2 md:grid-cols-2", !longChoices && "grid-cols-2")}>
            {question.options.map((option, i) => (
              <button
                key={option}
                type="button"
                disabled={disabled}
                onClick={() => onAnswer(i)}
                lang={/[а-яөү]/i.test(option) ? "mn" : "en"}
                className="min-h-11 cursor-pointer rounded-tile border-2 border-lavender bg-white px-3 py-2 text-left text-sm font-bold text-ink transition-colors hover:border-primary disabled:cursor-default disabled:opacity-60 md:min-h-12 md:text-base"
              >
                <span aria-hidden="true" className="mr-2 text-ink-muted">
                  {String.fromCharCode(65 + i)}.
                </span>
                {option}
              </button>
            ))}
          </div>
        ) : null}

        {question.kind === "text" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (text.trim()) onAnswer(text);
            }}
            className="flex gap-2"
          >
            <label htmlFor="answer-input" className="sr-only">
              Хариулт
            </label>
            <input
              id="answer-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={disabled}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              maxLength={300}
              placeholder="Хариултаа бичнэ үү"
              className="h-12 min-w-0 flex-1 rounded-tile border-2 border-lavender bg-white px-3 text-base text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none md:h-14 md:text-lg"
            />
            <Button type="submit" size="sm" className="md:min-h-14" disabled={disabled || !text.trim()}>
              Шалгах
            </Button>
          </form>
        ) : null}

        {question.kind === "order" ? (
          <div className="flex flex-col gap-2">
            <p
              aria-live="polite"
              lang="en"
              className="min-h-12 rounded-tile border-2 border-dashed border-line px-3 py-2 text-base font-bold md:text-lg"
            >
              {order.length > 0 ? order.map((i) => words[i]).join(" ") : (
                <span className="font-semibold text-ink-muted">Үгсийг дарааллаар нь дар</span>
              )}
            </p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Үгс">
              {words.map((word, i) => {
                const used = order.includes(i);
                return (
                  <button
                    key={`${word}-${i}`}
                    type="button"
                    lang="en"
                    disabled={disabled || used}
                    onClick={() => setOrder((o) => [...o, i])}
                    className={cn(
                      "min-h-11 cursor-pointer rounded-full border-2 px-3.5 text-sm font-bold transition-opacity md:text-base",
                      used ? "border-surface bg-surface text-ink-muted opacity-50" : "border-lavender bg-white text-ink hover:border-primary",
                    )}
                  >
                    {word}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={disabled || order.length === 0}
                onClick={() => setOrder([])}
              >
                Арилгах
              </Button>
              <Button
                size="sm"
                disabled={disabled || !allPlaced}
                onClick={() => onAnswer(order.map((i) => words[i]).join(" "))}
              >
                Шалгах
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
