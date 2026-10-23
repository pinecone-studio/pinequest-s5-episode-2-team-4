"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { ChatMessage } from "@/lib/types";
import { askHelperAction } from "./actions";

type HelperPanelProps = {
  /** The lesson the AI teacher talks about */
  subtopicId: string;
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

const sparkle = (
  <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
);

/**
 * The AI teacher as a messenger-style chat: a round button in the corner
 * that opens and folds away a chat window, with suggestion chips.
 */
export function HelperPanel({ subtopicId, initialMessages, suggestions }: HelperPanelProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);
  // The opening message counts as unread until the chat is first opened.
  const [seen, setSeen] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function show() {
    setOpen(true);
    setSeen(true);
  }

  // "Ask the helper" links (href="#tutor") elsewhere on the page open the chat.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if ((e.target as Element).closest?.('a[href="#tutor"]')) {
        e.preventDefault();
        show();
      }
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Focus the input on open; Escape folds the chat away.
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Keep the newest message in view without scrolling the page.
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, pending]);

  async function ask(question: string) {
    const text = question.trim();
    if (!text || pending) return;
    const history: ChatMessage[] = [...messages, { from: "student", text }];
    setMessages(history);
    setDraft("");
    setPending(true);
    try {
      const reply = await askHelperAction(subtopicId, history);
      setMessages((prev) => [...prev, { from: "helper", text: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { from: "helper", text: "Уучлаарай, холболт тасарлаа. Дахин асуугаад үзээрэй." },
      ]);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <aside
        id="tutor"
        aria-labelledby="tutor-title"
        inert={!open}
        className={cn(
          "fixed right-4 bottom-41 z-50 flex h-[min(560px,calc(100dvh-13rem))] w-[min(380px,calc(100vw-2rem))] origin-bottom-right flex-col overflow-hidden rounded-[25px] bg-white shadow-float transition-[opacity,scale,translate] duration-300 ease-out md:right-8 md:bottom-26 md:h-[min(600px,calc(100dvh-9rem))]",
          !open && "pointer-events-none translate-y-4 scale-90 opacity-0",
        )}
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
              AI багш
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Чатыг хураах"
            className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink hover:bg-lavender"
          >
            <svg {...iconProps} strokeWidth={2.4} className="size-5">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>

        <div
          ref={logRef}
          role="log"
          aria-label="Туслахтай хийсэн чат"
          className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3.5 pt-3.5 pb-1.5 md:gap-2.5 md:px-4.5 md:pt-4.5 md:pb-2"
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
            ref={inputRef}
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

      {/* The round chat button in the corner, above the mobile bottom nav */}
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : show())}
        aria-expanded={open}
        aria-controls="tutor"
        aria-label={open ? "AI багшийн чатыг хураах" : "AI багштай чатлах"}
        className="fixed right-4 bottom-24 z-50 flex size-14 cursor-pointer items-center justify-center rounded-full bg-primary text-white shadow-3d transition-transform hover:scale-105 active:translate-y-1 active:shadow-none md:right-8 md:bottom-8 md:size-15"
      >
        <svg {...iconProps} strokeWidth={2} className={cn("absolute size-6.5 transition-[opacity,rotate] duration-300", open ? "rotate-90 opacity-0" : "opacity-100")}>
          {sparkle}
        </svg>
        <svg {...iconProps} strokeWidth={2.6} className={cn("absolute size-6 transition-[opacity,rotate] duration-300", open ? "opacity-100" : "-rotate-90 opacity-0")}>
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
        {!seen && (
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 flex size-5.5 items-center justify-center rounded-full border-2 border-white bg-magenta text-[11px] font-bold"
          >
            1
          </span>
        )}
      </button>
    </>
  );
}
