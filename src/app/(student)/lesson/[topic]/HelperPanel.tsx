"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/types";
import { askHelperAction } from "./actions";

type HelperPanelProps = {
  initialMessages: ChatMessage[];
  suggestions: string[];
};

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

/** AI helper chat beside the lesson, with suggestion chips. */
export function HelperPanel({ initialMessages, suggestions }: HelperPanelProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view without scrolling the page.
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, pending]);

  async function ask(question: string) {
    const text = question.trim();
    if (!text || pending) return;
    setMessages((prev) => [...prev, { from: "student", text }]);
    setDraft("");
    setPending(true);
    try {
      const reply = await askHelperAction(text);
      setMessages((prev) => [...prev, { from: "helper", text: reply }]);
    } finally {
      setPending(false);
    }
  }

  return (
    <aside
      id="tutor"
      aria-labelledby="tutor-title"
      className="flex scroll-mt-6 flex-col overflow-hidden rounded-[25px] bg-white shadow-float md:rounded-panel"
    >
      <div className="flex items-center justify-between gap-2.5 bg-surface px-4.5 py-3.5 md:gap-3 md:px-5.5 md:py-4.5">
        <div className="flex items-center gap-2.5 md:gap-3">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-white md:size-11"
          >
            <svg {...iconProps} strokeWidth={2} className="size-5 md:size-5.5">
              <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
            </svg>
          </span>
          <h2
            id="tutor-title"
            className="text-lg leading-tight font-bold md:text-xl"
          >
            AI туслах
          </h2>
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-muted">
          <svg {...iconProps} strokeWidth={2.4} className="size-3">
            <rect width="18" height="11" x="3" y="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Багш харна
        </span>
      </div>

      <div
        ref={logRef}
        role="log"
        aria-label="Туслахтай хийсэн чат"
        className="flex max-h-[min(420px,60vh)] flex-col gap-2 overflow-y-auto px-3.5 pt-3.5 pb-1.5 md:gap-2.5 md:px-4.5 md:pt-4.5 md:pb-2"
      >
        {messages.map((m, i) =>
          m.from === "helper" ? (
            <p
              key={i}
              className="max-w-[88%] self-start rounded-[20px_20px_20px_6px] bg-surface px-3.5 py-2.5 text-[15px] md:px-4 md:py-3"
            >
              {m.text}
            </p>
          ) : (
            <p
              key={i}
              className="max-w-[80%] self-end rounded-[20px_20px_6px_20px] bg-primary px-3.5 py-2.5 text-[15px] text-white md:px-4 md:py-3"
            >
              {m.text}
            </p>
          ),
        )}
        {pending ? (
          <p
            aria-label="Туслах бичиж байна"
            className="flex gap-1.25 self-start rounded-[20px_20px_20px_6px] bg-surface px-3.5 py-3 md:px-4"
          >
            {[0, 150, 300].map((delay) => (
              <span
                key={delay}
                className="size-1.75 animate-pulse rounded-full bg-primary"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </p>
        ) : null}
      </div>

      <div className="flex gap-1.5 overflow-x-auto px-3.5 pt-2 md:flex-wrap md:gap-2 md:overflow-visible md:px-4.5">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => ask(s)}
            disabled={pending}
            className="min-h-12 shrink-0 cursor-pointer rounded-full border-2 border-lavender bg-white px-3.5 text-sm font-semibold whitespace-nowrap text-ink hover:bg-lavender disabled:cursor-default disabled:opacity-60 md:min-h-11"
          >
            {s}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(draft);
        }}
        className="mx-3.5 mt-3 mb-4 flex items-center gap-2 rounded-full border-2 border-line bg-white py-1 focus-within:border-primary pr-1 pl-4 md:mx-4.5 md:mt-4 md:mb-5 md:py-1.5 md:pr-1.5 md:pl-4.5"
      >
        <label htmlFor="tutor-input" className="sr-only">
          Туслахад асуулт бичих
        </label>
        <input
          id="tutor-input"
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Асуух…"
          autoComplete="off"
          maxLength={500}
          className="h-12 min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-muted md:h-11 md:text-[15px]"
        />
        <button
          type="submit"
          aria-label="Илгээх"
          disabled={pending || !draft.trim()}
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
