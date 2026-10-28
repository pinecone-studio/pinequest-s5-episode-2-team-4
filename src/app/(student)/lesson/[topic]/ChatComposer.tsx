"use client";

import { useState } from "react";

type ChatComposerProps = {
  onSend: (text: string) => void;
};

/** The message box at the bottom of the question chat. */
export function ChatComposer({ onSend }: ChatComposerProps) {
  const [draft, setDraft] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const text = draft.trim();
        if (!text) return;
        onSend(text);
        setDraft("");
      }}
      className="mx-3.5 mt-3 mb-4 flex items-center gap-2 rounded-full border-2 border-line bg-white py-1 pr-1 pl-4 focus-within:border-primary md:mx-4.5 md:mt-4 md:mb-5 md:py-1.5 md:pr-1.5 md:pl-4.5"
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
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="size-5"
        >
          <path d="m22 2-7 20-4-9-9-4Z" />
          <path d="M22 2 11 13" />
        </svg>
      </button>
    </form>
  );
}
