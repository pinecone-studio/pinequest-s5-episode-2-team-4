"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { AnonQuestion } from "@/lib/types";

/** XP a helper gets once the teacher approves the answer. */
const HELP_XP = 10;

type QuestionPanelProps = {
  /** Classmates' anonymous questions on this subtopic. */
  questions: AnonQuestion[];
};

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

/**
 * Anonymous questions beside the lesson: the teacher or a classmate answers,
 * not the AI. Mock: new questions and «Би ч бас» stay in local state.
 */
export function QuestionPanel({ questions }: QuestionPanelProps) {
  const [mine, setMine] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [meToo, setMeToo] = useState<Set<string>>(new Set());
  // One kudos per answer; there is no way to leave a negative reaction.
  const [kudos, setKudos] = useState<Set<string>>(new Set());
  // Which question has its reply box open; sent replies wait for the teacher.
  const [replying, setReplying] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [replied, setReplied] = useState<Record<string, string>>({});

  // Peer answers reach students only after the teacher approves them.
  const answered = questions.filter((q) => q.answer?.approved);
  const open = questions.filter((q) => !q.answer?.approved);

  function toggleMeToo(id: string) {
    setMeToo((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  return (
    <aside
      id="tutor"
      aria-labelledby="questions-title"
      className="flex scroll-mt-6 flex-col overflow-hidden rounded-[25px] bg-white shadow-float md:rounded-panel"
    >
      <div className="flex items-center justify-between gap-2.5 bg-surface px-4.5 py-3.5 md:gap-3 md:px-5.5 md:py-4.5">
        <div className="flex items-center gap-2.5 md:gap-3">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-white md:size-11"
          >
            ?
          </span>
          <h2
            id="questions-title"
            className="text-lg leading-tight font-bold md:text-xl"
          >
            Асуулт асуух
          </h2>
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-muted">
          <svg {...iconProps} strokeWidth={2.4} className="size-3">
            <rect width="18" height="11" x="3" y="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Нэргүй
        </span>
      </div>

      <div className="flex max-h-[min(480px,65vh)] flex-col gap-4 overflow-y-auto px-3.5 pt-3.5 pb-1.5 md:px-4.5 md:pt-4.5">
        {mine.length > 0 ? (
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-bold text-ink-muted">Миний асуулт</h3>
            {mine.map((text, i) => (
              <div key={i} className="rounded-card bg-primary px-3.5 py-2.5 text-white">
                <p className="text-[15px]">{text}</p>
                <p className="mt-1 text-xs font-semibold opacity-80">
                  Багш эсвэл ангийнхны хариуг хүлээж байна
                </p>
              </div>
            ))}
            <p className="rounded-card bg-sky px-3.5 py-2.5 text-sm font-bold">
              Хүлээх зуураа дээрх тайлбар, алхмуудаа дахин уншаарай. Ихэнх
              хариулт тэнд байдаг.
            </p>
          </div>
        ) : null}

        {open.length > 0 ? (
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-bold text-ink-muted">Ангийнхны асуулт</h3>
            {open.map((q) => {
              const pressed = meToo.has(q.id);
              return (
                <div
                  key={q.id}
                  className="flex flex-col gap-2 rounded-card bg-surface px-3.5 py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <p className="flex-1 text-[15px]">{q.text}</p>
                    <div className="flex shrink-0 flex-col gap-1.5">
                      <button
                        type="button"
                        aria-pressed={pressed}
                        onClick={() => toggleMeToo(q.id)}
                        className={cn(
                          "min-h-11 cursor-pointer rounded-full border-2 px-3 text-xs font-bold whitespace-nowrap",
                          pressed
                            ? "border-primary bg-primary text-white"
                            : "border-lavender bg-white text-ink hover:bg-lavender",
                        )}
                      >
                        Би ч бас · {q.meToo + (pressed ? 1 : 0)}
                      </button>
                      {q.answer || replied[q.id] || replying === q.id ? null : (
                        <button
                          type="button"
                          onClick={() => {
                            setReplying(q.id);
                            setReplyDraft("");
                          }}
                          className="min-h-11 cursor-pointer rounded-full border-2 border-lavender bg-white px-3 text-xs font-bold whitespace-nowrap text-ink hover:bg-lavender"
                        >
                          Хариулах
                        </button>
                      )}
                    </div>
                  </div>
                  {replied[q.id] ? (
                    <div className="rounded-field bg-white px-3.5 py-2.5">
                      <p className="text-[15px]">{replied[q.id]}</p>
                      <p role="status" className="mt-1 text-xs font-bold text-ink-muted">
                        Багш баталгаажуулахыг хүлээж байна · +{HELP_XP} XP
                      </p>
                    </div>
                  ) : replying === q.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const text = replyDraft.trim();
                        if (!text) return;
                        setReplied((prev) => ({ ...prev, [q.id]: text }));
                        setReplying(null);
                      }}
                      className="flex flex-col gap-2"
                    >
                      <label htmlFor={`reply-${q.id}`} className="sr-only">
                        Хариулт бичих
                      </label>
                      <textarea
                        id={`reply-${q.id}`}
                        value={replyDraft}
                        onChange={(e) => setReplyDraft(e.target.value)}
                        placeholder={`Өөрийнхөөрөө тайлбарла… Багш баталбал +${HELP_XP} XP`}
                        rows={3}
                        maxLength={500}
                        autoFocus
                        className="w-full resize-none rounded-field border-2 border-line bg-white px-3.5 py-2.5 text-base text-ink outline-none placeholder:text-ink-muted focus:border-primary"
                      />
                      <div className="flex gap-2 self-end">
                        <button
                          type="button"
                          onClick={() => setReplying(null)}
                          className="min-h-11 cursor-pointer rounded-full border-2 border-lavender bg-white px-3 text-xs font-bold whitespace-nowrap text-ink hover:bg-lavender"
                        >
                          Болих
                        </button>
                        <button
                          type="submit"
                          disabled={!replyDraft.trim()}
                          className="min-h-11 cursor-pointer rounded-full border-2 border-primary bg-primary px-3 text-xs font-bold whitespace-nowrap text-white disabled:cursor-default disabled:opacity-60"
                        >
                          Илгээх
                        </button>
                      </div>
                    </form>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}

        {answered.length > 0 ? (
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-bold text-ink-muted">Хариулсан</h3>
            {answered.map((q) => (
              <div key={q.id} className="rounded-card border-2 border-lavender px-3.5 py-2.5">
                <p className="text-[15px] font-bold">{q.text}</p>
                <p className="mt-1.5 text-[15px]">{q.answer?.text}</p>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-ink-muted">
                    {q.answer?.by === "teacher"
                      ? "Багш"
                      : "Ангийн найз · Багш баталсан"}
                  </p>
                  {q.answer?.by === "peer" ? (
                    <button
                      type="button"
                      disabled={kudos.has(q.id)}
                      onClick={() => setKudos((prev) => new Set(prev).add(q.id))}
                      className={cn(
                        "min-h-11 cursor-pointer rounded-full border-2 px-3 text-xs font-bold disabled:cursor-default",
                        kudos.has(q.id)
                          ? "border-primary bg-primary text-white"
                          : "border-lavender bg-white text-ink hover:bg-lavender",
                      )}
                    >
                      {kudos.has(q.id) ? "Баярлалаа!" : "Чи сайн тайлбарласан"} 👏{" "}
                      {q.answer.kudos + (kudos.has(q.id) ? 1 : 0)}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {questions.length === 0 && mine.length === 0 ? (
          <p className="py-4 text-center text-sm font-semibold text-ink-muted">
            Одоохондоо асуулт алга. Эхлээд чи асуу!
          </p>
        ) : null}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const text = draft.trim();
          if (!text) return;
          setMine((prev) => [...prev, text]);
          setDraft("");
        }}
        className="mx-3.5 mt-3 mb-4 flex items-center gap-2 rounded-full border-2 border-line bg-white py-1 focus-within:border-primary pr-1 pl-4 md:mx-4.5 md:mt-4 md:mb-5 md:py-1.5 md:pr-1.5 md:pl-4.5"
      >
        <label htmlFor="question-input" className="sr-only">
          Нэргүй асуулт бичих
        </label>
        <input
          id="question-input"
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Нэргүй асуух…"
          autoComplete="off"
          maxLength={500}
          className="h-12 min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-muted md:h-11 md:text-[15px]"
        />
        <button
          type="submit"
          aria-label="Илгээх"
          disabled={!draft.trim()}
          className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-white disabled:cursor-default disabled:opacity-60"
        >
          <svg {...iconProps} strokeWidth={2} className="size-5">
            <path d="m22 2-7 20-4-9-9-4Z" />
            <path d="M22 2 11 13" />
          </svg>
        </button>
      </form>
    </aside>
  );
}
